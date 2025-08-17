const jwt = require("jsonwebtoken");

const User = require("../models/User");
const GameSession = require("../models/GameSession");
const LobbyParticipant = require("../models/LobbyParticipant");
const GameParticipant = require("../models/GameParticipant");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");

class SocketManager {
  constructor(io) {
    this.io = io;
    this.sessionRooms = new Map(); // sessionId -> Set of socketIds
    this.userSockets = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId
    this.sessionTimers = new Map(); // sessionId -> timer

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on("connection", (socket) => {
      if (socket.user) {
        this.userSockets.set(socket.user._id.toString(), socket.id);
        this.socketUsers.set(socket.id, socket.user._id.toString());
      }

      socket.on("lobby:join", this.handleLobbyJoin.bind(this, socket));
      socket.on("lobby:leave", this.handleLobbyLeave.bind(this, socket));
      socket.on("lobby:ready", this.handleLobbyReady.bind(this, socket));
      socket.on("lobby:start", this.handleLobbyStart.bind(this, socket));

      socket.on("game:join", this.handleGameJoin.bind(this, socket));
      socket.on("game:answer", this.handleGameAnswer.bind(this, socket));
      socket.on(
        "game:next-question",
        this.handleNextQuestion.bind(this, socket),
      );
      socket.on("game:end", this.handleEndGame.bind(this, socket));

      socket.on("disconnect", this.handleDisconnect.bind(this, socket));
    });
  }

