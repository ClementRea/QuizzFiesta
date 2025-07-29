const GameSession = require('../models/GameSession');
const Quiz = require('../models/Quiz');
const LobbyParticipant = require('../models/LobbyParticipant');
const GameParticipant = require('../models/GameParticipant');
const Question = require('../models/Question');

// Créer une nouvelle session de jeu
exports.createGameSession = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    const { settings = {} } = req.body;

    // Vérifier que le quiz existe
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    // Créer la session avec un code unique
    const session = await GameSession.createSession(quizId, userId, settings);

    // Populate les données du quiz pour la réponse
    await session.populate([
      { path: 'quiz', select: 'title description logo' },
      { path: 'organizer', select: 'userName avatar' }
    ]);

    // Compter le nombre de questions pour initialiser totalQuestions
    const questionsCount = await Question.countDocuments({ _id: { $in: quiz.questions } });
    session.gameState.totalQuestions = questionsCount;
    await session.save();

    res.status(201).json({
      status: 'success',
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
          createdAt: session.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur création session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création de la session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Rejoindre une session via le code
exports.joinSessionByCode = async (req, res) => {
  try {
    const { sessionCode } = req.params;
    const userId = req.user.id;

    // Trouver la session
    const session = await GameSession.findOne({ sessionCode })
      .populate([
        { path: 'quiz', select: 'title description logo questions' },
        { path: 'organizer', select: 'userName avatar' }
      ]);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session non trouvée avec ce code'
      });
    }

    // Vérifier si on peut rejoindre
    if (!session.canJoin() && !session.canLateJoin()) {
      return res.status(400).json({
        status: 'error',
        message: session.status === 'finished' 
          ? 'Cette session est terminée' 
          : 'Cette session est pleine ou ne permet pas de rejoindre en cours'
      });
    }

    // Vérifier si l'utilisateur n'est pas déjà dans la session
    const existingParticipant = await LobbyParticipant.findOne({
      sessionId: session._id,
      userId
    });

    if (existingParticipant) {
      return res.status(400).json({
        status: 'error',
        message: 'Vous êtes déjà dans cette session'
      });
    }

    res.json({
      status: 'success',
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
          canLateJoin: session.canLateJoin()
        }
      }
    });

  } catch (error) {
    console.error('Erreur rejoindre session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la recherche de session'
    });
  }
};

// Rejoindre le lobby d'une session
exports.joinSessionLobby = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const user = req.user;

    // Vérifier que la session existe et qu'on peut la rejoindre
    const session = await GameSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session non trouvée'
      });
    }

    if (!session.canJoin()) {
      return res.status(400).json({
        status: 'error',
        message: 'Impossible de rejoindre cette session'
      });
    }

    // Vérifier si déjà participant
    let participant = await LobbyParticipant.findOne({
      sessionId,
      userId
    });

    if (participant) {
      // Réactiver le participant
      participant.connectionStatus = 'connected';
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
        isReady: isOrganizer // L'organisateur est automatiquement prêt
      });
      await participant.save();

      // Mettre à jour le compteur de participants
      await session.updateParticipantCount(1);
    }

    // Récupérer tous les participants du lobby
    const participants = await LobbyParticipant.find({
      sessionId,
      connectionStatus: { $ne: 'disconnected' }
    }).select('userId userName avatar isReady isOrganizer connectionStatus joinedAt');

    res.json({
      status: 'success',
      data: {
        participant,
        participants,
        session: {
          id: session._id,
          sessionCode: session.sessionCode,
          status: session.status,
          participantCount: session.participantCount,
          settings: session.settings
        }
      }
    });

  } catch (error) {
    console.error('Erreur rejoindre lobby:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'entrée dans le lobby'
    });
  }
};

// Quitter le lobby d'une session  
exports.leaveSessionLobby = async (req, res) => {
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

    // Supprimer le participant du lobby
    const result = await LobbyParticipant.deleteOne({
      sessionId,
      userId
    });

    if (result.deletedCount > 0) {
      // Mettre à jour le compteur
      await session.updateParticipantCount(-1);

      // Si c'était l'organisateur et qu'il reste des participants, transférer à quelqu'un d'autre
      if (session.organizerId.toString() === userId.toString()) {
        const remainingParticipants = await LobbyParticipant.find({ sessionId });
        if (remainingParticipants.length > 0) {
          // Transférer à un autre participant
          const newOrganizer = remainingParticipants[0];
          newOrganizer.isOrganizer = true;
          await newOrganizer.save();
          
          session.organizerId = newOrganizer.userId;
          await session.save();
        } else {
          // Personne dans le lobby, marquer la session comme annulée
          session.status = 'cancelled';
          await session.save();
        }
      }
    }

    res.json({
      status: 'success',
      message: 'Vous avez quitté le lobby'
    });

  } catch (error) {
    console.error('Erreur quitter lobby:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la sortie du lobby'
    });
  }
};

