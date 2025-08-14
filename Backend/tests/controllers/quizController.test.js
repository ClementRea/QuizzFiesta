const mongoose = require('mongoose');
const quizController = require('../../controllers/quizController');
const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');
const User = require('../../models/User');
const Organisation = require('../../models/Organisation');
const LobbyParticipant = require('../../models/LobbyParticipant');

async function createUser(overrides = {}) {
  return await User.create({
    email: `${Math.random().toString(16).slice(2)}@test.com`,
    userName: `u_${Math.random().toString(16).slice(2)}`,
    password: 'pass1234',
    ...overrides
  });
}

async function createQuiz({ creator, questions = [], isPublic = true }) {
  const quiz = await Quiz.create({
    title: 'Quiz titre',
    description: 'Desc',
    createdBy: creator._id,
    startDate: new Date(Date.now() - 1000),
    endDate: new Date(Date.now() + 3600_000),
    isPublic,
    questions: []
  });
  const qIds = [];
  for (const q of questions) {
    const nq = await Question.create({ quizId: quiz._id, content: q.content, type: q.type || 'CLASSIC', answer: q.answer || [{ text: 'A', isCorrect: true }], points: q.points || 10, timeGiven: q.timeGiven || 30 });
    qIds.push(nq._id);
  }
  if (qIds.length) {
    quiz.questions = qIds;
    await quiz.save();
  }
  return quiz;
}

