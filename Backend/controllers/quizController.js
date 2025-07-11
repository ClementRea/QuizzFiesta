const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const LobbyParticipant = require('../models/LobbyParticipant');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Filtrer les champs
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Génération du code pour rejoindre un quiz
const generateJoinCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Créer un quiz
exports.quizCreate = async (req, res, next) => {
  try {
    // Parser les questions si elles sont en format JSON string (avec FormData)
    let questions = req.body.questions;
    if (typeof questions === 'string') {
      questions = JSON.parse(questions);
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Un quiz doit contenir au moins une question'
      });
    }

    //*****QUIZ*****///

    // Filtrer les champs pour le quiz
    const quizData = filterObj(
      req.body,
      'title',
      'description',
      'isPublic',
      'startDate',
      'endDate'
    );

    quizData.createdBy = req.user.id;
    
    // Ajouter le logo si un fichier a été uploadé
    if (req.file) {
      quizData.logo = req.file.filename;
    }
    
    if (quizData.isPublic) {
      quizData.joinCode = generateJoinCode();
    }

    // on créer d'abord le quiz, pour obtenir son id et ensuite lui assigner des questions
    const quiz = await Quiz.create(quizData);

    //*****QUESTIONS*****///
    const questionPromises = questions.map(async (questionData) => {
      questionData.quizId = quiz._id;
      
      return await Question.create(questionData);
    });

    const createdQuestions = await Promise.all(questionPromises);
    
    quiz.questions = createdQuestions.map(question => question._id);
    await quiz.save();

    res.status(201).json({
      status: 'success',
      data: {
        quiz
      }
    });
  } catch (error) {
    console.error('Error in quizCreate:', error);
    next(error);
  }
};

// update un quiz
exports.quizUpdate = async (req, res, next) => {
  try {
    // Récupérer le quiz existant
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    if (quiz.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à modifier ce quiz'
      });
    }

    const filteredBody = filterObj(
      req.body,
      'title',
      'description',
      'isPublic',
      'startDate',
      'endDate'
    );

    if (filteredBody.isPublic === true && !quiz.joinCode) {
      filteredBody.joinCode = generateJoinCode();
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        quiz: updatedQuiz
      }
    });
  } catch (error) {
    console.error('Error in updateQuiz:', error);
    next(error);
  }
};

// Récupérer tous les quiz 
exports.getAllQuizes = async (req, res, next) => {
  try {
    const filter = {};
    
    // On vérifie si le user est admin, si pas admin, on affiche que les quiz publiques
    if (!req.user.isAdmin) {
      filter.$or = [
        { createdBy: req.user.id },
        { isPublic: true }
      ];
    }
    
    // Filtre isPublic
    if (req.query.isPublic) {
      filter.isPublic = req.query.isPublic === 'true';
    }
    
    // Filtre par date
    if (req.query.active === 'true') {
      const now = new Date();
      filter.startDate = { $lte: now };
      filter.$or = [
        { endDate: { $gte: now } },
        { endDate: { $exists: false } }
      ];
    }

    const quizes = await Quiz.find(filter)
      .populate('createdBy', 'userName')
      .sort({ startDate: -1 });

    res.status(200).json({
      status: 'success',
      results: quizes.length,
      data: {
        quizes
      }
    });
  } catch (error) {
    console.error('Error in getAllQuizes:', error);
    next(error);
  }
};

// Récupérer les quiz qu'un user a crées
exports.getMyQuizes = async (req, res, next) => {
  try {
    const quizes = await Quiz.find({ createdBy: req.user.id })
      .sort({ startDate: -1 });

    res.status(200).json({
      status: 'success',
      results: quizes.length,
      data: {
        quizes
      }
    });
  } catch (error) {
    console.error('Error in getMyQuizes:', error);
    next(error);
  }
};

// Récupérer un quiz par ID
exports.getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate({
        path: 'questions',
        select: 'content type points timeGiven answer'
      })
      .populate('createdBy', 'userName');

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    // Vérifications d'autorisation
    const isCreator = quiz.createdBy._id.toString() === req.user.id;
    const isAdmin = req.user.isAdmin;
    const isPublic = quiz.isPublic;
    
    // Vérifier si l'utilisateur est dans le lobby (a rejoint via le code)
    const isInLobby = await LobbyParticipant.findOne({
      quizId: quiz._id,
      userId: req.user.id
    });

    if (!isPublic && !isCreator && !isAdmin && !isInLobby) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à accéder à ce quiz'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        quiz
      }
    });
  } catch (error) {
    console.error('Error in getQuizById:', error);
    next(error);
  }
};

