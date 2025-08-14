const User = require('../models/User');
const tokenService = require('../services/tokenService');

//REGISTER
exports.register = async (req, res, next) => {
  try {
      const { email, password, userName, role } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({
              status: 'error',
              message: 'Email already registered',
          });
      }else{            
        const user = await User.create({
            email,
            password,
            userName,
            role,
            lastLogin: new Date()
        });

        const accessToken = tokenService.generateAccessToken(user._id, user.tokenVersion);
        const refreshToken = tokenService.generateRefreshToken(user._id);
        const tokenFamily = tokenService.generateTokenFamily();
        const securityInfo = tokenService.extractSecurityInfo(req);

        const suspiciousCheck = tokenService.detectSuspiciousActivity(user, securityInfo);
        if (suspiciousCheck.suspicious) {
            user.suspiciousActivity = {
                detected: true,
                lastDetection: new Date(),
                reason: suspiciousCheck.reason
            };
            tokenService.invalidateAllTokens(user);
        }

        tokenService.cleanExpiredTokens(user);

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

        await user.save();

        user.password = undefined;
        
        res.status(201).json({
            status: 'success register',
            accessToken,
            refreshToken,
            expiresIn: 10 * 60,
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

    if (!email || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Please provide email and password'
        });
    }

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

    const suspiciousCheck = tokenService.detectSuspiciousActivity(user, securityInfo);
    if (suspiciousCheck.suspicious) {
        user.suspiciousActivity = {
            detected: true,
            lastDetection: new Date(),
            reason: suspiciousCheck.reason
        };
        tokenService.invalidateAllTokens(user);
    }

    tokenService.cleanExpiredTokens(user);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
        family: tokenFamily,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(),
        userAgent: securityInfo.userAgent,
        ipAddress: securityInfo.ipAddress
    });

    await user.save({ validateBeforeSave: false });

    user.password = undefined;

    res.status(200).json({
        status: 'success login',
        accessToken,
        refreshToken,
        expiresIn: 10 * 60,
        data: {
            user
        }
    });
  } catch (error) {
      next(error);
  }
};

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

    // Vérifier le JWT refresh token
    const tokenVerification = tokenService.verifyRefreshToken(refreshToken);
    
    if (!tokenVerification.valid) {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid or expired refresh token'
      });
    }

    // Extraire l'userId du token JWT
    const { userId, family } = tokenVerification.payload;
    
    // Récupérer l'utilisateur directement avec l'userId
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(403).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Vérifier que la famille de token existe encore (pas révoquée)
    const familyToken = user.refreshTokens.find(t => t.family === family && t.expiresAt > new Date());
    
    if (!familyToken) {
      return res.status(403).json({
        status: 'error',
        message: 'Token family revoked or expired'
      });
    }

    // Générer nouveaux tokens
    const newAccessToken = tokenService.generateAccessToken(user._id, user.tokenVersion);
    const newRefreshToken = tokenService.generateRefreshToken(user._id);

    // Mettre à jour la dernière utilisation de cette famille
    const tokenIndex = user.refreshTokens.findIndex(t => t.family === family);
    if (tokenIndex !== -1) {
      user.refreshTokens[tokenIndex].lastUsed = new Date();
      user.refreshTokens[tokenIndex].userAgent = securityInfo.userAgent;
      user.refreshTokens[tokenIndex].ipAddress = securityInfo.ipAddress;
    }

    tokenService.cleanExpiredTokens(user);
    await user.save();

    res.status(200).json({
      status: 'success',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 10 * 60
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    next(error);
  }
};

// LOGOUT
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken, logoutAll } = req.body;

    if (refreshToken) {
      // Vérifier le JWT refresh token pour extraire l'userId
      const tokenVerification = tokenService.verifyRefreshToken(refreshToken);
      
      if (tokenVerification.valid) {
        const { userId, family } = tokenVerification.payload;
        const user = await User.findById(userId);
        
        if (user) {
          if (logoutAll) {
            tokenService.invalidateAllTokens(user);
          } else {
            // Invalider seulement cette famille de tokens
            tokenService.invalidateTokenFamily(user, family);
          }
          
          await user.save();
        }
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