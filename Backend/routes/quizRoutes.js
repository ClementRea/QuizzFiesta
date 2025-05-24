const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect } = require('../middlewares/authMiddleware');


//POST
router.post('/create', protect, quizController.quizCreate);
router.post('/update/:id', quizController.quizUpdate);
router.post('/addQuestions/:id', quizController.addQuestionsToQuiz);

//DELETE
router.delete('/:id', quizController.deleteQuiz);

//GET
router.get('/', quizController.getAllQuizes);
router.get('/myQuizes', quizController.getMyQuizes);
router.get('/:id', quizController.getQuizById);
router.get('/join/:joinCode', quizController.getQuizByJoinCode);

module.exports = router;