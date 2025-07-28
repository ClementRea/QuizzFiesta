const GameSession = require('../models/GameSession');
const GameParticipant = require('../models/GameParticipant');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

// Récupérer les questions d'une session
exports.getSessionQuestions = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Vérifier que la session existe et que l'utilisateur y participe
    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session non trouvée'
      });
    }

    const participant = await GameParticipant.findOne({
      sessionId,
      userId
    });

    if (!participant) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous ne participez pas à cette session'
      });
    }

    // Récupérer le quiz et ses questions
    const quiz = await Quiz.findById(session.quizId).populate({
      path: 'questions',
      model: 'Question'
    });

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    // Retourner seulement la question courante selon l'état de la session
    const currentQuestionIndex = session.gameState.currentQuestionIndex;
    const currentQuestion = quiz.questions[currentQuestionIndex];

    if (!currentQuestion) {
      return res.status(400).json({
        status: 'error',
        message: 'Plus de questions disponibles'
      });
    }

    // Ne pas renvoyer les bonnes réponses
    const questionForClient = {
      id: currentQuestion._id,
      title: currentQuestion.title,
      description: currentQuestion.description,
      type: currentQuestion.type,
      answers: currentQuestion.answers.map(answer => ({
        text: answer.text,
        description: answer.description
      })),
      points: currentQuestion.points,
      timeLimit: session.settings.timePerQuestion,
      image: currentQuestion.image,
      items: currentQuestion.items, // Pour les questions ORDER
      questionIndex: currentQuestionIndex,
      totalQuestions: session.gameState.totalQuestions
    };

    res.json({
      status: 'success',
      data: {
        question: questionForClient,
        gameState: {
          currentQuestionIndex: session.gameState.currentQuestionIndex,
          totalQuestions: session.gameState.totalQuestions,
          currentQuestionStartTime: session.gameState.currentQuestionStartTime,
          timeRemaining: session.settings.timePerQuestion
        },
        participant: {
          currentQuestionIndex: participant.currentQuestionIndex,
          totalScore: participant.totalScore,
          gameStatus: participant.gameStatus
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération questions session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des questions'
    });
  }
};

// Soumettre une réponse dans une session
exports.submitSessionAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answer } = req.body;
    const userId = req.user.id;

    // Vérifier que la session existe et est en cours
    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session non trouvée'
      });
    }

    if (session.status !== 'playing') {
      return res.status(400).json({
        status: 'error',
        message: 'La session n\'est pas en état de jeu'
      });
    }

    // Récupérer le participant
    const participant = await GameParticipant.findOne({
      sessionId,
      userId
    });

    if (!participant) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous ne participez pas à cette session'
      });
    }

    // Vérifier que la question correspond à la question courante
    const currentQuestionIndex = session.gameState.currentQuestionIndex;
    
    // Vérifier si le participant a déjà répondu à cette question
    const existingAnswer = participant.answers.find(
      a => a.questionIndex === currentQuestionIndex
    );

    if (existingAnswer) {
      return res.status(400).json({
        status: 'error',
        message: 'Vous avez déjà répondu à cette question'
      });
    }

    // Récupérer la question pour vérifier la réponse
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Question non trouvée'
      });
    }

    // Calculer les points et vérifier la réponse
    let isCorrect = false;
    let points = 0;
    const timeSpent = Date.now() - session.gameState.currentQuestionStartTime.getTime();

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        if (Array.isArray(question.correctAnswers)) {
          // Réponses multiples
          isCorrect = Array.isArray(answer) && 
            answer.length === question.correctAnswers.length &&
            answer.every(a => question.correctAnswers.includes(a));
        } else {
          // Réponse unique
          isCorrect = answer === question.correctAnswers;
        }
        break;
        
      case 'TRUE_FALSE':
        isCorrect = answer === question.correctAnswers;
        break;
        
      case 'CLASSIC':
        // Comparaison de texte (insensible à la casse et espaces)
        const userAnswer = String(answer).trim().toLowerCase();
        const correctAnswer = String(question.correctAnswers).trim().toLowerCase();
        isCorrect = userAnswer === correctAnswer;
        break;
        
      case 'ORDER':
        // Vérifier l'ordre des éléments
        isCorrect = Array.isArray(answer) && 
          Array.isArray(question.correctAnswers) &&
          answer.length === question.correctAnswers.length &&
          answer.every((item, index) => item === question.correctAnswers[index]);
        break;
        
      case 'ASSOCIATION':
        // Vérifier les associations
        isCorrect = Array.isArray(answer) && 
          Array.isArray(question.correctAnswers) &&
          answer.length === question.correctAnswers.length &&
          answer.every(pair => 
            question.correctAnswers.some(correctPair => 
              correctPair.leftIndex === pair.leftIndex && 
              correctPair.rightIndex === pair.rightIndex
            )
          );
        break;
        
      case 'FIND_INTRUDER':
        isCorrect = answer === question.correctAnswers;
        break;
    }

    // Calculer les points basés sur la rapidité si correct
    if (isCorrect) {
      const basePoints = question.points || 100;
      const maxTime = session.settings.timePerQuestion * 1000; // en ms
      const timeBonus = Math.max(0, (maxTime - timeSpent) / maxTime);
      points = Math.round(basePoints * (0.5 + 0.5 * timeBonus)); // 50% base + 50% bonus temps
    }

    // Ajouter la réponse au participant
    participant.answers.push({
      questionId,
      questionIndex: currentQuestionIndex,
      answer,
      submittedAt: new Date(),
      isCorrect,
      points,
      timeSpent
    });

    participant.totalScore += points;
    participant.lastActivity = new Date();
    participant.lastQuestionAnsweredAt = new Date();

    await participant.save();

    res.json({
      status: 'success',
      data: {
        isCorrect,
        points,
        totalScore: participant.totalScore,
        correctAnswer: session.settings.showCorrectAnswers ? question.correctAnswers : undefined,
        timeSpent
      }
    });

  } catch (error) {
    console.error('Erreur soumission réponse session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la soumission de la réponse'
    });
  }
};

