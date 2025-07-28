const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const LobbyParticipant = require('../models/LobbyParticipant');
const GameParticipant = require('../models/GameParticipant');
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

// ============== GAME METHODS ==============

// Map pour stocker les connexions SSE des participants du jeu
const gameConnections = new Map();

// Diffuser un message à tous les participants du jeu
function broadcastToGame(quizId, message, excludeUserId = null) {
  for (const [key, connection] of gameConnections.entries()) {
    if (key.startsWith(`${quizId}-`)) {
      const userId = key.split('-')[1];
      
      if (excludeUserId && userId === excludeUserId) {
        continue;
      }
      
      try {
        connection.write(`data: ${JSON.stringify(message)}\n\n`);
      } catch (error) {
        console.error('Error broadcasting to game participant:', error);
        gameConnections.delete(key);
      }
    }
  }
}

// Récupérer les questions du quiz (sans les bonnes réponses)
exports.getQuizQuestions = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('questions');
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    // Vérifier que l'utilisateur peut accéder au quiz
    const isCreator = quiz.createdBy.toString() === req.user.id;
    const isInLobby = await LobbyParticipant.findOne({
      quizId: quiz._id,
      userId: req.user.id
    });

    if (!isCreator && !isInLobby && !quiz.isPublic) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé à ce quiz'
      });
    }

    // Créer ou récupérer le participant de jeu
    let gameParticipant = await GameParticipant.findOne({
      quizId: quiz._id,
      userId: req.user.id
    });

    if (!gameParticipant) {
      gameParticipant = new GameParticipant({
        quizId: quiz._id,
        userId: req.user.id,
        userName: req.user.userName,
        avatar: req.user.avatar
      });
    } else if (gameParticipant.gameStatus === 'finished') {
      // Si le participant a déjà terminé le quiz, réinitialiser pour permettre de rejouer
      gameParticipant.currentQuestionIndex = 0;
      gameParticipant.currentQuestionStartTime = null;
      gameParticipant.currentQuestionTimeLimit = 30;
      gameParticipant.answers = [];
      gameParticipant.totalScore = 0;
      gameParticipant.gameStatus = 'playing';
      gameParticipant.lastActivity = new Date();
    }
    
    // Initialiser le timer pour la question actuelle si pas encore fait
    const currentQuestion = quiz.questions[gameParticipant.currentQuestionIndex];
    if (currentQuestion) {
      if (!gameParticipant.currentQuestionStartTime) {
        gameParticipant.currentQuestionStartTime = new Date();
        gameParticipant.currentQuestionTimeLimit = currentQuestion.timeGiven || 30;
      }
      
      // S'assurer que le timeLimit n'est jamais 0 ou négatif
      if (gameParticipant.currentQuestionTimeLimit <= 0) {
        gameParticipant.currentQuestionTimeLimit = currentQuestion.timeGiven || 30;
        // Si la question n'a pas de timeGiven valide, utiliser 30 secondes par défaut
        if (gameParticipant.currentQuestionTimeLimit <= 0) {
          gameParticipant.currentQuestionTimeLimit = 30;
        }
      }
    }
    
    await gameParticipant.save();

    // Préparer les questions sans les bonnes réponses
    const sanitizedQuestions = quiz.questions.map(question => ({
      _id: question._id,
      title: question.content,
      type: question.type,
      points: question.points,
      timeLimit: question.timeGiven || 30,
      answers: question.answer ? question.answer.map(ans => ({
        text: ans.text,
        // On ne renvoie PAS ans.correct
      })) : [],
      items: question.type === 'ORDER' && question.answer ? 
        question.answer.map(ans => ({
          text: ans.text,
          id: ans._id
        })) : []
    }));

    res.status(200).json({
      status: 'success',
      data: {
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description
        },
        questions: sanitizedQuestions,
        participant: {
          currentQuestionIndex: gameParticipant.currentQuestionIndex,
          totalScore: gameParticipant.totalScore
        }
      }
    });
  } catch (error) {
    console.error('Error in getQuizQuestions:', error);
    next(error);
  }
};

