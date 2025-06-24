const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { register, login } = require('../../controllers/authController');

jest.mock('../../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-jwt-token')
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
      User.create.mockResolvedValue({ _id: '2', email: 'test@mail.com', userName: 'bob', role: 'user', password: '123' });
      await register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success register',
        token: expect.any(String),
        data: { user: expect.objectContaining({ email: 'test@mail.com' }) }
      }));
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
        token: expect.any(String),
        data: { user: expect.objectContaining({ email: 'test@mail.com' }) }
      }));
    });
  });
});
