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
router.post('/create', uploadLogo.single('logo'), quizController.quizCreate); // protect désactivé

//PUT
router.put('/update/:id', uploadLogo.single('logo'), quizController.quizUpdate); // protect désactivé
router.put('/addQuestions/:id', quizController.addQuestionsToQuiz); // protect désactivé

//GET
router.get('/', quizController.getAllQuizes); // protect désactivé
router.get('/myQuizes', quizController.getMyQuizes); // protect désactivé
router.get('/:id', quizController.getQuizById); // protect désactivé

//DELETE
router.delete('/:id', quizController.deleteQuiz); // protect désactivé

module.exports = router;