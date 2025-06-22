const jwt = require('jsonwebtoken');
const User = require('../models/User');
const tokenService = require('../services/tokenService');

exports.protect = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Vous n\'êtes pas connecté, connectez-vous pour continuer.',
                code: 'NO_TOKEN'
            });
        }

        // Vérifier et décoder le token
        const verification = tokenService.verifyAccessToken(token);
        
        if (!verification.valid) {
            return res.status(401).json({
                status: 'error',
                message: 'Token invalide ou expiré.',
                code: 'INVALID_TOKEN',
                reason: verification.error
            });
        }

        const decoded = verification.payload;

        // Vérifier que l'utilisateur existe toujours
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'L\'utilisateur n\'existe plus.',
                code: 'USER_NOT_FOUND'
            });
        }

        // Vérifier la version du token (pour invalidation globale)
        if (decoded.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({
                status: 'error',
                message: 'Session expirée, veuillez vous reconnecter.',
                code: 'TOKEN_VERSION_MISMATCH'
            });
        }

        // Vérifier si l'utilisateur a une activité suspecte
        if (user.suspiciousActivity?.detected) {
            return res.status(401).json({
                status: 'error',
                message: 'Compte temporairement suspendu pour activité suspecte.',
                code: 'SUSPICIOUS_ACTIVITY'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Erreur d\'authentification.',
            code: 'AUTH_ERROR'
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Vous n\'avez pas les autorisations requises.'
            });
        }
        next();
    };
};