const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { 
  protect, 
  requireAdmin, 
  requireGestionnaireOrAdmin, 
  checkOrganizationAccess 
} = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const { compressImage } = require('../middlewares/imageCompression');

// config multer for logo
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/avatars/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${extension}`);
  }
});

// accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Le fichier doit être une image.'), false);
  }
};

//Only accept images and limit size to 2MB
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, 
  fileFilter: fileFilter 
});

// public routes
router.get('/getMe', protect, userController.getMe);
router.put('/updateMe', protect, upload.single('avatar'), compressImage, userController.updateMe);

// View a specific user
router.get('/:id', protect, checkOrganizationAccess, userController.getUserById);

// admin + gestionnaires routes
router.get('/', protect, requireGestionnaireOrAdmin, userController.getAllUsers);
router.get('/organization/:organizationId', protect, requireGestionnaireOrAdmin, userController.getUsersByOrganization);

// Routes for user management (managers can manage their org, admins can manage everything)
router.put('/:id/role', protect, requireGestionnaireOrAdmin, checkOrganizationAccess, userController.updateUserRole);
router.delete('/:id', protect, requireGestionnaireOrAdmin, checkOrganizationAccess, userController.deleteUser);

module.exports = router;