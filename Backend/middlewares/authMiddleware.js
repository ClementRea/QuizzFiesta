const jwt = require("jsonwebtoken");

const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Vous n'êtes pas connecté, connecter vous pour continuer.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "L'utilisateur n'existe pas.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Token invalide, veuillez réessayer.",
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Vous n'avez pas les autorisations requises.",
      });
    }
    next();
  };
};

exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Accès réservé aux administrateurs.",
    });
  }
  next();
};

exports.requireGestionnaireOrAdmin = (req, res, next) => {
  if (!["admin", "gestionnaire"].includes(req.user.role)) {
    return res.status(403).json({
      status: "error",
      message: "Accès réservé aux gestionnaires et administrateurs.",
    });
  }
  next();
};

exports.checkOrganizationAccess = async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.role === "gestionnaire") {
      if (!req.user.organization) {
        return res.status(403).json({
          status: "error",
          message: "Gestionnaire sans organisation assignée.",
        });
      }

      const targetUserId = req.params.id || req.params.userId;
      if (targetUserId) {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
          return res.status(404).json({
            status: "error",
            message: "Utilisateur non trouvé.",
          });
        }

        if (
          !targetUser.organization ||
          targetUser.organization.toString() !==
            req.user.organization.toString()
        ) {
          return res.status(403).json({
            status: "error",
            message: "Accès refusé : utilisateur d'une autre organisation.",
          });
        }
      }

      return next();
    }

    return res.status(403).json({
      status: "error",
      message: "Accès refusé.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Erreur lors de la vérification des permissions.",
    });
  }
};
