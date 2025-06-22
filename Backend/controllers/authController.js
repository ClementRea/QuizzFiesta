const User = require('../models/User');
const tokenService = require('../services/tokenService');

//REGISTER
exports.register = async (req, res, next) => {
  try {
      const { email, password, userName, role } = req.body;

      // On vérifie s'il exite déja un user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({
              status: 'error',
              message: 'Email already registered',
          });
      }else{            
        // On crée un nouveau user
        const user = await User.create({
            email,
            password,
            userName,
            role,
            lastLogin: new Date()
        });

        const accessToken = tokenService.generateAccessToken(user._id, user.tokenVersion);
        const refreshToken = tokenService.generateRefreshToken();
        const tokenFamily = tokenService.generateTokenFamily();
        const securityInfo = tokenService.extractSecurityInfo(req);

        // Détecter activité suspecte
        const suspiciousCheck = tokenService.detectSuspiciousActivity(user, securityInfo);
        if (suspiciousCheck.suspicious) {
            user.suspiciousActivity = {
                detected: true,
                lastDetection: new Date(),
                reason: suspiciousCheck.reason
            };
            // En cas d'activité suspecte, invalider tous les tokens
            tokenService.invalidateAllTokens(user);
        }

        // Nettoyer les tokens expirés
        tokenService.cleanExpiredTokens(user);

        // Hasher et stocker le refresh token
        const tokenHash = await tokenService.hashRefreshToken(refreshToken);
        user.refreshTokens = user.refreshTokens || [];
        user.refreshTokens.push({
            tokenHash,
            family: tokenFamily,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
            lastUsed: new Date(),
            userAgent: securityInfo.userAgent,
            ipAddress: securityInfo.ipAddress
        });

        await user.save();

        // On retire le mot de passe de la réponse
        user.password = undefined;
        
        res.status(201).json({
            status: 'success register',
            accessToken,
            refreshToken,
            expiresIn: 15 * 60, // 15 minutes en secondes
            data: {
                user
            }
        });
      }
  } catch (error) {
      next("Erreur Back formulaire", error);
  }
};

//LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // On vérifie si l'email et le mdp sont fournis
    if (!email || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Please provide email and password'
        });
    }

    // On trouve le user et on compare les mdp
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid email or password'
        });
    }

    user.lastLogin = new Date();
    
    const accessToken = tokenService.generateAccessToken(user._id, user.tokenVersion);
    const refreshToken = tokenService.generateRefreshToken();
    const tokenFamily = tokenService.generateTokenFamily();
    const securityInfo = tokenService.extractSecurityInfo(req);

    // Détecter activité suspecte
    const suspiciousCheck = tokenService.detectSuspiciousActivity(user, securityInfo);
    if (suspiciousCheck.suspicious) {
        user.suspiciousActivity = {
            detected: true,
            lastDetection: new Date(),
            reason: suspiciousCheck.reason
        };
        tokenService.invalidateAllTokens(user);
    }

    // Nettoyer les tokens expirés
    tokenService.cleanExpiredTokens(user);

    // Hasher et stocker le refresh token
    const tokenHash = await tokenService.hashRefreshToken(refreshToken);
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
        tokenHash,
        family: tokenFamily,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(),
        userAgent: securityInfo.userAgent,
        ipAddress: securityInfo.ipAddress
    });

    await user.save({ validateBeforeSave: false });

    user.password = undefined;

    console.log("success login")
    res.status(200).json({
        status: 'success login',
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes
        data: {
            user
        }
    });
  } catch (error) {
      next(error);
  }
};

// REFRESH TOKEN avec rotation sécurisée
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const securityInfo = tokenService.extractSecurityInfo(req);

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token required'
      });
    }

    // Trouver l'utilisateur avec un refresh token valide
    const user = await User.findOne({
      'refreshTokens.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      return res.status(403).json({
        status: 'error',
        message: 'No valid refresh token found'
      });
    }

    // Vérifier le refresh token hashé
    let matchingTokenIndex = -1;
    let matchingToken = null;

    for (let i = 0; i < user.refreshTokens.length; i++) {
      const tokenObj = user.refreshTokens[i];
      const isValid = await tokenService.verifyRefreshToken(refreshToken, tokenObj.tokenHash);
      
      if (isValid && tokenObj.expiresAt > new Date()) {
        matchingTokenIndex = i;
        matchingToken = tokenObj;
        break;
      }
    }

    if (!matchingToken) {
      // DÉTECTION DE RÉUTILISATION - Token invalide utilisé
      // Cela peut indiquer que le token a été volé
      console.log(`🚨 SECURITY ALERT: Invalid refresh token attempted for user ${user._id}`);
      
      // Invalider TOUS les tokens de cet utilisateur par sécurité
      tokenService.invalidateAllTokens(user);
      user.suspiciousActivity = {
        detected: true,
        lastDetection: new Date(),
        reason: 'Invalid refresh token reuse detected'
      };
      await user.save();

      return res.status(403).json({
        status: 'error',
        message: 'Invalid refresh token - all sessions terminated for security'
      });
    }

    // Vérifier si le token a déjà été utilisé récemment (possible réutilisation)
    const timeSinceLastUse = Date.now() - (matchingToken.lastUsed?.getTime() || 0);
    if (timeSinceLastUse < 1000) { // Moins d'1 seconde
      console.log(`🚨 SECURITY ALERT: Possible token reuse for user ${user._id}`);
      
      // Invalider toute la famille de tokens
      tokenService.invalidateTokenFamily(user, matchingToken.family);
      user.suspiciousActivity = {
        detected: true,
        lastDetection: new Date(),
        reason: 'Possible refresh token reuse'
      };
      await user.save();

      return res.status(403).json({
        status: 'error',
        message: 'Token reuse detected - session family terminated'
      });
    }

    // ROTATION DES TOKENS - Générer de nouveaux tokens
    const newAccessToken = tokenService.generateAccessToken(user._id, user.tokenVersion);
    const newRefreshToken = tokenService.generateRefreshToken();
    const newTokenHash = await tokenService.hashRefreshToken(newRefreshToken);

    // Supprimer l'ancien refresh token
    user.refreshTokens.splice(matchingTokenIndex, 1);

    // Ajouter le nouveau refresh token
    user.refreshTokens.push({
      tokenHash: newTokenHash,
      family: matchingToken.family, // Même famille pour le suivi
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(),
      userAgent: securityInfo.userAgent,
      ipAddress: securityInfo.ipAddress
    });

    // Nettoyer les tokens expirés
    tokenService.cleanExpiredTokens(user);

    await user.save();

    res.status(200).json({
      status: 'success',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60 // 15 minutes
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    next(error);
  }
};

// LOGOUT sécurisé avec options d'invalidation
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken, logoutAll } = req.body;

    if (refreshToken) {
      const user = await User.findOne({});
      
      if (user) {
        if (logoutAll) {
          // Déconnexion de toutes les sessions
          tokenService.invalidateAllTokens(user);
          console.log(`User ${user._id} logged out from all sessions`);
        } else {
          // Déconnexion de la session actuelle uniquement
          for (let i = 0; i < user.refreshTokens.length; i++) {
            const tokenObj = user.refreshTokens[i];
            const isValid = await tokenService.verifyRefreshToken(refreshToken, tokenObj.tokenHash);
            
            if (isValid) {
              // Invalider toute la famille de ce token
              tokenService.invalidateTokenFamily(user, tokenObj.family);
              break;
            }
          }
        }
        
        await user.save();
      }
    }

    res.status(200).json({
      status: 'success',
      message: logoutAll ? 'Logged out from all sessions' : 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
};