// Passer à la question suivante (organisateur)
exports.nextSessionQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session non trouvée'
      });
    }

    // Vérifier que c'est l'organisateur
    if (session.organizerId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Seul l\'organisateur peut passer à la question suivante'
      });
    }

    if (session.status !== 'playing') {
      return res.status(400).json({
        status: 'error',
        message: 'La session n\'est pas en cours'
      });
    }

    // Passer à la question suivante
    await session.nextQuestion();

    res.json({
      status: 'success',
      data: {
        gameState: session.gameState,
        sessionStatus: session.status
      }
    });

  } catch (error) {
    console.error('Erreur question suivante:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du passage à la question suivante'
    });
  }
};

// Récupérer le classement de la session
exports.getSessionLeaderboard = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session non trouvée'
      });
    }

    // Récupérer tous les participants triés par score
    const participants = await GameParticipant.find({ sessionId })
      .sort({ totalScore: -1, lastQuestionAnsweredAt: 1 }) // Score desc, puis temps asc pour départager
      .select('userId userName avatar totalScore answers gameStatus');

    // Ajouter le rang à chaque participant
    const leaderboard = participants.map((participant, index) => ({
      rank: index + 1,
      userId: participant.userId,
      userName: participant.userName,
      avatar: participant.avatar,
      totalScore: participant.totalScore,
      answersCount: participant.answers.length,
      correctAnswers: participant.answers.filter(a => a.isCorrect).length,
      gameStatus: participant.gameStatus
    }));

    res.json({
      status: 'success',
      data: {
        leaderboard,
        session: {
          id: session._id,
          status: session.status,
          gameState: session.gameState
        }
      }
    });

  } catch (error) {
    console.error('Erreur leaderboard session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération du classement'
    });
  }
};

// Récupérer l'état d'un participant dans une session
exports.getParticipantState = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const participant = await GameParticipant.findOne({
      sessionId,
      userId
    });

    if (!participant) {
      return res.status(404).json({
        status: 'error',
        message: 'Participant non trouvé dans cette session'
      });
    }

    const session = await GameSession.findById(sessionId);

    res.json({
      status: 'success',
      data: {
        participant: {
          currentQuestionIndex: participant.currentQuestionIndex,
          totalScore: participant.totalScore,
          gameStatus: participant.gameStatus,
          answersCount: participant.answers.length,
          correctAnswers: participant.answers.filter(a => a.isCorrect).length
        },
        session: {
          gameState: session.gameState,
          status: session.status
        }
      }
    });

  } catch (error) {
    console.error('Erreur état participant:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de l\'état'
    });
  }
};