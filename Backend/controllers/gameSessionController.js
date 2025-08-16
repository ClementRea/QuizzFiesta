const GameSession = require("../models/GameSession");
const Quiz = require("../models/Quiz");
const LobbyParticipant = require("../models/LobbyParticipant");
const GameParticipant = require("../models/GameParticipant");
const Question = require("../models/Question");

//Create new session
exports.createGameSession = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    const { settings = {} } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        status: "error",
        message: "Quiz non trouvé",
      });
    }

    const session = await GameSession.createSession(quizId, userId, settings);

    await session.populate([
      { path: "quiz", select: "title description logo" },
      { path: "organizer", select: "userName avatar" },
    ]);

    const questionsCount = await Question.countDocuments({
      _id: { $in: quiz.questions },
    });
    session.gameState.totalQuestions = questionsCount;
    await session.save();

    res.status(201).json({
      status: "success",
      data: {
        session: {
          id: session._id,
          sessionCode: session.sessionCode,
          status: session.status,
          quiz: session.quiz,
          organizer: session.organizer,
          settings: session.settings,
          participantCount: session.participantCount,
          gameState: session.gameState,
          createdAt: session.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Erreur création session:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la création de la session",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Join session by code => like ABC123
exports.joinSessionByCode = async (req, res) => {
  try {
    const { sessionCode } = req.params;
    const userId = req.user.id;

    const session = await GameSession.findOne({ sessionCode }).populate([
      { path: "quiz", select: "title description logo questions" },
      { path: "organizer", select: "userName avatar" },
    ]);

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session non trouvée avec ce code",
      });
    }

    if (!session.canJoin() && !session.canLateJoin()) {
      return res.status(400).json({
        status: "error",
        message:
          session.status === "finished"
            ? "Cette session est terminée"
            : "Cette session est pleine ou ne permet pas de rejoindre en cours",
      });
    }

    const existingParticipant = await LobbyParticipant.findOne({
      sessionId: session._id,
      userId,
    });

    if (existingParticipant) {
      return res.status(400).json({
        status: "error",
        message: "Vous êtes déjà dans cette session",
      });
    }

    res.json({
      status: "success",
      data: {
        session: {
          id: session._id,
          sessionCode: session.sessionCode,
          status: session.status,
          quiz: session.quiz,
          organizer: session.organizer,
          settings: session.settings,
          participantCount: session.participantCount,
          gameState: session.gameState,
          canJoin: session.canJoin(),
          canLateJoin: session.canLateJoin(),
        },
      },
    });
  } catch (error) {
    console.error("Erreur rejoindre session:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la recherche de session",
    });
  }
};

// Join session lobby
exports.joinSessionLobby = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const user = req.user;

    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session non trouvée",
      });
    }

    if (!session.canJoin()) {
      return res.status(400).json({
        status: "error",
        message: "Impossible de rejoindre cette session",
      });
    }

    let participant = await LobbyParticipant.findOne({
      sessionId,
      userId,
    });

    if (participant) {
      participant.connectionStatus = "connected";
      participant.lastSeen = new Date();
      await participant.save();
    } else {
      // Créer un nouveau participant
      const isOrganizer = session.organizerId.toString() === userId.toString();
      participant = new LobbyParticipant({
        sessionId,
        quizId: session.quizId,
        userId,
        userName: user.userName,
        avatar: user.avatar,
        isOrganizer,
        isReady: isOrganizer,
      });
      await participant.save();

      await session.updateParticipantCount(1);
    }

    const participants = await LobbyParticipant.find({
      sessionId,
      connectionStatus: { $ne: "disconnected" },
    }).select(
      "userId userName avatar isReady isOrganizer connectionStatus joinedAt",
    );

    res.json({
      status: "success",
      data: {
        participant,
        participants,
        session: {
          id: session._id,
          sessionCode: session.sessionCode,
          status: session.status,
          participantCount: session.participantCount,
          settings: session.settings,
        },
      },
    });
  } catch (error) {
    console.error("Erreur rejoindre lobby:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de l'entrée dans le lobby",
    });
  }
};

// leave session
exports.leaveSessionLobby = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session non trouvée",
      });
    }

    const result = await LobbyParticipant.deleteOne({
      sessionId,
      userId,
    });

    if (result.deletedCount > 0) {
      await session.updateParticipantCount(-1);

      if (session.organizerId.toString() === userId.toString()) {
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

    res.json({
      status: "success",
      message: "Vous avez quitté le lobby",
    });
  } catch (error) {
    console.error("Erreur quitter lobby:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la sortie du lobby",
    });
  }
};

// get all participants
exports.getSessionParticipants = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const participants = await LobbyParticipant.find({
      sessionId,
      connectionStatus: { $ne: "disconnected" },
    }).select(
      "userId userName avatar isReady isOrganizer connectionStatus joinedAt lastSeen",
    );

    res.json({
      status: "success",
      data: {
        participants,
      },
    });
  } catch (error) {
    console.error("Erreur récupération participants:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des participants",
    });
  }
};

// Set ready or not to a participant
exports.setParticipantReady = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { isReady } = req.body;
    const userId = req.user.id;

    const participant = await LobbyParticipant.findOneAndUpdate(
      { sessionId, userId },
      {
        isReady: Boolean(isReady),
        lastSeen: new Date(),
      },
      { new: true },
    );

    if (!participant) {
      return res.status(404).json({
        status: "error",
        message: "Participant non trouvé dans cette session",
      });
    }

    res.json({
      status: "success",
      data: {
        participant,
      },
    });
  } catch (error) {
    console.error("Erreur mise à jour ready:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la mise à jour",
    });
  }
};

// Start session, organizer anly
exports.startGameSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session non trouvée",
      });
    }

    if (session.organizerId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Seul l'organisateur peut démarrer la session",
      });
    }

    const readyParticipants = await LobbyParticipant.countDocuments({
      sessionId,
      isReady: true,
    });

    if (readyParticipants < 1) {
      return res.status(400).json({
        status: "error",
        message: "Au moins un participant (vous) doit être prêt pour démarrer",
      });
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

    res.json({
      status: "success",
      data: {
        session: {
          id: session._id,
          sessionCode: session.sessionCode,
          status: session.status,
          gameState: session.gameState,
          startedAt: session.startedAt,
        },
      },
    });
  } catch (error) {
    console.error("Erreur démarrage session:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors du démarrage de la session",
    });
  }
};

// get session state to block joining during quiz game
exports.getSessionState = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId).populate([
      { path: "quiz", select: "title description" },
      { path: "organizer", select: "userName" },
    ]);

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session non trouvée",
      });
    }

    res.json({
      status: "success",
      data: {
        session,
      },
    });
  } catch (error) {
    console.error("Erreur récupération état session:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération de l'état",
    });
  }
};

// end game session
exports.endGameSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session non trouvée",
      });
    }

    if (session.organizerId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Seul l'organisateur peut terminer la session",
      });
    }

    await session.endSession();

    await GameParticipant.updateMany({ sessionId }, { gameStatus: "finished" });

    await LobbyParticipant.deleteMany({ sessionId });

    res.json({
      status: "success",
      message: "Session terminée avec succès",
    });
  } catch (error) {
    console.error("Erreur fin session:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la fin de session",
    });
  }
};