// Soumettre une réponse
exports.submitAnswer = async (req, res, next) => {
  try {
    const { questionId, answer } = req.body;
    const quizId = req.params.id;

    // Vérifier que le quiz existe
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    // Récupérer la question avec la bonne réponse
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Question non trouvée'
      });
    }

    // Récupérer le participant
    let gameParticipant = await GameParticipant.findOne({
      quizId,
      userId: req.user.id
    });

    if (!gameParticipant) {
      return res.status(400).json({
        status: 'error',
        message: 'Participant non trouvé dans le jeu'
      });
    }

    // Vérifier que le participant n'a pas déjà répondu à cette question
    const existingAnswer = gameParticipant.answers.find(
      ans => ans.questionId.toString() === questionId
    );

    if (existingAnswer) {
      return res.status(400).json({
        status: 'error',
        message: 'Vous avez déjà répondu à cette question'
      });
    }

    // Calculer si la réponse est correcte
    let isCorrect = false;
    let points = 0;

    if (question.type === 'MULTIPLE_CHOICE') {
      const correctAnswerIndex = question.answer.findIndex(ans => ans.isCorrect);
      isCorrect = answer === correctAnswerIndex;
    } else if (question.type === 'TRUE_FALSE') {
      isCorrect = answer === question.correctAnswer;
    } else if (question.type === 'ORDER') {
      // Pour les questions d'ordre, comparer l'ordre donné avec le bon ordre
      const correctOrder = question.answer.sort((a, b) => a.correctOrder - b.correctOrder).map(item => item.text);
      isCorrect = JSON.stringify(answer) === JSON.stringify(correctOrder);
    } else if (question.type === 'CLASSIC') {
      // Pour les questions classiques, comparer avec la réponse attendue
      const correctAnswer = question.answer[0].text.toLowerCase().trim();
      isCorrect = answer.toLowerCase().trim() === correctAnswer;
    } else if (question.type === 'ASSOCIATION') {
      // Pour les questions d'association, vérifier que toutes les paires sont correctes
      if (Array.isArray(answer)) {
        // La bonne réponse est que chaque élément gauche (index i) doit être associé avec l'élément droit (index i)
        const correctPairs = question.answer.map((_, index) => ({
          leftIndex: index,
          rightIndex: index
        }));
        
        // Vérifier que toutes les associations sont correctes
        isCorrect = answer.length === correctPairs.length && 
          answer.every(pair => 
            correctPairs.some(correct => 
              correct.leftIndex === pair.leftIndex && correct.rightIndex === pair.rightIndex
            )
          );
      }
    } else if (question.type === 'FIND_INTRUDER') {
      // Pour trouver l'intrus, vérifier que l'index sélectionné correspond à l'intrus
      const correctIntruderIndex = question.answer.findIndex(ans => ans.isCorrect);
      isCorrect = answer === correctIntruderIndex;
    }

    if (isCorrect) {
      points = question.points || 100;
    }

    // Ajouter la réponse
    gameParticipant.answers.push({
      questionId,
      answer,
      isCorrect,
      points,
      submittedAt: new Date()
    });

    gameParticipant.totalScore += points;
    gameParticipant.lastActivity = new Date();
    await gameParticipant.save();

    // Préparer la bonne réponse pour le frontend
    let correctAnswer = null;
    if (question.type === 'MULTIPLE_CHOICE') {
      correctAnswer = question.answer.findIndex(ans => ans.isCorrect);
    } else if (question.type === 'TRUE_FALSE') {
      correctAnswer = question.correctAnswer;
    } else if (question.type === 'ORDER') {
      correctAnswer = question.answer.sort((a, b) => a.correctOrder - b.correctOrder).map(item => item.text);
    } else if (question.type === 'CLASSIC') {
      correctAnswer = question.answer[0].text;
    } else if (question.type === 'ASSOCIATION') {
      correctAnswer = question.answer.map((_, index) => ({
        leftIndex: index,
        rightIndex: index
      }));
    } else if (question.type === 'FIND_INTRUDER') {
      correctAnswer = question.answer.findIndex(ans => ans.isCorrect);
    }

    res.status(200).json({
      status: 'success',
      data: {
        isCorrect,
        points,
        totalScore: gameParticipant.totalScore,
        correctAnswer
      }
    });

    // Vérifier si tous les participants ont répondu
    const totalParticipants = await GameParticipant.countDocuments({ quizId });
    const participantsWhoAnswered = await GameParticipant.countDocuments({
      quizId,
      [`answers.${gameParticipant.answers.length - 1}`]: { $exists: true }
    });

    if (participantsWhoAnswered === totalParticipants) {
      // Tous les participants ont répondu, on peut passer à la question suivante
      broadcastToGame(quizId, {
        type: 'all_answered',
        message: 'Tous les participants ont répondu'
      });
    }

  } catch (error) {
    console.error('Error in submitAnswer:', error);
    next(error);
  }
};

