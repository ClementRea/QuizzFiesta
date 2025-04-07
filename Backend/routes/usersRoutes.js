const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuration du stockage des avatars
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/avatars/'); // Assurez-vous que ce dossier existe
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${extension}`);
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

// Initialisation de multer
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite à 2MB
  fileFilter: fileFilter 
});

// Routes avec middleware d'authentification et d'upload
router.get('/getMe', protect, userController.getMe);
router.put('/updateMe', protect, upload.single('avatar'), userController.updateMe);

module.exports = router;