describe('quizController (integration)', () => {
  let res, next;
  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  describe('quizCreate', () => {
    it('400 champs requis manquants', async () => {
      const user = await createUser();
      const req = { body: { title: '' }, user: { id: user._id }, file: null };
      await quizController.quizCreate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('201 création simple sans questions', async () => {
      const user = await createUser();
      const req = { body: { title: 'T', description: 'D', startDate: new Date().toISOString() }, user: { id: user._id.toString() }, file: null };
      await quizController.quizCreate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.quiz.title).toBe('T');
    });

    it('201 création avec questions', async () => {
      const user = await createUser();
      const req = { body: { title: 'T2', description: 'D', startDate: new Date().toISOString(), questions: JSON.stringify([{ content: 'Q1', type: 'CLASSIC', answer: [{ text: 'A', isCorrect: true }] }]) }, user: { id: user._id.toString() } };
      await quizController.quizCreate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.quiz.questions.length).toBe(1);
    });
  });

  describe('getAllQuizes', () => {
    it('retourne seulement publics pour user basique', async () => {
      const user = await createUser();
      await createQuiz({ creator: user, isPublic: true });
      await createQuiz({ creator: user, isPublic: false });
  const req = { query: {}, user: { id: user._id.toString(), role: 'user' } };
      await quizController.getAllQuizes(req, res, next);
      const payload = res.json.mock.calls[0][0];
      expect(payload.results).toBe(1);
    });
    it('gestionnaire voit publics + orga', async () => {
      const orgOwner = await createUser();
      const org = await Organisation.create({ name: 'Org', createdBy: orgOwner._id });
      const member = await createUser({ organization: org._id, role: 'gestionnaire' });
      const other = await createUser();
      await createQuiz({ creator: member, isPublic: false });
      await createQuiz({ creator: other, isPublic: true });
      await createQuiz({ creator: other, isPublic: false });
  const req = { query: {}, user: { id: member._id.toString(), role: 'gestionnaire', organization: org._id } };
      await quizController.getAllQuizes(req, res, next);
      const payload = res.json.mock.calls[0][0];
      expect(payload.results).toBe(2);
    });
  });

  describe('getMyQuizes', () => {
    it('retourne quizes créés par user', async () => {
      const user = await createUser();
      await createQuiz({ creator: user });
      await createQuiz({ creator: await createUser() });
  const req = { user: { id: user._id.toString() } };
      await quizController.getMyQuizes(req, res, next);
      const payload = res.json.mock.calls[0][0];
      expect(payload.results).toBe(1);
    });
  });

  describe('getQuizById', () => {
    it('404 si inexistant', async () => {
      const user = await createUser();
  const req = { params: { id: new mongoose.Types.ObjectId().toString() }, user: { id: user._id.toString(), role: 'user' } };
      await quizController.getQuizById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('403 si privé et pas autorisé', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator, isPublic: false });
      const other = await createUser();
  const req = { params: { id: quiz._id.toString() }, user: { id: other._id.toString(), role: 'user' } };
      await quizController.getQuizById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it('200 accès public', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator, isPublic: true });
  const req = { params: { id: quiz._id.toString() }, user: { id: new mongoose.Types.ObjectId().toString(), role: 'user' } };
      await quizController.getQuizById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('200 accès créateur', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator, isPublic: false });
  const req = { params: { id: quiz._id.toString() }, user: { id: creator._id.toString(), role: 'user' } };
      await quizController.getQuizById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('200 accès via lobby', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator, isPublic: false });
      const watcher = await createUser();
      await LobbyParticipant.create({ sessionId: new mongoose.Types.ObjectId(), quizId: quiz._id, userId: watcher._id, userName: watcher.userName });
  const req = { params: { id: quiz._id.toString() }, user: { id: watcher._id.toString(), role: 'user' } };
      await quizController.getQuizById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('quizUpdate', () => {
    it('404 inexistant', async () => {
      const user = await createUser();
  const req = { params: { id: new mongoose.Types.ObjectId().toString() }, user: { id: user._id.toString(), role: 'user' }, body: { title: 'X' } };
      await quizController.quizUpdate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('403 modification non autorisée', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator });
      const other = await createUser();
  const req = { params: { id: quiz._id.toString() }, user: { id: other._id.toString(), role: 'user' }, body: { title: 'New' } };
      await quizController.quizUpdate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it('200 update simple', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator });
  const req = { params: { id: quiz._id.toString() }, user: { id: creator._id.toString(), role: 'user' }, body: { title: 'Modif', description: 'D2' } };
      await quizController.quizUpdate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.quiz.title).toBe('Modif');
    });
    it('200 update avec remplacement questions', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator, questions: [{ content: 'Old' }] });
  const req = { params: { id: quiz._id.toString() }, user: { id: creator._id.toString(), role: 'user' }, body: { questions: JSON.stringify([{ content: 'N1', type: 'CLASSIC', answer: [{ text: 'B', isCorrect: true }] }]) } };
      await quizController.quizUpdate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.quiz.questions.length).toBe(1);
    });
  });

  describe('deleteQuiz', () => {
    it('404 inexistant', async () => {
      const user = await createUser();
  const req = { params: { id: new mongoose.Types.ObjectId().toString() }, user: { id: user._id.toString(), role: 'user' } };
      await quizController.deleteQuiz(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('403 suppression non autorisée', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator });
      const other = await createUser();
  const req = { params: { id: quiz._id.toString() }, user: { id: other._id.toString(), role: 'user' } };
      await quizController.deleteQuiz(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it('204 suppression créateur', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator });
  const req = { params: { id: quiz._id.toString() }, user: { id: creator._id.toString(), role: 'user' } };
      await quizController.deleteQuiz(req, res, next);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe('getQuizByJoinCode', () => {
    it('404 code inexistant', async () => {
      const req = { params: { joinCode: 'ABCDE' } };
      await quizController.getQuizByJoinCode(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('200 quiz trouvé', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator });
      quiz.joinCode = 'JOIN12';
      await quiz.save();
      const req = { params: { joinCode: 'join12' } };
      await quizController.getQuizByJoinCode(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addQuestionsToQuiz', () => {
    it('404 quiz inexistant', async () => {
      const user = await createUser();
  const req = { params: { id: new mongoose.Types.ObjectId().toString() }, user: { id: user._id.toString(), role: 'user' }, body: { questions: [{ content: 'X', answer: [{ text: 'A', isCorrect: true }] }] } };
      await quizController.addQuestionsToQuiz(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('403 ajout non autorisé', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator });
      const other = await createUser();
  const req = { params: { id: quiz._id.toString() }, user: { id: other._id.toString(), role: 'user' }, body: { questions: [{ content: 'N', answer: [{ text: 'A', isCorrect: true }] }] } };
      await quizController.addQuestionsToQuiz(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it('400 pas de questions', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator });
  const req = { params: { id: quiz._id.toString() }, user: { id: creator._id.toString(), role: 'user' }, body: { questions: [] } };
      await quizController.addQuestionsToQuiz(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it('200 ajout questions', async () => {
      const creator = await createUser();
      const quiz = await createQuiz({ creator });
  const req = { params: { id: quiz._id.toString() }, user: { id: creator._id.toString(), role: 'user' }, body: { questions: [{ content: 'Add1', type: 'CLASSIC', answer: [{ text: 'A', isCorrect: true }] }] } };
      await quizController.addQuestionsToQuiz(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.quiz.questions.length).toBe(1);
    });
  });
});
