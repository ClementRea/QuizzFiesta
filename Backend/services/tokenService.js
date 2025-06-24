const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class TokenService {
    
    // Générer un access token court et sécurisé
    generateAccessToken(userId, tokenVersion) {
        return jwt.sign(
            { 
                id: userId,
                tokenVersion,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '15m',
                issuer: 'quizzfiesta',
                audience: 'quizzfiesta-client'
            }
        );
    }

    // Générer un refresh token cryptographiquement sécurisé
    generateRefreshToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    // Générer un identifiant de famille unique
    generateTokenFamily() {
        return crypto.randomUUID();
    }

    // Hasher le refresh token pour le stockage
    async hashRefreshToken(token) {
        const salt = await bcrypt.genSalt(12);
        return bcrypt.hash(token, salt);
    }

    // Vérifier un refresh token hashé
    async verifyRefreshToken(token, hash) {
        return bcrypt.compare(token, hash);
    }

    // Vérifier un access token
    verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                issuer: 'quizzfiesta',
                audience: 'quizzfiesta-client'
            });
            return { valid: true, payload: decoded };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Extraire les infos de sécurité depuis la requête
    extractSecurityInfo(req) {
        return {
            userAgent: req.get('User-Agent') || 'unknown',
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
        };
    }

    // Détecter une activité suspecte
    detectSuspiciousActivity(user, securityInfo) {
        const recentTokens = user.refreshTokens.filter(
            token => Date.now() - token.createdAt.getTime() < 60 * 60 * 1000 // 1 heure
        );

        // Trop de tokens créés récemment
        if (recentTokens.length > 5) {
            return {
                suspicious: true,
                reason: 'Too many refresh tokens created recently'
            };
        }

        // Connexions depuis des IPs très différentes
        const uniqueIPs = new Set(recentTokens.map(t => t.ipAddress));
        if (uniqueIPs.size > 3) {
            return {
                suspicious: true,
                reason: 'Multiple IP addresses used recently'
            };
        }

        return { suspicious: false };
    }

    // Nettoyer les tokens expirés
    cleanExpiredTokens(user) {
        const now = new Date();
        user.refreshTokens = user.refreshTokens.filter(
            token => token.expiresAt > now
        );
        return user;
    }

    // Invalider toute une famille de tokens (en cas de compromission)
    invalidateTokenFamily(user, family) {
        user.refreshTokens = user.refreshTokens.filter(
            token => token.family !== family
        );
        user.tokenVersion += 1; // Invalide tous les access tokens existants
        return user;
    }

    // Invalider tous les tokens de l'utilisateur
    invalidateAllTokens(user) {
        user.refreshTokens = [];
        user.tokenVersion += 1;
        return user;
    }
}

module.exports = new TokenService();
