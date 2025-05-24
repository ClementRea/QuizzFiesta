const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const mongoose = require('mongoose');
const crypto = require('crypto');

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
    if (!req.body.questions || req.body.questions.length === 0) {
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
    
    if (quizData.isPublic) {
      quizData.joinCode = generateJoinCode();
    }

    // on créer d'abor le quiz, pour obtenir son id et ensuite lui assginer des questions
    const quiz = await Quiz.create(quizData);

    //*****QUESTIONS*****///
    const questionPromises = req.body.questions.map(async (questionData) => {
      questionData.quizId = quiz._id;
      
      return await Question.create(questionData);
    });

    const questions = await Promise.all(questionPromises);
    
    quiz.questions = questions.map(question => question._id);
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

    if (!quiz.isPublic && quiz.createdBy._id.toString() !== req.user.id && !req.user.isAdmin) {
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
      joinCode: req.params.joinCode,
      isPublic: true 
    });

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé ou non public'
      });
    }

    const now = new Date();
    if (quiz.startDate > now || (quiz.endDate && quiz.endDate < now)) {
      return res.status(403).json({
        status: 'error',
        message: 'Ce quiz n\'est pas actuellement disponible'
      });
    }

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