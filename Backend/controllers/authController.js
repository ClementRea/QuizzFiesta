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

    const user = await User.findOne({
      'refreshTokens.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      return res.status(403).json({
        status: 'error',
        message: 'No valid refresh token found'
      });
    }

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

    const timeSinceLastUse = Date.now() - (matchingToken.lastUsed?.getTime() || 0);
    if (timeSinceLastUse < 1000) {
      
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
      family: matchingToken.family, 
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(),
      userAgent: securityInfo.userAgent,
      ipAddress: securityInfo.ipAddress
    });

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
      const user = await User.findOne({});
      
      if (user) {
        if (logoutAll) {
          tokenService.invalidateAllTokens(user);
        } else {
          for (let i = 0; i < user.refreshTokens.length; i++) {
            const tokenObj = user.refreshTokens[i];
            const isValid = await tokenService.verifyRefreshToken(refreshToken, tokenObj.tokenHash);
            
            if (isValid) {
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