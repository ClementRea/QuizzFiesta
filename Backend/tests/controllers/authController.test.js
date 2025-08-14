const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { register, login, refreshToken, logout } = require('../../controllers/authController');

jest.mock('../../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-jwt-token')
}));

jest.mock('../../services/tokenService', () => ({
  generateAccessToken: jest.fn(() => 'mocked-access-token'),
  generateRefreshToken: jest.fn(() => 'mocked-refresh-token'),
  generateTokenFamily: jest.fn(() => 'mocked-token-family'),
  extractSecurityInfo: jest.fn(() => ({ userAgent: 'test-agent', ipAddress: '127.0.0.1' })),
  detectSuspiciousActivity: jest.fn(() => ({ suspicious: false })),
  cleanExpiredTokens: jest.fn((user) => user),
  hashRefreshToken: jest.fn(() => 'mocked-hash'),
  verifyRefreshToken: jest.fn(() => ({ valid: true, payload: { userId: 'u1', family: 'fam1' } })),
  invalidateAllTokens: jest.fn(),
  invalidateTokenFamily: jest.fn()
}));

describe('authController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, user: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 400 if email already exists', async () => {
      req.body = { email: 'test@mail.com', password: '123', userName: 'bob', role: 'user' };
      User.findOne.mockResolvedValue({ _id: '1' });
      await register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email already registered',
      });
    });

    it('should create user and return token if email is new', async () => {
      req.body = { email: 'test@mail.com', password: '123', userName: 'bob', role: 'user' };
      User.findOne.mockResolvedValue(null);
      const userMock = { 
        _id: '2', 
        email: 'test@mail.com', 
        userName: 'bob', 
        role: 'user', 
        password: '123', 
        refreshTokens: [],
        save: jest.fn().mockResolvedValue()
      };
      User.create.mockResolvedValue(userMock);
      await register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success register',
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        data: { user: expect.objectContaining({ email: 'test@mail.com' }) }
      }));
    });

    it('should flag suspicious activity and invalidate tokens', async () => {
      const tokenService = require('../../services/tokenService');
      tokenService.detectSuspiciousActivity.mockReturnValue({ suspicious: true, reason: 'test' });
      req.body = { email: 'suspicious@mail.com', password: '123', userName: 'sus', role: 'user' };
      User.findOne.mockResolvedValue(null);
      const userMock = { _id: '3', email: 'suspicious@mail.com', userName: 'sus', role: 'user', password: '123', refreshTokens: [], save: jest.fn().mockResolvedValue() };
      User.create.mockResolvedValue(userMock);
      await register(req, res, next);
      expect(require('../../services/tokenService').invalidateAllTokens).toHaveBeenCalled();
    });

    it('should call next on creation error', async () => {
      req.body = { email: 'err@mail.com', password: '123', userName: 'err', role: 'user' };
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('db fail'));
      await register(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return 400 if email or password missing', async () => {
      req.body = { email: '', password: '' };
      await login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Please provide email and password'
      });
    });

    it('should return 401 if user not found or password invalid', async () => {
      req.body = { email: 'test@mail.com', password: 'wrong' };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });
      await login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid email or password'
      });
    });

    it('should return 401 if password is incorrect', async () => {
      req.body = { email: 'test@mail.com', password: 'wrong' };
      const userMock = {
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userMock)
      });
      await login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid email or password'
      });
    });

    it('should login successfully and return token', async () => {
      req.body = { email: 'test@mail.com', password: '123' };
      const userMock = {
        _id: '2',
        email: 'test@mail.com',
        userName: 'bob',
        role: 'user',
        password: '123',
        refreshTokens: [],
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(),
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userMock)
      });
      await login(req, res, next);
      expect(userMock.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success login',
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        data: { user: expect.objectContaining({ email: 'test@mail.com' }) }
      }));
    });

    it('should detect suspicious activity on login', async () => {
      const tokenService = require('../../services/tokenService');
      tokenService.detectSuspiciousActivity.mockReturnValue({ suspicious: true, reason: 'multi ip' });
      req.body = { email: 'sus@login.com', password: 'pw' };
      const userMock = { _id: '5', email: 'sus@login.com', password: 'pw', refreshTokens: [], comparePassword: jest.fn().mockResolvedValue(true), save: jest.fn().mockResolvedValue() };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userMock) });
      await login(req, res, next);
      expect(require('../../services/tokenService').invalidateAllTokens).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should return 401 if missing token', async () => {
      req.body = {};
      await refreshToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 if token invalid', async () => {
      const tokenService = require('../../services/tokenService');
      tokenService.verifyRefreshToken.mockReturnValue({ valid: false, error: 'bad' });
      req.body = { refreshToken: 'x' };
      await refreshToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 if user not found', async () => {
      const tokenService = require('../../services/tokenService');
      tokenService.verifyRefreshToken.mockReturnValue({ valid: true, payload: { userId: 'nope', family: 'fam1' } });
      req.body = { refreshToken: 'good' };
      User.findById.mockResolvedValue(null);
      await refreshToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 if family revoked', async () => {
      const tokenService = require('../../services/tokenService');
      tokenService.verifyRefreshToken.mockReturnValue({ valid: true, payload: { userId: 'u10', family: 'famX' } });
      req.body = { refreshToken: 'good' };
      const userMock = { _id: 'u10', refreshTokens: [{ family: 'famY', expiresAt: new Date(Date.now() + 10000) }], save: jest.fn() };
      User.findById.mockResolvedValue(userMock);
      await refreshToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should refresh successfully', async () => {
      const tokenService = require('../../services/tokenService');
      tokenService.verifyRefreshToken.mockReturnValue({ valid: true, payload: { userId: 'u11', family: 'famZ' } });
      req.body = { refreshToken: 'good' };
      const tokenRecord = { family: 'famZ', expiresAt: new Date(Date.now() + 10000) };
      const userMock = { _id: 'u11', refreshTokens: [tokenRecord], save: jest.fn() };
      User.findById.mockResolvedValue(userMock);
      await refreshToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: expect.any(String), refreshToken: expect.any(String) }));
    });
  });

  describe('logout', () => {
    it('should logout without token', async () => {
      req.body = {};
      await logout(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Logged out successfully' }));
    });

    it('should logout all sessions', async () => {
      const tokenService = require('../../services/tokenService');
      tokenService.verifyRefreshToken.mockReturnValue({ valid: true, payload: { userId: 'u1', family: 'fam1' } });
      const userMock = { _id: 'u1', refreshTokens: [], save: jest.fn() };
      User.findById.mockResolvedValue(userMock);
      req.body = { refreshToken: 'tok', logoutAll: true };
      await logout(req, res, next);
      expect(tokenService.invalidateAllTokens).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Logged out from all sessions' }));
    });

    it('should logout single session family', async () => {
      const tokenService = require('../../services/tokenService');
      tokenService.verifyRefreshToken.mockReturnValue({ valid: true, payload: { userId: 'u2', family: 'fam2' } });
      const userMock = { _id: 'u2', refreshTokens: [], save: jest.fn() };
      User.findById.mockResolvedValue(userMock);
      req.body = { refreshToken: 'tok', logoutAll: false };
      await logout(req, res, next);
      expect(tokenService.invalidateTokenFamily).toHaveBeenCalledWith(userMock, 'fam2');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Logged out successfully' }));
    });
  });
});