// Récupérer un quiz par un code
exports.getQuizByJoinCode = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ 
      joinCode: req.params.joinCode
    }).populate('createdBy', 'userName');

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé avec ce code'
      });
    }

    // Si le quiz a un code, cela signifie qu'il est "lancé" et accessible
    // Peu importe s'il est public ou privé, le code donne accès
    res.status(200).json({
      status: 'success',
      data: {
        quiz
      }
    });
  } catch (error) {
    console.error('Error in getQuizByJoinCode:', error);
    next(error);
  }
};

// Générer un code de partage pour un quiz
exports.generateJoinCode = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    if (quiz.isPublic) {
    } else {
      if (quiz.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Seul le créateur peut lancer ce quiz privé'
        });
      }
    }

    // Générer un nouveau code (même si un existe déjà)
    let newCode;
    let isUnique = false;
    
    // S'assurer que le code est unique
    while (!isUnique) {
      newCode = generateJoinCode();
      const existingQuiz = await Quiz.findOne({ joinCode: newCode });
      if (!existingQuiz) {
        isUnique = true;
      }
    }

    quiz.joinCode = newCode;
    await quiz.save();

    res.status(200).json({
      status: 'success',
      data: {
        joinCode: quiz.joinCode,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          isPublic: quiz.isPublic
        }
      }
    });
  } catch (error) {
    console.error('Error in generateJoinCode:', error);
    next(error);
  }
};

// Ajouter des questions à un quiz existant
exports.addQuestionsToQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    if (quiz.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à modifier ce quiz'
      });
    }

    if (!req.body.questions || !Array.isArray(req.body.questions) || req.body.questions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Aucune question à ajouter'
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newQuestionPromises = req.body.questions.map(async (questionData) => {
        questionData.quizId = quiz._id;
        return await Question.create([questionData], { session });
      });

      const newQuestionsArrays = await Promise.all(newQuestionPromises);
      const newQuestions = newQuestionsArrays.map(arr => arr[0]);

      const newQuestionIds = newQuestions.map(q => q._id);
      quiz.questions.push(...newQuestionIds);
      await quiz.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        status: 'success',
        data: {
          quiz,
          addedQuestions: newQuestions
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error in addQuestionsToQuiz:', error);
    next(error);
  }
};

// Supprimer un quiz
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    // Vérifier les droits
    if (quiz.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à supprimer ce quiz'
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Supprimer le quiz
      await Quiz.findByIdAndDelete(req.params.id, { session });

      await session.commitTransaction();
      session.endSession();

      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteQuiz:', error);
    next(error);
  }
};

// ========== MÉTHODES POUR LA SALLE D'ATTENTE (LOBBY) ==========

// Map pour stocker les connexions SSE des participants
const lobbyConnections = new Map();

// Send a notification in the lobby
function broadcastToLobby(quizId, message, excludeUserId = null) {
  for (const [key, connection] of lobbyConnections.entries()) {
    if (key.startsWith(`${quizId}-`)) {
      const userId = key.split('-')[1];
      
      // Exclure l'utilisateur spécifié (celui qui a envoyé l'action)
      if (excludeUserId && userId === excludeUserId) {
        continue;
      }

      try {
        connection.write(`data: ${JSON.stringify(message)}\n\n`);
      } catch (error) {
        console.error('Error broadcasting to connection:', error);
        // Supprimer la connexion défaillante
        lobbyConnections.delete(key);
      }
    }
  }
}

