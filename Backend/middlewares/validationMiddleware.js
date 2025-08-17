const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Extraire le premier message d'erreur pour un format uniforme
    const firstError = errors.array()[0];
    return res.status(400).json({
      status: "error",
      message: firstError.msg,
    });
  }
  next();
};

// ========== AUTH VALIDATIONS ==========

const validateRegister = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email valide requis"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"),
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Le prénom doit contenir entre 2 et 50 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage("Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Le nom doit contenir entre 2 et 50 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage("Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes"),
  body("organisationId")
    .optional()
    .isMongoId()
    .withMessage("ID d'organisation invalide"),
  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email valide requis"),
  body("password")
    .notEmpty()
    .withMessage("Mot de passe requis"),
  handleValidationErrors,
];

const validateRefreshToken = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Token de rafraîchissement requis"),
  handleValidationErrors,
];

// ========== USER VALIDATIONS ==========

const validateUpdateUser = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Le prénom doit contenir entre 2 et 50 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage("Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Le nom doit contenir entre 2 et 50 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage("Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Email valide requis"),
  handleValidationErrors,
];

const validateUserRole = [
  body("role")
    .isIn(["utilisateur", "gestionnaire", "admin"])
    .withMessage("Rôle invalide"),
  handleValidationErrors,
];

const validateUserId = [
  param("id")
    .isMongoId()
    .withMessage("ID utilisateur invalide"),
  handleValidationErrors,
];

const validateOrganizationId = [
  param("organizationId")
    .isMongoId()
    .withMessage("ID d'organisation invalide"),
  handleValidationErrors,
];

// ========== QUIZ VALIDATIONS ==========

const validateCreateQuiz = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Le titre est requis"),
  body("description")
    .optional()
    .trim(),
  body("questions")
    .optional()
    .isArray()
    .withMessage("Les questions doivent être un tableau"),
  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic doit être un booléen"),
  body("organisationId")
    .optional()
    .isMongoId()
    .withMessage("ID d'organisation invalide"),
  handleValidationErrors,
];

const validateUpdateQuiz = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Le titre ne peut pas être vide"),
  body("description")
    .optional()
    .trim(),
  body("questions")
    .optional()
    .isArray()
    .withMessage("Les questions doivent être un tableau"),
  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic doit être un booléen"),
  handleValidationErrors,
];

const validateQuizId = [
  param("id")
    .isMongoId()
    .withMessage("ID de quiz invalide"),
  handleValidationErrors,
];

// ========== ORGANISATION VALIDATIONS ==========

const validateCreateOrganisation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Le nom de l'organisation doit contenir entre 2 et 100 caractères"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La description ne peut pas dépasser 500 caractères"),
  body("website")
    .optional()
    .isURL()
    .withMessage("URL de site web invalide"),
  handleValidationErrors,
];

const validateUpdateOrganisation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Le nom de l'organisation doit contenir entre 2 et 100 caractères"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La description ne peut pas dépasser 500 caractères"),
  body("website")
    .optional()
    .isURL()
    .withMessage("URL de site web invalide"),
  handleValidationErrors,
];

// ========== QUERY VALIDATIONS ==========

const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Le numéro de page doit être un entier positif"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("La limite doit être entre 1 et 100"),
  handleValidationErrors,
];

const validateSearch = [
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Le terme de recherche doit contenir entre 1 et 100 caractères"),
  handleValidationErrors,
];

module.exports = {
  // Auth
  validateRegister,
  validateLogin,
  validateRefreshToken,
  
  // Users
  validateUpdateUser,
  validateUserRole,
  validateUserId,
  validateOrganizationId,
  
  // Quiz
  validateCreateQuiz,
  validateUpdateQuiz,
  validateQuizId,
  
  // Organisation
  validateCreateOrganisation,
  validateUpdateOrganisation,
  
  // Common
  validatePagination,
  validateSearch,
  handleValidationErrors,
};