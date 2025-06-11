
const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');
const mongoose = require('mongoose');
const crypto = require('crypto');

const {
  quizCreate,
  getAllQuizes
} = require('../../controllers/quizController');

jest.mock('../../models/Quiz', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
}));

jest.mock('../../models/Question', () => ({
  create: jest.fn()
}));

jest.mock('mongoose', () => ({
  startSession: jest.fn()
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn()
}));

describe('QuizController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      user: { 
        id: 'user123',
        isAdmin: false 
      },
      body: {},
      params: {},
      query: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('quizCreate', () => {
    beforeEach(() => {
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('abc123')
      });
    });

    it('should return 400 when no questions provided', async () => {
      req.body = {
        title: 'Test Quiz',
        questions: []
      };

      await quizCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Un quiz doit contenir au moins une question'
      });
      expect(Quiz.create).not.toHaveBeenCalled();
    });

    it('should create a quiz successfully with questions', async () => {
      req.body = {
        title: 'Test Quiz',
        description: 'Test Description',
        isPublic: true,
        questions: [
          { content: 'Question 1?', type: 'multiple', answer: 'A' }
        ]
      };

      const mockQuiz = {
        _id: 'quiz123',
        title: 'Test Quiz',
        createdBy: 'user123',
        joinCode: 'ABC123',
        questions: [],
        save: jest.fn().mockResolvedValue()
      };

      const mockQuestion = { 
        _id: 'question1', 
        content: 'Question 1?', 
        quizId: 'quiz123' 
      };

      Quiz.create.mockResolvedValue(mockQuiz);
      Question.create.mockResolvedValue(mockQuestion);

      await quizCreate(req, res, next);

      expect(Quiz.create).toHaveBeenCalledWith({
        title: 'Test Quiz',
        description: 'Test Description',
        isPublic: true,
        createdBy: 'user123',
        joinCode: 'ABC123'
      });

      expect(Question.create).toHaveBeenCalledWith({
        content: 'Question 1?',
        type: 'multiple',
        answer: 'A',
        quizId: 'quiz123'
      });

      expect(mockQuiz.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { quiz: mockQuiz }
      });
    });
  });

  describe('getAllQuizes', () => {
    it('should return quizes for non-admin users', async () => {
      req.user.isAdmin = false;
      req.user.id = 'user123';

      const mockQuizes = [
        { title: 'Quiz 1', isPublic: true },
        { title: 'Quiz 2', createdBy: 'user123' }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockQuizes)
      };
      Quiz.find.mockReturnValue(mockQuery);

      await getAllQuizes(req, res, next);

      expect(Quiz.find).toHaveBeenCalledWith({
        $or: [
          { createdBy: 'user123' },
          { isPublic: true }
        ]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        data: { quizes: mockQuizes }
      });
    });

    it('should return all quizes for admin users', async () => {
      req.user.isAdmin = true;

      const mockQuizes = [
        { title: 'Quiz 1', isPublic: true },
        { title: 'Quiz 2', isPublic: false }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockQuizes)
      };
      Quiz.find.mockReturnValue(mockQuery);

      await getAllQuizes(req, res, next);

      expect(Quiz.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        data: { quizes: mockQuizes }
      });
    });
  });
});