const gameSessionController = require('../../controllers/gameSessionController');
const GameSession = require('../../models/GameSession');
const Quiz = require('../../models/Quiz');
const LobbyParticipant = require('../../models/LobbyParticipant');
const GameParticipant = require('../../models/GameParticipant');
const Question = require('../../models/Question');

jest.mock('../../models/GameSession');
jest.mock('../../models/Quiz');
jest.mock('../../models/LobbyParticipant');
jest.mock('../../models/GameParticipant');
jest.mock('../../models/Question');

describe('GameSession Controller', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: 'user123', userName: 'User', avatar: 'avatar.png', isAdmin: false }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('createGameSession', () => {
    it('should create a session if quiz exists', async () => {
      req.params.quizId = 'quizid';
      Quiz.findById.mockResolvedValue({ _id: 'quizid', questions: ['q1', 'q2'] });
      const sessionMock = {
        _id: 'sessid',
        sessionCode: 'ABC123',
        status: 'lobby',
        quiz: { title: 'Quiz', description: 'Desc', logo: 'logo.png' },
        organizer: { userName: 'User', avatar: 'avatar.png' },
        settings: {},
        participantCount: 1,
        gameState: {},
        createdAt: new Date(),
        populate: jest.fn().mockResolvedValue(),
        save: jest.fn().mockResolvedValue()
      };
      GameSession.createSession = jest.fn().mockResolvedValue(sessionMock);
      Question.countDocuments.mockResolvedValue(2);

      await gameSessionController.createGameSession(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });
    it('should return 404 if quiz not found', async () => {
      req.params.quizId = 'quizid';
      Quiz.findById.mockResolvedValue(null);
      await gameSessionController.createGameSession(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });
  });

  describe('joinSessionByCode', () => {
    it('should join a session by code', async () => {
      req.params.sessionCode = 'ABC123';
      const sessionMock = {
        _id: 'sessid',
        sessionCode: 'ABC123',
        status: 'lobby',
        quiz: {},
        organizer: {},
        settings: {},
        participantCount: 1,
        gameState: {},
        canJoin: jest.fn().mockReturnValue(true),
        canLateJoin: jest.fn().mockReturnValue(false)
      };
      GameSession.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(sessionMock) });
      LobbyParticipant.findOne.mockResolvedValue(null);
      await gameSessionController.joinSessionByCode(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });
    it('should return 404 if session not found', async () => {
      req.params.sessionCode = 'ABC123';
      GameSession.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      await gameSessionController.joinSessionByCode(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('leaveSessionLobby', () => {
    it('should leave lobby if session exists', async () => {
      req.params.sessionId = 'sessid';
      const sessionMock = {
        _id: 'sessid',
        organizerId: 'user123',
        updateParticipantCount: jest.fn().mockResolvedValue(),
        save: jest.fn().mockResolvedValue(),
        status: 'lobby'
      };
      GameSession.findById.mockResolvedValue(sessionMock);
      LobbyParticipant.deleteOne.mockResolvedValue({ deletedCount: 1 });
      LobbyParticipant.find.mockResolvedValue([]);
      await gameSessionController.leaveSessionLobby(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });
    it('should return 404 if session not found', async () => {
      req.params.sessionId = 'sessid';
      GameSession.findById.mockResolvedValue(null);
      await gameSessionController.leaveSessionLobby(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getSessionParticipants', () => {
    it('should return participants', async () => {
      req.params.sessionId = 'sessid';
      LobbyParticipant.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ userId: 'u1' }]) });
      await gameSessionController.getSessionParticipants(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });
  });

  describe('setParticipantReady', () => {
    it('should set participant ready', async () => {
      req.params.sessionId = 'sessid';
      req.body.isReady = true;
      LobbyParticipant.findOneAndUpdate.mockResolvedValue({ userId: 'user123', isReady: true });
      await gameSessionController.setParticipantReady(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });
    it('should return 404 if participant not found', async () => {
      req.params.sessionId = 'sessid';
      req.body.isReady = true;
      LobbyParticipant.findOneAndUpdate.mockResolvedValue(null);
      await gameSessionController.setParticipantReady(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getSessionState', () => {
    it('should return session state', async () => {
      req.params.sessionId = 'sessid';
      GameSession.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue({ _id: 'sessid' })
      });
      await gameSessionController.getSessionState(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });
    it('should return 404 if session not found', async () => {
      req.params.sessionId = 'sessid';
      GameSession.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      });
      await gameSessionController.getSessionState(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
