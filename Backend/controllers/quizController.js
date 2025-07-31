const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const LobbyParticipant = require('../models/LobbyParticipant');
const mongoose = require('mongoose');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//Create quiz
exports.quizCreate = async (req, res, next) => {
  try {

    const filteredBody = filterObj(req.body, 'title', 'description', 'startDate', 'questions');
    if (filteredBody.questions) delete filteredBody.questions;

    if (!filteredBody.title || !filteredBody.description) {
      return res.status(400).json({
        status: 'error',
        message: 'Le titre et la description sont obligatoires'
      });
    }

    if (req.file) {
      filteredBody.logo = req.file.filename;
    }

    filteredBody.createdBy = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1st create the quiz without questions
      const quiz = new Quiz(filteredBody);
      await quiz.save({ session });

      // 2nd create the questions if provided
      let questions = [];
      if (req.body.questions) {
        const parsedQuestions = typeof req.body.questions === 'string'
          ? JSON.parse(req.body.questions)
          : req.body.questions;

        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          // Create all questions
          const questionPromises = parsedQuestions.map(async (questionData) => {
            questionData.quizId = quiz._id;
            const question = new Question(questionData);
            return await question.save({ session });
          });

          questions = await Promise.all(questionPromises);

          // Update the quiz with the question IDs
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


exports.getAllQuizes = async (req, res, next) => {
  try {
    const { isPublic, active } = req.query;
    
    let filter = {};
    
    if (req.user.role === 'user') {
      filter.isPublic = true;
    } else {
      if (req.user.role === 'gestionnaire') {
        const User = require('../models/User');
        const usersInOrg = await User.find({ organization: req.user.organization }).select('_id');
        const userIds = usersInOrg.map(u => u._id);
        
        filter.$or = [
          { isPublic: true },
          { createdBy: { $in: userIds } }
        ];
      }
    }
    
    if (isPublic !== undefined) {
      if (req.user.role === 'user') {
        filter.isPublic = true; 
      } else {
        if (filter.$or) {
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

    const isCreator = quiz.createdBy._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isGestionnaire = req.user.role === 'gestionnaire';
    const isPublic = quiz.isPublic;
    
    const isInLobby = await LobbyParticipant.findOne({
      quizId: quiz._id,
      userId: req.user.id
    });

    let hasAccess = false;
    
    if (isAdmin) {
      hasAccess = true;
    } else if (isCreator) {
      hasAccess = true;
    } else if (isPublic) {
      hasAccess = true;
    } else if (isInLobby) {
      hasAccess = true;
    } else if (isGestionnaire && req.user.organization) {
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

exports.quizUpdate = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

    let canModify = false;
    
    if (req.user.role === 'admin') {
      canModify = true;
    } else if (quiz.createdBy.toString() === req.user.id) {
      canModify = true;
    } else if (req.user.role === 'gestionnaire' && req.user.organization) {
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
      const filteredBody = filterObj(req.body, 'title', 'description', 'isPublic', 'active');

      if (req.file) {
        filteredBody.logo = req.file.filename;
      }

      const updatedQuiz = await Quiz.findByIdAndUpdate(
        req.params.id,
        filteredBody,
        { new: true, runValidators: true, session }
      );

      if (req.body.questions) {
        const parsedQuestions = typeof req.body.questions === 'string'
          ? JSON.parse(req.body.questions)
          : req.body.questions;

        if (Array.isArray(parsedQuestions)) {
          await Question.deleteMany({ quizId: quiz._id }, { session });

          if (parsedQuestions.length > 0) {
            const questionPromises = parsedQuestions.map(async (questionData) => {
              questionData.quizId = quiz._id;
              const question = new Question(questionData);
              return await question.save({ session });
            });

            const newQuestions = await Promise.all(questionPromises);

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

// delete a quiz
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

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

exports.addQuestionsToQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    }

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