// Passer à la question suivante
exports.nextQuestion = async (req, res, next) => {
  try {
    const quizId = req.params.id;
    
    // Récupérer le participant
    let gameParticipant = await GameParticipant.findOne({
      quizId,
      userId: req.user.id
    });
    
    if (!gameParticipant) {
      return res.status(400).json({
        status: 'error',
        message: 'Participant non trouvé'
      });
    }
    
    // Récupérer le quiz pour les questions
    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }
    
    // Passer à la question suivante
    gameParticipant.currentQuestionIndex++;
    
    // Vérifier si c'est la fin du quiz
    if (gameParticipant.currentQuestionIndex >= quiz.questions.length) {
      gameParticipant.gameStatus = 'finished';
      gameParticipant.currentQuestionStartTime = null;
    } else {
      // Initialiser le timer pour la nouvelle question
      const nextQuestion = quiz.questions[gameParticipant.currentQuestionIndex];
      gameParticipant.currentQuestionStartTime = new Date();
      gameParticipant.currentQuestionTimeLimit = nextQuestion.timeGiven || 30;
    }
    
    await gameParticipant.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        currentQuestionIndex: gameParticipant.currentQuestionIndex,
        gameStatus: gameParticipant.gameStatus,
        timeLeft: gameParticipant.currentQuestionTimeLimit || 0
      }
    });
    
  } catch (error) {
    console.error('Error in nextQuestion:', error);
    next(error);
  }
};

// Récupérer l'état du jeu
exports.getGameState = async (req, res, next) => {
  try {
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    const participants = await GameParticipant.find({ quizId })
      .sort({ totalScore: -1 });

    const currentParticipant = participants.find(p => p.userId.toString() === req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        quiz: {
          _id: quiz._id,
          title: quiz.title
        },
        participants: participants.map(p => ({
          userId: p.userId,
          userName: p.userName,
          avatar: p.avatar,
          totalScore: p.totalScore,
          currentQuestionIndex: p.currentQuestionIndex,
          gameStatus: p.gameStatus
        })),
        currentParticipant: currentParticipant ? {
          currentQuestionIndex: currentParticipant.currentQuestionIndex,
          totalScore: currentParticipant.totalScore,
          answeredQuestions: currentParticipant.answers.length,
          timeLeft: currentParticipant.currentQuestionStartTime ? 
            Math.max(0, currentParticipant.currentQuestionTimeLimit - Math.floor((Date.now() - currentParticipant.currentQuestionStartTime) / 1000))
            : currentParticipant.currentQuestionTimeLimit
        } : null
      }
    });
  } catch (error) {
    console.error('Error in getGameState:', error);
    next(error);
  }
};

// Stream des événements du jeu (SSE)
exports.getGameEvents = async (req, res, next) => {
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

    res.write('data: {"type":"connected","message":"Connexion au jeu établie"}\n\n');

    // Stocker la connexion
    const connectionKey = `${req.params.id}-${req.user.id}`;
    gameConnections.set(connectionKey, res);

    // Mettre à jour l'activité du participant
    await GameParticipant.findOneAndUpdate(
      { quizId: req.params.id, userId: req.user.id },
      { lastActivity: new Date() }
    );

    req.on('close', async () => {
      gameConnections.delete(connectionKey);
      
      await GameParticipant.findOneAndUpdate(
        { quizId: req.params.id, userId: req.user.id },
        { lastActivity: new Date() }
      );
    });

    // Ping périodique
    const pingInterval = setInterval(() => {
      if (gameConnections.has(connectionKey)) {
        res.write('data: {"type":"ping"}\n\n');
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

  } catch (error) {
    console.error('Error in getGameEvents:', error);
    res.end();
  }
};