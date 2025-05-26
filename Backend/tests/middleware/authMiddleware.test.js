// Backend/tests/middlewares/auth.test.js

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { protect, restrictTo } = require('../../middlewares/authMiddleware');

// Mock des dépendances
jest.mock('jsonwebtoken');
jest.mock('../../models/User', () => ({
  findById: jest.fn()
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      headers: {},
      user: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();

    // Mock des variables d'environnement
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('protect middleware', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      const decodedPayload = { id: 'user123' };
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      req.headers.authorization = `Bearer ${validToken}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(mockUser);

      // Act
      await protect(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(validToken, 'test-secret-key');
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      // Arrange - pas de header authorization
      
      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Vous n\'êtes pas connecté, connecter vous pour continuer.'
      });
      expect(next).not.toHaveBeenCalled();
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      // Arrange
      req.headers.authorization = 'Basic sometoken';

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Vous n\'êtes pas connecté, connecter vous pour continuer.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT verification fails', async () => {
      // Arrange
      req.headers.authorization = 'Bearer invalid.token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await protect(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('invalid.token', 'test-secret-key');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token invalide, veuillez réessayer.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user does not exist', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      const decodedPayload = { id: 'nonexistent123' };

      req.headers.authorization = `Bearer ${validToken}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(null); // Utilisateur non trouvé

      // Act
      await protect(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(validToken, 'test-secret-key');
      expect(User.findById).toHaveBeenCalledWith('nonexistent123');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'L\'utilisateur n\'existe pas.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when database error occurs', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      const decodedPayload = { id: 'user123' };

      req.headers.authorization = `Bearer ${validToken}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockRejectedValue(new Error('Database error'));

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token invalide, veuillez réessayer.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle JWT expired error specifically', async () => {
      // Arrange
      req.headers.authorization = 'Bearer expired.token';
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token invalide, veuillez réessayer.'
      });
    });

    it('should extract token correctly from Bearer header', async () => {
      // Arrange
      const token = 'my.test.token';
      const decodedPayload = { id: 'user123' };
      const mockUser = { _id: 'user123', role: 'user' };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(mockUser);

      // Act
      await protect(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret-key');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('restrictTo middleware', () => {
    beforeEach(() => {
      // Simuler qu'un utilisateur est déjà authentifié
      req.user = {
        _id: 'user123',
        role: 'user'
      };
    });

    it('should allow access when user has required role', () => {
      // Arrange
      req.user.role = 'admin';
      const middleware = restrictTo('admin');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple required roles', () => {
      // Arrange
      req.user.role = 'gestionnaire';
      const middleware = restrictTo('admin', 'gestionnaire');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have required role', () => {
      // Arrange
      req.user.role = 'user';
      const middleware = restrictTo('admin');

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Vous n\'avez pas les autorisations requises.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have any of the required roles', () => {
      // Arrange
      req.user.role = 'user';
      const middleware = restrictTo('admin', 'gestionnaire');

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Vous n\'avez pas les autorisations requises.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case sensitive for roles', () => {
      // Arrange
      req.user.role = 'Admin'; // Majuscule
      const middleware = restrictTo('admin'); // Minuscule

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Vous n\'avez pas les autorisations requises.'
      });
    });

    it('should work with single role as string', () => {
      // Arrange
      req.user.role = 'admin';
      const middleware = restrictTo('admin');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle edge case with empty roles array', () => {
      // Arrange
      req.user.role = 'admin';
      const middleware = restrictTo(); // Aucun rôle spécifié

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Vous n\'avez pas les autorisations requises.'
      });
    });
  });

  describe('middleware integration', () => {
    it('should work together - protect then restrictTo', async () => {
      // Arrange - Simuler une séquence complète
      const token = 'valid.token';
      const decodedPayload = { id: 'admin123' };
      const adminUser = {
        _id: 'admin123',
        email: 'admin@example.com',
        role: 'admin'
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(adminUser);

      // Act - Étape 1: protect
      await protect(req, res, next);

      // Assert - protect a fonctionné
      expect(req.user).toBe(adminUser);
      expect(next).toHaveBeenCalledTimes(1);

      // Act - Étape 2: restrictTo (simuler l'appel suivant)
      const restrictMiddleware = restrictTo('admin');
      restrictMiddleware(req, res, next);

      // Assert - restrictTo a aussi fonctionné
      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block user with valid token but wrong role', async () => {
      // Arrange
      const token = 'valid.token';
      const decodedPayload = { id: 'user123' };
      const regularUser = {
        _id: 'user123',
        email: 'user@example.com',
        role: 'user'
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(regularUser);

      // Act - Étape 1: protect
      await protect(req, res, next);

      // Assert - protect a fonctionné
      expect(req.user).toBe(regularUser);
      expect(next).toHaveBeenCalledTimes(1);

      // Reset next mock pour la deuxième partie
      next.mockClear();

      // Act - Étape 2: restrictTo admin
      const restrictMiddleware = restrictTo('admin');
      restrictMiddleware(req, res, next);

      // Assert - restrictTo a bloqué l'accès
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});