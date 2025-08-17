const express = require("express");

const router = express.Router();
const authController = require("../controllers/authController");
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} = require("../middlewares/validationMiddleware");

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/refresh-token", validateRefreshToken, authController.refreshToken);
router.post("/logout", authController.logout);

module.exports = router;
