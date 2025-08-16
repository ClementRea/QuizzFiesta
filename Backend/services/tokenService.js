const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

class TokenService {
  // Generate Access token
  generateAccessToken(userId, tokenVersion) {
    return jwt.sign(
      {
        id: userId,
        tokenVersion,
        type: "access",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
        issuer: "quizzfiesta",
        audience: "quizzfiesta-client",
      },
    );
  }

  // Generate Refresh token with userId
  generateRefreshToken(userId) {
    return jwt.sign(
      {
        userId,
        type: "refresh",
        family: this.generateTokenFamily(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
        issuer: "quizzfiesta",
        audience: "quizzfiesta-client",
      },
    );
  }

  // Generate family identifier
  generateTokenFamily() {
    return crypto.randomUUID();
  }

  // Hash the refresh token for storage
  async hashRefreshToken(token) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(token, salt);
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        {
          issuer: "quizzfiesta",
          audience: "quizzfiesta-client",
        },
      );
      return { valid: true, payload: decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "quizzfiesta",
        audience: "quizzfiesta-client",
      });
      return { valid: true, payload: decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Extract security info from request
  extractSecurityInfo(req) {
    return {
      userAgent: req.get("User-Agent") || "unknown",
      ipAddress: req.ip || req.connection.remoteAddress || "unknown",
    };
  }

  // Detect suspicious activity
  detectSuspiciousActivity(user, securityInfo) {
    const recentTokens = user.refreshTokens.filter(
      (token) => Date.now() - token.createdAt.getTime() < 60 * 60 * 1000, // 1 heure
    );

    // 1 : To much usage
    if (recentTokens.length > 5) {
      return {
        suspicious: true,
        reason: "Too many refresh tokens created recently",
      };
    }

    // Connexions from too muh ips
    const uniqueIPs = new Set(recentTokens.map((t) => t.ipAddress));
    if (uniqueIPs.size > 3) {
      return {
        suspicious: true,
        reason: "Multiple IP addresses used recently",
      };
    }

    return { suspicious: false };
  }

  // clear token
  cleanExpiredTokens(user) {
    const now = new Date();
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token.expiresAt > now,
    );
    return user;
  }

  // Invalidate token family
  invalidateTokenFamily(user, family) {
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token.family !== family,
    );
    user.tokenVersion += 1;
    return user;
  }

  // Invalidate all tokens
  invalidateAllTokens(user) {
    user.refreshTokens = [];
    user.tokenVersion += 1;
    return user;
  }
}

module.exports = new TokenService();
