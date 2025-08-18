const express = require("express");

const router = express.Router();
const multer = require("multer");

const quizController = require("../controllers/quizController");
const { protect } = require("../middlewares/authMiddleware");
const {
  validateCreateQuiz,
  validateUpdateQuiz,
  validateQuizId,
} = require("../middlewares/validationMiddleware");

const path = require("path");

const { compressImage } = require("../middlewares/imageCompressionMiddleware");

// Config multer for logo
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/logos/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${extension}`);
  },
});

// accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Le fichier doit être une image."), false);
  }
};

// limit 2mo images
const uploadLogo = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter,
});

//POST
router.post(
  "/create",
  protect,
  uploadLogo.single("logo"),
  compressImage,
  validateCreateQuiz,
  quizController.quizCreate,
);

//PUT
router.put(
  "/update/:id",
  protect,
  validateQuizId,
  uploadLogo.single("logo"),
  compressImage,
  validateUpdateQuiz,
  quizController.quizUpdate,
);
router.put(
  "/addQuestions/:id",
  protect,
  validateQuizId,
  quizController.addQuestionsToQuiz,
);

//GET
router.get("/", protect, quizController.getAllQuizes);
router.get("/myQuizes", protect, quizController.getMyQuizes);
router.get("/:id", protect, validateQuizId, quizController.getQuizById);

//DELETE
router.delete("/:id", protect, validateQuizId, quizController.deleteQuiz);

module.exports = router;
