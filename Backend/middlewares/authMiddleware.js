const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Dans authMiddleware.js

exports.protect = async (req, res, next) => {
    try {
        let token;
        
        // 1) Vérifier si le token existe
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'You are not logged in. Please log in to get access.'
            });
        }

        // 2) Vérifier si le token est valide
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log('Decoded token:', decoded); // Debug log

        // 3) Vérifier si l'utilisateur existe toujours
        const user = await User.findById(decoded.id);
        
        console.log('Found user:', user); // Debug log

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'The user belonging to this token no longer exists.'
            });
        }

        // 4) Accorder l'accès à la route protégée
        req.user = user;
        next();
    } catch (error) {
        console.error('Error in protect middleware:', error); // Debug log
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token. Please log in again.'
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};