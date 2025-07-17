const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuration multer pour les logos de quiz
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/logos/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${extension}`);
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Le fichier doit être une image.'), false);
  }
};

// Instance multer pour les logos (limite 5Mo)
const uploadLogo = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: fileFilter 
});


//POST
router.post('/create', protect, uploadLogo.single('logo'), quizController.quizCreate);
router.post('/generateCode/:id', protect, quizController.generateJoinCode);

// Routes pour la salle d'attente (lobby)
router.post('/:id/lobby/join', protect, quizController.joinLobby);
router.post('/:id/lobby/leave', protect, quizController.leaveLobby);
router.post('/:id/lobby/start', protect, quizController.startQuizFromLobby);

//PUT
router.put('/update/:id', protect, quizController.quizUpdate);
router.put('/addQuestions/:id', protect, quizController.addQuestionsToQuiz);
router.put('/:id/lobby/ready', protect, quizController.setLobbyReady);

//GET
router.get('/', protect, quizController.getAllQuizes);
router.get('/myQuizes', protect, quizController.getMyQuizes);
router.get('/:id', protect, quizController.getQuizById);
router.get('/join/:joinCode', quizController.getQuizByJoinCode);
router.get('/:id/lobby/participants', protect, quizController.getLobbyParticipants);
router.get('/:id/lobby/events', protect, quizController.getLobbyEvents);

//DELETE
router.delete('/:id', protect, quizController.deleteQuiz);

//GET
router.get('/', protect, quizController.getAllQuizes);
router.get('/myQuizes', protect, quizController.getMyQuizes);
router.get('/:id', protect, quizController.getQuizById);
router.get('/join/:joinCode', quizController.getQuizByJoinCode);

module.exports = router;