// Join waiting room
exports.joinLobby = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    // Verify if the quiz is accessible
    if (!quiz.joinCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Ce quiz n\'est pas accessible publiquement'
      });
    }

    // Create or update participant
    const participantData = {
      quizId: quiz._id,
      userId: req.user.id,
      userName: req.user.userName,
      avatar: req.user.avatar,
      isOrganizer: quiz.createdBy.toString() === req.user.id,
      connectionStatus: 'connected',
      lastSeen: new Date()
    };

    await LobbyParticipant.findOneAndUpdate(
      { quizId: quiz._id, userId: req.user.id },
      participantData,
      { upsert: true, new: true }
    );

    //Get all players
    const participants = await LobbyParticipant.find({ quizId: quiz._id })
      .sort({ joinedAt: 1 });

    // notify other players
    broadcastToLobby(quiz._id, {
      type: 'participant_joined',
      participant: {
        id: req.user.id,
        userName: req.user.userName,
        avatar: req.user.avatar,
        isOrganizer: participantData.isOrganizer,
        isReady: false,
        connectionStatus: 'connected',
        joinedAt: new Date()
      }
    }, req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        participants: participants.map(p => ({
          id: p.userId,
          userName: p.userName,
          avatar: p.avatar,
          isOrganizer: p.isOrganizer,
          isReady: p.isReady,
          connectionStatus: p.connectionStatus,
          joinedAt: p.joinedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error in joinLobby:', error);
    next(error);
  }
};

// leave waiting room
exports.leaveLobby = async (req, res, next) => {
  try {
    const participant = await LobbyParticipant.findOneAndDelete({
      quizId: req.params.id,
      userId: req.user.id
    });

    if (participant) {
      // Notify other players
      broadcastToLobby(req.params.id, {
        type: 'participant_left',
        participantId: req.user.id,
        userName: req.user.userName
      }, req.user.id);

      // Fermer la connexion SSE si elle existe
      const connectionKey = `${req.params.id}-${req.user.id}`;
      if (lobbyConnections.has(connectionKey)) {
        const res = lobbyConnections.get(connectionKey);
        res.end();
        lobbyConnections.delete(connectionKey);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Vous avez quitté la salle d\'attente'
    });
  } catch (error) {
    console.error('Error in leaveLobby:', error);
    next(error);
  }
};

// Players list
exports.getLobbyParticipants = async (req, res, next) => {
  try {
    const participants = await LobbyParticipant.find({ quizId: req.params.id })
      .sort({ joinedAt: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        participants: participants.map(p => ({
          id: p.userId,
          userName: p.userName,
          avatar: p.avatar,
          isOrganizer: p.isOrganizer,
          isReady: p.isReady,
          connectionStatus: p.connectionStatus,
          joinedAt: p.joinedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error in getLobbyParticipants:', error);
    next(error);
  }
};

// Change the "ready" status of a players
exports.setLobbyReady = async (req, res, next) => {
  try {
    const { isReady } = req.body;

    const participant = await LobbyParticipant.findOneAndUpdate(
      { quizId: req.params.id, userId: req.user.id },
      { isReady, lastSeen: new Date() },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({
        status: 'error',
        message: 'Participant non trouvé dans la salle d\'attente'
      });
    }

    broadcastToLobby(req.params.id, {
      type: 'participant_ready_changed',
      participantId: req.user.id,
      isReady
    });

    res.status(200).json({
      status: 'success',
      data: { isReady }
    });
  } catch (error) {
    console.error('Error in setLobbyReady:', error);
    next(error);
  }
};

// Start quiz
exports.startQuizFromLobby = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Seul l\'organisateur peut démarrer le quiz'
      });
    }

    const participantCount = await LobbyParticipant.countDocuments({ quizId: quiz._id });
    
    if (participantCount === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Il faut au moins un participant pour démarrer le quiz'
      });
    }

    broadcastToLobby(req.params.id, {
      type: 'quiz_starting',
      message: 'Le quiz va commencer dans 3 secondes...',
      quizId: quiz._id
    });

    quiz.actualStartDate = new Date();
    await quiz.save();

    res.status(200).json({
      status: 'success',
      message: 'Quiz démarré avec succès'
    });

    setTimeout(async () => {
      await LobbyParticipant.deleteMany({ quizId: quiz._id });
      for (const [key, connection] of lobbyConnections.entries()) {
        if (key.startsWith(`${quiz._id}-`)) {
          connection.end();
          lobbyConnections.delete(key);
        }
      }
    }, 5000);

  } catch (error) {
    console.error('Error in startQuizFromLobby:', error);
    next(error);
  }
};

exports.getLobbyEvents = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    res.write('data: {"type":"connected","message":"Connexion établie"}\n\n');

    // Stocker la connexion
    const connectionKey = `${req.params.id}-${req.user.id}`;
    lobbyConnections.set(connectionKey, res);

    await LobbyParticipant.findOneAndUpdate(
      { quizId: req.params.id, userId: req.user.id },
      { connectionStatus: 'connected', lastSeen: new Date() }
    );

    req.on('close', async () => {
      lobbyConnections.delete(connectionKey);
      
      await LobbyParticipant.findOneAndUpdate(
        { quizId: req.params.id, userId: req.user.id },
        { connectionStatus: 'disconnected', lastSeen: new Date() }
      );

      broadcastToLobby(req.params.id, {
        type: 'participant_connection_changed',
        participantId: req.user.id,
        connectionStatus: 'disconnected'
      }, req.user.id);
    });

    const pingInterval = setInterval(() => {
      if (lobbyConnections.has(connectionKey)) {
        res.write('data: {"type":"ping"}\n\n');
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

  } catch (error) {
    console.error('Error in getLobbyEvents:', error);
    res.end();
  }
};