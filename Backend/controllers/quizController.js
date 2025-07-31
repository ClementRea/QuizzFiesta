const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const LobbyParticipant = require('../models/LobbyParticipant');
const mongoose = require('mongoose');

// Filtrer les champs
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.quizCreate = async (req, res, next) => {
  try {

    const filteredBody = filterObj(req.body, 'title', 'description', 'startDate', 'questions');
    // Supprimer le champ questions pour éviter le cast error
    if (filteredBody.questions) delete filteredBody.questions;

    if (!filteredBody.title || !filteredBody.description) {
      return res.status(400).json({
        status: 'error',
        message: 'Le titre et la description sont obligatoires'
      });
    }

    // Traitement du logo si présent
    if (req.file) {
      filteredBody.logo = req.file.filename;
    }

    filteredBody.createdBy = req.user.id;

    // Démarrer une transaction pour créer le quiz et les questions
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Créer le quiz sans questions
      const quiz = new Quiz(filteredBody);
      await quiz.save({ session });

      // Traiter les questions si elles sont fournies
      let questions = [];
      if (req.body.questions) {
        const parsedQuestions = typeof req.body.questions === 'string'
          ? JSON.parse(req.body.questions)
          : req.body.questions;

        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          // Créer toutes les questions
          const questionPromises = parsedQuestions.map(async (questionData) => {
            questionData.quizId = quiz._id;
            const question = new Question(questionData);
            return await question.save({ session });
          });

          questions = await Promise.all(questionPromises);

          // Mettre à jour le quiz avec les IDs des questions
          quiz.questions = questions.map(q => q._id);
          await quiz.save({ session });
        }
      }

      await session.commitTransaction();

      const populatedQuiz = await Quiz.findById(quiz._id)
        .populate('questions')
        .populate('createdBy', 'userName');

      res.status(201).json({
        status: 'success',
        data: {
          quiz: populatedQuiz
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error in quizCreate:', error);
    next(error);
  }
};

// Récupérer tous les quiz (avec vérification de rôles)
exports.getAllQuizes = async (req, res, next) => {
  try {
    const { isPublic, active } = req.query;
    
    let filter = {};
    
    // Les utilisateurs normaux ne voient que les quiz publics
    if (req.user.role === 'user') {
      filter.isPublic = true;
    } else {
      // Les gestionnaires voient les quiz publics + ceux de leur organisation
      if (req.user.role === 'gestionnaire') {
        const User = require('../models/User');
        const usersInOrg = await User.find({ organization: req.user.organization }).select('_id');
        const userIds = usersInOrg.map(u => u._id);
        
        filter.$or = [
          { isPublic: true },
          { createdBy: { $in: userIds } }
        ];
      }
      // Les admins voient tout (pas de filtre supplémentaire)
    }
    
    if (isPublic !== undefined) {
      if (req.user.role === 'user') {
        filter.isPublic = true; // Force toujours true pour les users
      } else {
        if (filter.$or) {
          // Si on a déjà un filtre $or, on l'adapte
          filter.$or = filter.$or.map(condition => {
            if (condition.isPublic !== undefined || condition.createdBy !== undefined) {
              return { ...condition, ...(isPublic === 'true' ? {} : { isPublic: isPublic === 'true' }) };
            }
            return condition;
          });
        } else {
          filter.isPublic = isPublic === 'true';
        }
      }
    }
    
    if (active !== undefined) {
      filter.active = active === 'true';
    }

    const quizes = await Quiz.find(filter)
      .populate('createdBy', 'userName')
      .populate('questions')
      .sort({ createdAt: -1 });

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

// Récupérer les quiz de l'utilisateur connecté
exports.getMyQuizes = async (req, res, next) => {
  try {
    const quizes = await Quiz.find({ createdBy: req.user.id })
      .populate('questions')
      .sort({ createdAt: -1 });

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
    const isAdmin = req.user.role === 'admin';
    const isGestionnaire = req.user.role === 'gestionnaire';
    const isPublic = quiz.isPublic;
    
    // Vérifier si l'utilisateur est dans le lobby (a rejoint via le code)
    const isInLobby = await LobbyParticipant.findOne({
      quizId: quiz._id,
      userId: req.user.id
    });

    // Vérifications d'accès selon les rôles
    let hasAccess = false;
    
    if (isAdmin) {
      hasAccess = true; // Admin a accès à tout
    } else if (isCreator) {
      hasAccess = true; // Créateur a accès à son quiz
    } else if (isPublic) {
      hasAccess = true; // Quiz public accessible à tous
    } else if (isInLobby) {
      hasAccess = true; // Utilisateur dans le lobby
    } else if (isGestionnaire && req.user.organization) {
      // Vérifier si le créateur du quiz fait partie de la même organisation
      const User = require('../models/User');
      const quizCreator = await User.findById(quiz.createdBy._id);
      if (quizCreator && quizCreator.organization && 
          quizCreator.organization.toString() === req.user.organization.toString()) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
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

// Mettre à jour un quiz
exports.quizUpdate = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    // Vérification des droits de modification
    let canModify = false;
    
    if (req.user.role === 'admin') {
      canModify = true;
    } else if (quiz.createdBy.toString() === req.user.id) {
      canModify = true;
    } else if (req.user.role === 'gestionnaire' && req.user.organization) {
      // Vérifier si le créateur fait partie de la même organisation
      const User = require('../models/User');
      const quizCreator = await User.findById(quiz.createdBy);
      if (quizCreator && quizCreator.organization && 
          quizCreator.organization.toString() === req.user.organization.toString()) {
        canModify = true;
      }
    }
    
    if (!canModify) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à modifier ce quiz'
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Filtrer les champs autorisés pour la mise à jour du quiz
      const filteredBody = filterObj(req.body, 'title', 'description', 'isPublic', 'active');

      // Traitement du logo si présent
      if (req.file) {
        filteredBody.logo = req.file.filename;
      }

      // Mettre à jour les informations de base du quiz
      const updatedQuiz = await Quiz.findByIdAndUpdate(
        req.params.id,
        filteredBody,
        { new: true, runValidators: true, session }
      );

      // Traiter les questions si elles sont fournies
      if (req.body.questions) {
        const parsedQuestions = typeof req.body.questions === 'string'
          ? JSON.parse(req.body.questions)
          : req.body.questions;

        if (Array.isArray(parsedQuestions)) {
          // Supprimer les anciennes questions
          await Question.deleteMany({ quizId: quiz._id }, { session });

          // Créer les nouvelles questions
          if (parsedQuestions.length > 0) {
            const questionPromises = parsedQuestions.map(async (questionData) => {
              questionData.quizId = quiz._id;
              const question = new Question(questionData);
              return await question.save({ session });
            });

            const newQuestions = await Promise.all(questionPromises);

            // Mettre à jour les références des questions dans le quiz
            updatedQuiz.questions = newQuestions.map(q => q._id);
            await updatedQuiz.save({ session });
          } else {
            // Si aucune question, vider le tableau
            updatedQuiz.questions = [];
            await updatedQuiz.save({ session });
          }
        }
      }

      await session.commitTransaction();

      // Récupérer le quiz mis à jour avec toutes les données
      const populatedQuiz = await Quiz.findById(updatedQuiz._id)
        .populate('questions')
        .populate('createdBy', 'userName');

      res.status(200).json({
        status: 'success',
        data: {
          quiz: populatedQuiz
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error in quizUpdate:', error);
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

    // Vérification des droits de suppression
    let canDelete = false;
    
    if (req.user.role === 'admin') {
      canDelete = true;
    } else if (quiz.createdBy.toString() === req.user.id) {
      canDelete = true;
    } else if (req.user.role === 'gestionnaire' && req.user.organization) {
      // Vérifier si le créateur fait partie de la même organisation
      const User = require('../models/User');
      const quizCreator = await User.findById(quiz.createdBy);
      if (quizCreator && quizCreator.organization && 
          quizCreator.organization.toString() === req.user.organization.toString()) {
        canDelete = true;
      }
    }
    
    if (!canDelete) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à supprimer ce quiz'
      });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ quizId: req.params.id });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error in deleteQuiz:', error);
    next(error);
  }
};

// Récupérer un quiz par son code de partage
exports.getQuizByJoinCode = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ joinCode: req.params.joinCode.toUpperCase() })
      .populate('questions')
      .populate('createdBy', 'userName');

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé avec ce code'
      });
    }

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

    // Vérification des droits de modification
    let canModify = false;
    
    if (req.user.role === 'admin') {
      canModify = true;
    } else if (quiz.createdBy.toString() === req.user.id) {
      canModify = true;
    } else if (req.user.role === 'gestionnaire' && req.user.organization) {
      // Vérifier si le créateur fait partie de la même organisation
      const User = require('../models/User');
      const quizCreator = await User.findById(quiz.createdBy);
      if (quizCreator && quizCreator.organization && 
          quizCreator.organization.toString() === req.user.organization.toString()) {
        canModify = true;
      }
    }
    
    if (!canModify) {
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
      const newQuestions = newQuestionsArrays.flat();

      quiz.questions.push(...newQuestions.map(q => q._id));
      await quiz.save({ session });

      await session.commitTransaction();

      const updatedQuiz = await Quiz.findById(quiz._id)
        .populate('questions')
        .populate('createdBy', 'userName');

      res.status(200).json({
        status: 'success',
        data: {
          quiz: updatedQuiz
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error in addQuestionsToQuiz:', error);
    next(error);
  }
};