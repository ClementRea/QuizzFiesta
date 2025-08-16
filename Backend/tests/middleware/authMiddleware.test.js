const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const {
  protect,
  restrictTo,
  requireAdmin,
  requireGestionnaireOrAdmin,
  checkOrganizationAccess,
} = require("../../middlewares/authMiddleware");

jest.mock("jsonwebtoken");
jest.mock("../../models/User", () => ({
  findById: jest.fn(),
}));

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
      user: null,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    process.env.JWT_SECRET = "test-secret-key";
  });

  describe("protect middleware", () => {
    it("should authenticate user with valid token", async () => {
      const validToken = "valid.jwt.token";
      const decodedPayload = { id: "user123" };
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        role: "user",
      };

      req.headers.authorization = `Bearer ${validToken}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(validToken, "test-secret-key");
      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 when no token provided", async () => {
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Token invalide, veuillez réessayer.",
      });
      expect(next).not.toHaveBeenCalled();
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header does not start with Bearer", async () => {
      req.headers.authorization = "Basic sometoken";
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Token invalide, veuillez réessayer.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when JWT verification fails", async () => {
      req.headers.authorization = "Bearer invalid.token";
      jwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });
      await protect(req, res, next);
      expect(jwt.verify).toHaveBeenCalledWith(
        "invalid.token",
        "test-secret-key",
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Token invalide, veuillez réessayer.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when user does not exist", async () => {
      const validToken = "valid.jwt.token";
      const decodedPayload = { id: "nonexistent123" };

      req.headers.authorization = `Bearer ${validToken}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(null);

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(validToken, "test-secret-key");
      expect(User.findById).toHaveBeenCalledWith("nonexistent123");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "L'utilisateur n'existe pas.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when database error occurs", async () => {
      const validToken = "valid.jwt.token";
      const decodedPayload = { id: "user123" };

      req.headers.authorization = `Bearer ${validToken}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockRejectedValue(new Error("Database error"));

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Token invalide, veuillez réessayer.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle JWT expired error specifically", async () => {
      req.headers.authorization = "Bearer expired.token";
      const expiredError = new Error("Token expired");
      expiredError.name = "TokenExpiredError";
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Token invalide, veuillez réessayer.",
      });
    });

    it("should extract token correctly from Bearer header", async () => {
      const token = "my.test.token";
      const decodedPayload = { id: "user123" };
      const mockUser = { _id: "user123", role: "user" };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret-key");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("restrictTo middleware", () => {
    beforeEach(() => {
      req.user = {
        _id: "user123",
        role: "user",
      };
    });

    it("should allow access when user has required role", () => {
      // Arrange
      req.user.role = "admin";
      const middleware = restrictTo("admin");

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow access when user has one of multiple required roles", () => {
      req.user.role = "gestionnaire";
      const middleware = restrictTo("admin", "gestionnaire");

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should deny access when user does not have required role", () => {
      req.user.role = "user";
      const middleware = restrictTo("admin");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Vous n'avez pas les autorisations requises.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should deny access when user does not have any of the required roles", () => {
      req.user.role = "user";
      const middleware = restrictTo("admin", "gestionnaire");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Vous n'avez pas les autorisations requises.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should be case sensitive for roles", () => {
      req.user.role = "Admin";
      const middleware = restrictTo("admin");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Vous n'avez pas les autorisations requises.",
      });
    });

    it("should work with single role as string", () => {
      req.user.role = "admin";
      const middleware = restrictTo("admin");

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("should handle edge case with empty roles array", () => {
      req.user.role = "admin";
      const middleware = restrictTo();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Vous n'avez pas les autorisations requises.",
      });
    });
  });

  describe("requireAdmin middleware", () => {
    beforeEach(() => {
      req.user = { _id: "user123", role: "user" };
    });

    it("should allow access for admin", () => {
      req.user.role = "admin";
      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should deny access for non-admin", () => {
      req.user.role = "user";
      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Accès réservé aux administrateurs.",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireGestionnaireOrAdmin middleware", () => {
    beforeEach(() => {
      req.user = { _id: "user123", role: "user" };
    });

    it("should allow access for admin", () => {
      req.user.role = "admin";
      requireGestionnaireOrAdmin(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow access for gestionnaire", () => {
      req.user.role = "gestionnaire";
      requireGestionnaireOrAdmin(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should deny access for other roles", () => {
      req.user.role = "user";
      requireGestionnaireOrAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Accès réservé aux gestionnaires et administrateurs.",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("checkOrganizationAccess middleware", () => {
    beforeEach(() => {
      req.user = { _id: "user123", role: "user" };
      req.params = {};
    });

    it("should allow admin to access", async () => {
      req.user.role = "admin";
      const nextAsync = jest.fn();
      await checkOrganizationAccess(req, res, nextAsync);
      expect(nextAsync).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should deny access for non-admin/gestionnaire", async () => {
      req.user.role = "user";
      await checkOrganizationAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Accès refusé.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should deny gestionnaire without organization", async () => {
      req.user.role = "gestionnaire";
      req.user.organization = undefined;
      await checkOrganizationAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Gestionnaire sans organisation assignée.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should allow gestionnaire with organization and no target user", async () => {
      req.user.role = "gestionnaire";
      req.user.organization = "org1";
      req.params = {};
      const nextAsync = jest.fn();
      await checkOrganizationAccess(req, res, nextAsync);
      expect(nextAsync).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should deny gestionnaire if target user not found", async () => {
      req.user.role = "gestionnaire";
      req.user.organization = "org1";
      req.params = { id: "targetId" };
      User.findById.mockResolvedValue(null);
      await checkOrganizationAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Utilisateur non trouvé.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should deny gestionnaire if target user is from another organization", async () => {
      req.user.role = "gestionnaire";
      req.user.organization = "org1";
      req.params = { id: "targetId" };
      User.findById.mockResolvedValue({
        _id: "targetId",
        organization: "org2",
      });
      await checkOrganizationAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Accès refusé : utilisateur d'une autre organisation.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should allow gestionnaire if target user is from same organization", async () => {
      req.user.role = "gestionnaire";
      req.user.organization = "org1";
      req.params = { id: "targetId" };
      User.findById.mockResolvedValue({
        _id: "targetId",
        organization: "org1",
      });
      const nextAsync = jest.fn();
      await checkOrganizationAccess(req, res, nextAsync);
      expect(nextAsync).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should handle errors and return 500", async () => {
      req.user.role = "gestionnaire";
      req.user.organization = "org1";
      req.params = { id: "targetId" };
      User.findById.mockRejectedValue(new Error("DB error"));
      await checkOrganizationAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Erreur lors de la vérification des permissions.",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("middleware integration", () => {
    it("should work together - protect then restrictTo", async () => {
      const token = "valid.token";
      const decodedPayload = { id: "admin123" };
      const adminUser = {
        _id: "admin123",
        email: "admin@example.com",
        role: "admin",
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(adminUser);

      await protect(req, res, next);

      expect(req.user).toBe(adminUser);
      expect(next).toHaveBeenCalledTimes(1);

      const restrictMiddleware = restrictTo("admin");
      restrictMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should block user with valid token but wrong role", async () => {
      const token = "valid.token";
      const decodedPayload = { id: "user123" };
      const regularUser = {
        _id: "user123",
        email: "user@example.com",
        role: "user",
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(regularUser);

      await protect(req, res, next);

      expect(req.user).toBe(regularUser);
      expect(next).toHaveBeenCalledTimes(1);

      next.mockClear();

      const restrictMiddleware = restrictTo("admin");
      restrictMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