// Récupérer les participants du lobby
exports.getSessionParticipants = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const participants = await LobbyParticipant.find({
      sessionId,
      connectionStatus: { $ne: 'disconnected' }
    }).select('userId userName avatar isReady isOrganizer connectionStatus joinedAt lastSeen');

    res.json({
      status: 'success',
      data: {
        participants
      }
    });

  } catch (error) {
    console.error('Erreur récupération participants:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des participants'
    });
  }
};

// Marquer un participant comme prêt/pas prêt
exports.setParticipantReady = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { isReady } = req.body;
    const userId = req.user.id;

    const participant = await LobbyParticipant.findOneAndUpdate(
      { sessionId, userId },
      { 
        isReady: Boolean(isReady),
        lastSeen: new Date()
      },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({
        status: 'error',
        message: 'Participant non trouvé dans cette session'
      });
    }

    res.json({
      status: 'success',
      data: {
        participant
      }
    });

  } catch (error) {
    console.error('Erreur mise à jour ready:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// Démarrer la session (organisateur seulement)
exports.startGameSession = async (req, res) => {
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
        message: 'Seul l\'organisateur peut démarrer la session'
      });
    }

    // Vérifier qu'il y a au moins 1 participant prêt (incluant l'organisateur)
    const readyParticipants = await LobbyParticipant.countDocuments({
      sessionId,
      isReady: true
    });

    if (readyParticipants < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Au moins un participant (vous) doit être prêt pour démarrer'
      });
    }

    // Démarrer la session
    await session.startGame();

    // Migrer tous les participants du lobby vers le jeu
    const lobbyParticipants = await LobbyParticipant.find({
      sessionId,
      connectionStatus: 'connected'
    });

    // Supprimer les anciens GameParticipant pour ce quiz/utilisateurs (éviter les doublons)
    const userIds = lobbyParticipants.map(p => p.userId);
    await GameParticipant.deleteMany({
      quizId: session.quizId, 
      userId: { $in: userIds }
    });

    // Créer les nouveaux GameParticipant
    const gameParticipants = lobbyParticipants.map(p => ({
      sessionId,
      quizId: session.quizId,
      userId: p.userId,
      userName: p.userName,
      avatar: p.avatar,
      currentQuestionIndex: 0,
      totalScore: 0,
      gameStatus: 'playing',
      answers: []
    }));

    await GameParticipant.insertMany(gameParticipants);

    // Nettoyer le lobby (optionnel, on peut le garder pour le retour)
    // await LobbyParticipant.deleteMany({ sessionId });

    res.json({
      status: 'success',
      data: {
        session: {
          id: session._id,
          sessionCode: session.sessionCode,
          status: session.status,
          gameState: session.gameState,
          startedAt: session.startedAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur démarrage session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du démarrage de la session'
    });
  }
};

// Récupérer l'état de la session
exports.getSessionState = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await GameSession.findById(sessionId)
      .populate([
        { path: 'quiz', select: 'title description' },
        { path: 'organizer', select: 'userName' }
      ]);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session non trouvée'
      });
    }

    res.json({
      status: 'success',
      data: {
        session
      }
    });

  } catch (error) {
    console.error('Erreur récupération état session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de l\'état'
    });
  }
};

// Terminer une session (nettoyage)
exports.endGameSession = async (req, res) => {
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

    // Seul l'organisateur peut terminer la session
    if (session.organizerId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Seul l\'organisateur peut terminer la session'
      });
    }

    // Terminer la session
    await session.endSession();

    // Marquer tous les participants comme terminés
    await GameParticipant.updateMany(
      { sessionId },
      { gameStatus: 'finished' }
    );

    // Nettoyer le lobby
    await LobbyParticipant.deleteMany({ sessionId });

    res.json({
      status: 'success',
      message: 'Session terminée avec succès'
    });

  } catch (error) {
    console.error('Erreur fin session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la fin de session'
    });
  }
};