const quizController = require('../../controllers/quizController');
const Quiz = require('../../models/Quiz');
const LobbyParticipant = require('../../models/LobbyParticipant');

jest.mock('../../models/Quiz');
jest.mock('../../models/Question');
jest.mock('../../models/LobbyParticipant');

describe('Quiz Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123', isAdmin: false },
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllQuizes', () => {
    it('should return all quizzes', async () => {
      const mockQuizzes = [{ _id: 'q1', title: 'Quiz 1' }, { _id: 'q2', title: 'Quiz 2' }];
      Quiz.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockQuizzes)
      });

      await quizController.getAllQuizes(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        data: { quizes: mockQuizzes }
      });
    });
  });

  describe('getMyQuizes', () => {
    it('should return quizzes created by the user', async () => {
      const mockQuizzes = [{ _id: 'q1', title: 'Quiz 1', createdBy: 'user123' }];
      Quiz.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockQuizzes)
      });

      await quizController.getMyQuizes(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: 1,
        data: { quizes: mockQuizzes }
      });
    });
  });

  function createPopulateChain(finalValue) {
    const chain = {};
    chain.populate = jest.fn().mockReturnThis();
    chain.populate.mockReturnValueOnce(chain).mockReturnValueOnce(Promise.resolve(finalValue));
    return chain;
  }

  describe('getQuizById', () => {
    it('should return a quiz by id if public', async () => {
      req.params.id = 'quizid';
      const mockQuiz = {
        _id: 'quizid',
        createdBy: { _id: 'otheruser' },
        isPublic: true,
        questions: [],
      };
      Quiz.findById.mockReturnValue(createPopulateChain(mockQuiz));
      LobbyParticipant.findOne.mockResolvedValue(null);

      await quizController.getQuizById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { quiz: mockQuiz }
      });
    });

    it('should return 404 if quiz not found', async () => {
      req.params.id = 'notfound';
      Quiz.findById.mockReturnValue(createPopulateChain(null));

      await quizController.getQuizById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Quiz non trouvé'
      });
    });
  });
});