  async authenticateSocket(socket, next) {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Token manquant"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("Utilisateur non trouvé"));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error("Erreur authentification socket:", error);
      next(new Error("Token invalide"));
    }
  }

  async handleLobbyJoin(socket, { sessionId }) {
    try {
      const userId = socket.user._id.toString();

      const session = await GameSession.findById(sessionId);
      if (!session) {
        socket.emit("error", { message: "Session non trouvée" });
        return;
      }

      if (!session.canJoin()) {
        socket.emit("error", {
          message: "Impossible de rejoindre cette session",
        });
        return;
      }

      socket.join(`lobby_${sessionId}`);
      this.addToSessionRoom(sessionId, socket.id);

      let participant = await LobbyParticipant.findOne({ sessionId, userId });

      if (participant) {
        participant.connectionStatus = "connected";
        participant.lastSeen = new Date();
        await participant.save();
      } else {
        const isOrganizer = session.organizerId.toString() === userId;
        participant = new LobbyParticipant({
          sessionId,
          quizId: session.quizId,
          userId,
          userName: socket.user.userName,
          avatar: socket.user.avatar,
          isOrganizer,
          isReady: isOrganizer,
        });
        await participant.save();

        await session.updateParticipantCount(1);
      }

      await this.broadcastLobbyUpdate(sessionId);

      socket.to(`lobby_${sessionId}`).emit("lobby:user-joined", {
        user: {
          userId: participant.userId,
          userName: participant.userName,
          avatar: participant.avatar,
          isOrganizer: participant.isOrganizer,
        },
      });

      socket.emit("lobby:joined", {
        sessionId,
        participant: {
          isReady: participant.isReady,
          isOrganizer: participant.isOrganizer,
        },
      });
    } catch (error) {
      console.error("Erreur lobby:join:", error);
      socket.emit("error", {
        message: "Erreur lors de l'entrée dans le lobby",
      });
    }
  }

  async handleLobbyLeave(socket, { sessionId }) {
    try {
      const userId = socket.user._id.toString();

      socket.leave(`lobby_${sessionId}`);
      this.removeFromSessionRoom(sessionId, socket.id);

      const participant = await LobbyParticipant.findOne({ sessionId, userId });
      if (participant) {
        await LobbyParticipant.deleteOne({ sessionId, userId });

        const session = await GameSession.findById(sessionId);
        if (session) {
          await session.updateParticipantCount(-1);

          if (session.organizerId.toString() === userId) {
            const remainingParticipants = await LobbyParticipant.find({
              sessionId,
            });
            if (remainingParticipants.length > 0) {
              const newOrganizer = remainingParticipants[0];
              newOrganizer.isOrganizer = true;
              await newOrganizer.save();

              session.organizerId = newOrganizer.userId;
              await session.save();
            } else {
              session.status = "cancelled";
              await session.save();
            }
          }
        }

        socket.to(`lobby_${sessionId}`).emit("lobby:user-left", {
          userId: participant.userId,
          userName: participant.userName,
        });

        await this.broadcastLobbyUpdate(sessionId);
      }
    } catch (error) {
      console.error("Erreur lobby:leave:", error);
      socket.emit("error", { message: "Erreur lors de la sortie du lobby" });
    }
  }

  async handleLobbyReady(socket, { sessionId, isReady }) {
    try {
      const userId = socket.user._id.toString();

      const participant = await LobbyParticipant.findOneAndUpdate(
        { sessionId, userId },
        {
          isReady: Boolean(isReady),
          lastSeen: new Date(),
        },
        { new: true },
      );

      if (participant) {
        this.io.to(`lobby_${sessionId}`).emit("lobby:user-ready-changed", {
          userId: participant.userId,
          userName: participant.userName,
          isReady: participant.isReady,
        });

        await this.broadcastLobbyUpdate(sessionId);
      }
    } catch (error) {
      console.error("Erreur lobby:ready:", error);
      socket.emit("error", {
        message: "Erreur lors de la mise à jour du statut",
      });
    }
  }

  async handleLobbyStart(socket, { sessionId }) {
    try {
      const userId = socket.user._id.toString();

      const session = await GameSession.findById(sessionId);
      if (!session) {
        socket.emit("error", { message: "Session non trouvée" });
        return;
      }

      if (session.organizerId.toString() !== userId) {
        socket.emit("error", { message: "Seul l'organisateur peut démarrer" });
        return;
      }

      const readyParticipants = await LobbyParticipant.countDocuments({
        sessionId,
        isReady: true,
      });

      if (readyParticipants < 1) {
        socket.emit("error", {
          message: "Au moins un participant doit être prêt",
        });
        return;
      }

      await session.startGame();

      const lobbyParticipants = await LobbyParticipant.find({
        sessionId,
        connectionStatus: "connected",
      });

      const userIds = lobbyParticipants.map((p) => p.userId);
      await GameParticipant.deleteMany({
        quizId: session.quizId,
        userId: { $in: userIds },
      });

      const gameParticipants = lobbyParticipants.map((p) => ({
        sessionId,
        quizId: session.quizId,
        userId: p.userId,
        userName: p.userName,
        avatar: p.avatar,
        currentQuestionIndex: 0,
        totalScore: 0,
        gameStatus: "playing",
        answers: [],
      }));

      await GameParticipant.insertMany(gameParticipants);

      this.io.to(`lobby_${sessionId}`).emit("lobby:session-started", {
        sessionId,
        gameState: session.gameState,
      });

      // Démarrer le timer et diffuser la première question
      await this.startQuestionTimerWithQuestionTime(sessionId);
      await this.broadcastCurrentQuestion(sessionId);
    } catch (error) {
      console.error("Erreur lobby:start:", error);
      socket.emit("error", { message: "Erreur lors du démarrage" });
    }
  }

  async handleGameJoin(socket, { sessionId }) {
    try {
      const userId = socket.user._id.toString();
      console.log(`🎮 handleGameJoin: User ${userId} joining session ${sessionId}`);

      const session = await GameSession.findById(sessionId);
      const participant = await GameParticipant.findOne({ sessionId, userId });

      if (!session || !participant) {
        console.log("❌ Session ou participant non trouvé:", { session: !!session, participant: !!participant });
        socket.emit("error", { message: "Session ou participant non trouvé" });
        return;
      }

      console.log(`✅ Session trouvée: ${session.status}, GameState:`, session.gameState);

      socket.join(`game_${sessionId}`);
      this.addToSessionRoom(sessionId, socket.id, "game");

      await this.sendGameState(socket, sessionId);
    } catch (error) {
      console.error("Erreur game:join:", error);
      socket.emit("error", { message: "Erreur lors de l'entrée dans le jeu" });
    }
  }

  async handleGameAnswer(socket, { sessionId, questionId, answer }) {
    try {
      const userId = socket.user._id.toString();

      const session = await GameSession.findById(sessionId);
      if (!session || session.status !== "playing") {
        socket.emit("error", { message: "Session non valide" });
        return;
      }

      const participant = await GameParticipant.findOne({ sessionId, userId });
      if (!participant) {
        socket.emit("error", { message: "Participant non trouvé" });
        return;
      }

      const currentQuestionIndex = session.gameState.currentQuestionIndex;
      const existingAnswer = participant.answers.find(
        (a) => a.questionIndex === currentQuestionIndex,
      );

      if (existingAnswer) {
        socket.emit("error", {
          message: "Vous avez déjà répondu à cette question",
        });
        return;
      }

      const question = await Question.findById(questionId);

      if (!question) {
        socket.emit("error", { message: "Question non trouvée" });
        return;
      }

      const result = await this.processAnswer(
        participant,
        question,
        answer,
        session,
        currentQuestionIndex,
      );

      socket.emit("game:answer-result", result);

      const organizerSocketId = this.userSockets.get(
        session.organizerId.toString(),
      );
      if (organizerSocketId) {
        this.io.to(organizerSocketId).emit("game:participant-answered", {
          userId: participant.userId,
          userName: participant.userName,
          isCorrect: result.isCorrect,
          points: result.points,
        });
      }
    } catch (error) {
      console.error("Erreur game:answer:", error);
      socket.emit("error", { message: "Erreur lors de la soumission" });
    }
  }

  async handleNextQuestion(socket, { sessionId }) {
    try {
      const userId = socket.user._id.toString();

      const session = await GameSession.findById(sessionId);
      if (!session) {
        socket.emit("error", { message: "Session non trouvée" });
        return;
      }

      if (session.organizerId.toString() !== userId) {
        socket.emit("error", {
          message: "Seul l'organisateur peut passer à la question suivante",
        });
        return;
      }

      this.stopQuestionTimer(sessionId);

      await session.nextQuestion();

      if (session.status === "finished") {
        this.io.to(`game_${sessionId}`).emit("game:session-ended", {
          finalLeaderboard: await this.getLeaderboard(sessionId),
        });
      } else {
        this.io.to(`game_${sessionId}`).emit("game:new-question", {
          gameState: session.gameState,
        });

        await this.startQuestionTimerWithQuestionTime(sessionId);

        await this.broadcastCurrentQuestion(sessionId);
      }
    } catch (error) {
      console.error("Erreur game:next-question:", error);
      socket.emit("error", {
        message: "Erreur lors du passage à la question suivante",
      });
    }
  }

  async handleEndGame(socket, { sessionId }) {
    try {
      const userId = socket.user._id.toString();

      const session = await GameSession.findById(sessionId);
      if (!session) {
        socket.emit("error", { message: "Session non trouvée" });
        return;
      }

      if (session.organizerId.toString() !== userId) {
        socket.emit("error", {
          message: "Seul l'organisateur peut terminer la session",
        });
        return;
      }

      this.stopQuestionTimer(sessionId);

      await session.endSession();
      await GameParticipant.updateMany(
        { sessionId },
        { gameStatus: "finished" },
      );

      this.io.to(`game_${sessionId}`).emit("game:session-ended", {
        finalLeaderboard: await this.getLeaderboard(sessionId),
      });

      this.cleanupSession(sessionId);
    } catch (error) {
      console.error("Erreur game:end:", error);
      socket.emit("error", { message: "Erreur lors de la fin de session" });
    }
  }

  async handleDisconnect(socket) {
    const userId = this.socketUsers.get(socket.id);
    if (userId) {
      this.userSockets.delete(userId);
      this.socketUsers.delete(socket.id);

      await LobbyParticipant.updateMany(
        { userId },
        { connectionStatus: "disconnected", lastSeen: new Date() },
      );
    }
  }

  getCorrectAnswers(question) {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        const correctAnswers = question.answer
          .map((ans, index) => (ans.isCorrect ? index : null))
          .filter((index) => index !== null);
        return correctAnswers.length === 1 ? correctAnswers[0] : correctAnswers;

      case "TRUE_FALSE":
        const correctTF = question.answer.find((ans) => ans.isCorrect);
        return correctTF
          ? correctTF.text.toLowerCase() === "true" ||
              correctTF.text.toLowerCase() === "vrai"
          : false;

      case "CLASSIC":
        const correctClassic = question.answer.find((ans) => ans.isCorrect);
        return correctClassic ? correctClassic.text : "";

      case "ORDER":
        return question.answer
          .sort((a, b) => a.correctOrder - b.correctOrder)
          .map((ans) => ans.text);

      case "ASSOCIATION":
        return question.answer.filter((ans) => ans.isCorrect);

      case "FIND_INTRUDER":
        const intruder = question.answer.find((ans) => ans.isCorrect);
        return intruder ? question.answer.indexOf(intruder) : 0;

      default:
        return null;
    }
  }

  normalizeAnswer(answer) {
    return answer
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  addToSessionRoom(sessionId, socketId, type = "lobby") {
    const key = `${type}_${sessionId}`;
    if (!this.sessionRooms.has(key)) {
      this.sessionRooms.set(key, new Set());
    }
    this.sessionRooms.get(key).add(socketId);
  }

  removeFromSessionRoom(sessionId, socketId, type = "lobby") {
    const key = `${type}_${sessionId}`;
    const room = this.sessionRooms.get(key);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.sessionRooms.delete(key);
      }
    }
  }

  async broadcastLobbyUpdate(sessionId) {
    try {
      const participants = await LobbyParticipant.find({
        sessionId,
        connectionStatus: { $ne: "disconnected" },
      }).select("userId userName avatar isReady isOrganizer connectionStatus");

      const session = await GameSession.findById(sessionId);

      this.io.to(`lobby_${sessionId}`).emit("lobby:participants-updated", {
        participants,
        session: {
          participantCount: session.participantCount,
          status: session.status,
        },
      });
    } catch (error) {
      console.error("Erreur broadcastLobbyUpdate:", error);
    }
  }

  async sendGameState(socket, sessionId) {
    try {
      console.log(`📤 sendGameState pour session ${sessionId}`);
      const session = await GameSession.findById(sessionId);
      const quiz = await Quiz.findById(session.quizId).populate("questions");
      
      console.log(`📊 Session gameState:`, session.gameState);
      console.log(`📚 Quiz questions count: ${quiz.questions.length}`);
      
      const currentQuestion =
        quiz.questions[session.gameState.currentQuestionIndex];

      console.log(`📝 Current question index: ${session.gameState.currentQuestionIndex}, Question:`, !!currentQuestion);

      if (currentQuestion) {
        const questionForClient = {
          id: currentQuestion._id,
          title: currentQuestion.title || currentQuestion.content,
          description: currentQuestion.description,
          type: currentQuestion.type,
          answers: currentQuestion.answer
            ? currentQuestion.answer.map((answer) => ({
                text: answer.text,
                description: answer.description,
              }))
            : [],
          points: currentQuestion.points,
          timeLimit:
            currentQuestion.timeGiven || session.settings.timePerQuestion,
          image: currentQuestion.image,
          items: currentQuestion.items,
        };

        const questionTime =
          currentQuestion.timeGiven || session.settings.timePerQuestion;
        
        console.log(`📤 Envoi game:current-question via WebSocket`);
        socket.emit("game:current-question", {
          question: questionForClient,
          gameState: session.gameState,
          timeRemaining: this.getTimeRemaining(sessionId, questionTime),
        });
      } else {
        console.log(`❌ Aucune question courante disponible`);
      }

      const leaderboard = await this.getLeaderboard(sessionId);
      socket.emit("game:leaderboard-updated", { leaderboard });
    } catch (error) {
      console.error("Erreur sendGameState:", error);
    }
  }

  async broadcastCurrentQuestion(sessionId) {
    try {
      const session = await GameSession.findById(sessionId);
      const quiz = await Quiz.findById(session.quizId).populate("questions");
      const currentQuestion =
        quiz.questions[session.gameState.currentQuestionIndex];

      if (currentQuestion) {
        const questionTime =
          currentQuestion.timeGiven || session.settings.timePerQuestion;
        const questionForClient = {
          id: currentQuestion._id,
          title: currentQuestion.title || currentQuestion.content,
          description: currentQuestion.description,
          type: currentQuestion.type,
          answers: currentQuestion.answer
            ? currentQuestion.answer.map((answer) => ({
                text: answer.text,
                description: answer.description,
              }))
            : [],
          points: currentQuestion.points,
          timeLimit: questionTime,
          image: currentQuestion.image,
          items: currentQuestion.items,
        };

        this.io.to(`game_${sessionId}`).emit("game:current-question", {
          question: questionForClient,
          gameState: session.gameState,
          timeRemaining: questionTime * 1000,
        });
      }
    } catch (error) {
      console.error("Erreur broadcastCurrentQuestion:", error);
    }
  }

  async processAnswer(
    participant,
    question,
    answer,
    session,
    currentQuestionIndex,
  ) {
    let isCorrect = false;
    let points = 0;
    const timeSpent =
      Date.now() - session.gameState.currentQuestionStartTime.getTime();

    const correctAnswers = this.getCorrectAnswers(question);

    switch (question.type) {
      case "MULTIPLE_CHOICE":
        if (Array.isArray(correctAnswers)) {
          isCorrect =
            Array.isArray(answer) &&
            answer.length === correctAnswers.length &&
            answer.every((a) => correctAnswers.includes(a));
        } else {
          isCorrect = answer === correctAnswers;
        }
        break;
      case "TRUE_FALSE":
        isCorrect = answer === correctAnswers;
        break;
      case "CLASSIC":
        const userAnswer = this.normalizeAnswer(String(answer));
        const correctAnswer = this.normalizeAnswer(String(correctAnswers));
        isCorrect = userAnswer === correctAnswer;
        break;
      case "ORDER":
        isCorrect =
          Array.isArray(answer) &&
          Array.isArray(correctAnswers) &&
          answer.length === correctAnswers.length &&
          answer.every((item, index) => item === correctAnswers[index]);
        break;
      case "ASSOCIATION":
        isCorrect =
          Array.isArray(answer) &&
          Array.isArray(correctAnswers) &&
          answer.length === correctAnswers.length &&
          answer.every((pair) =>
            correctAnswers.some(
              (correctPair) =>
                correctPair.leftIndex === pair.leftIndex &&
                correctPair.rightIndex === pair.rightIndex,
            ),
          );
        break;
      case "FIND_INTRUDER":
        isCorrect = answer === correctAnswers;
        break;
    }

    if (isCorrect) {
      const basePoints = question.points || 100;
      const questionTime =
        question.timeGiven || session.settings.timePerQuestion;
      const maxTime = questionTime * 1000;
      const timeBonus = Math.max(0, (maxTime - timeSpent) / maxTime);
      points = Math.round(basePoints * (0.5 + 0.5 * timeBonus));
    }

    participant.answers.push({
      questionId: question._id,
      questionIndex: currentQuestionIndex,
      answer,
      submittedAt: new Date(),
      isCorrect,
      points,
      timeSpent,
    });

    participant.totalScore += points;
    participant.lastActivity = new Date();
    participant.lastQuestionAnsweredAt = new Date();

    await participant.save();

    return {
      isCorrect,
      points,
      totalScore: participant.totalScore,
      correctAnswer: session.settings.showCorrectAnswers
        ? correctAnswers
        : undefined,
      timeSpent,
    };
  }

  async getLeaderboard(sessionId) {
    try {
      const participants = await GameParticipant.find({ sessionId })
        .sort({ totalScore: -1, lastQuestionAnsweredAt: 1 })
        .select("userId userName avatar totalScore answers gameStatus");

      return participants.map((participant, index) => ({
        rank: index + 1,
        userId: participant.userId,
        userName: participant.userName,
        avatar: participant.avatar,
        totalScore: participant.totalScore,
        answersCount: participant.answers.length,
        correctAnswers: participant.answers.filter((a) => a.isCorrect).length,
        gameStatus: participant.gameStatus,
      }));
    } catch (error) {
      console.error("Erreur getLeaderboard:", error);
      return [];
    }
  }

  async startQuestionTimerWithQuestionTime(sessionId) {
    try {
      const session = await GameSession.findById(sessionId);
      if (!session) return;

      const quiz = await Quiz.findById(session.quizId).populate("questions");
      const currentQuestion =
        quiz.questions[session.gameState.currentQuestionIndex];

      if (currentQuestion) {
        const questionTime =
          currentQuestion.timeGiven || session.settings.timePerQuestion;
        this.startQuestionTimer(sessionId, questionTime);
      }
    } catch (error) {
      console.error("Erreur startQuestionTimerWithQuestionTime:", error);
    }
  }

  startQuestionTimer(sessionId, timeInSeconds) {
    this.stopQuestionTimer(sessionId);

    const timer = setTimeout(async () => {
      try {
        this.io.to(`game_${sessionId}`).emit("game:time-up", {
          currentQuestionIndex: this.gameState?.currentQuestionIndex || 0,
        });

        const session = await GameSession.findById(sessionId);
        if (!session) return;

        setTimeout(async () => {
          try {
            await session.nextQuestion();

            if (session.status === "finished") {
              this.io.to(`game_${sessionId}`).emit("game:session-ended", {
                finalLeaderboard: await this.getLeaderboard(sessionId),
              });
              this.cleanupSession(sessionId);
            } else {
              this.io.to(`game_${sessionId}`).emit("game:new-question", {
                gameState: session.gameState,
              });

              await this.startQuestionTimerWithQuestionTime(sessionId);

              await this.broadcastCurrentQuestion(sessionId);
            }
          } catch (error) {
            console.error(
              "Erreur passage automatique question suivante:",
              error,
            );
          }
        }, 3000);
      } catch (error) {
        console.error("Erreur timer question:", error);
      }
    }, timeInSeconds * 1000);

    this.sessionTimers.set(sessionId, {
      timer,
      startTime: Date.now(),
      duration: timeInSeconds * 1000,
    });
  }

  stopQuestionTimer(sessionId) {
    const timerData = this.sessionTimers.get(sessionId);
    if (timerData) {
      clearTimeout(timerData.timer);
      this.sessionTimers.delete(sessionId);
    }
  }

  getTimeRemaining(sessionId, totalTimeInSeconds) {
    const timerData = this.sessionTimers.get(sessionId);
    if (!timerData) return 0;

    const elapsed = Date.now() - timerData.startTime;
    return Math.max(0, timerData.duration - elapsed);
  }

  cleanupSession(sessionId) {
    this.stopQuestionTimer(sessionId);

    this.sessionRooms.delete(`lobby_${sessionId}`);
    this.sessionRooms.delete(`game_${sessionId}`);
  }
}

module.exports = SocketManager;
