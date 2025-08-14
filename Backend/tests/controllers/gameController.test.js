const mongoose = require('mongoose');
const gameController = require('../../controllers/gameController');
const GameSession = require('../../models/GameSession');
const GameParticipant = require('../../models/GameParticipant');
const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');
const User = require('../../models/User');

async function createUser(overrides = {}) {
	return await User.create({
		email: `${Math.random().toString(16).slice(2)}@test.com`,
		userName: `user_${Math.random().toString(16).slice(2)}`,
		password: 'pass1234',
		...overrides
	});
}

async function createQuizWithQuestions({ creatorId, questionConfigs }) {
	const quiz = await Quiz.create({
		title: 'Quiz Test',
		description: 'Desc',
		createdBy: creatorId,
		startDate: new Date(Date.now() - 1000),
		endDate: new Date(Date.now() + 3600_000),
		questions: []
	});

	const questions = [];
	for (const qc of questionConfigs) {
		const q = await Question.create({
			quizId: quiz._id,
			content: qc.content || 'Question ?',
			type: qc.type,
			answer: qc.answer,
			points: qc.points || 100,
			timeGiven: qc.timeGiven || 30
		});
		questions.push(q._id);
	}
	quiz.questions = questions;
	await quiz.save();
	return { quiz, questions: await Question.find({ _id: { $in: questions } }) };
}

async function createPlayingSession({ quiz, organizer }) {
	const session = await GameSession.create({
		quizId: quiz._id,
		organizerId: organizer._id,
		sessionCode: GameSession.generateSessionCode(),
		status: 'playing',
		settings: { maxParticipants: 50, timePerQuestion: 30, showCorrectAnswers: true, allowLateJoin: false },
		gameState: {
			currentQuestionIndex: 0,
			currentQuestionStartTime: new Date(Date.now() - 500),
			totalQuestions: quiz.questions.length,
			questionTimeLimit: 30
		}
	});
	return session;
}

describe('gameController (integration)', () => {
	let res;
	let next;

	beforeEach(() => {
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
		next = jest.fn();
	});

	describe('getSessionQuestions', () => {
		it('404 si session inexistante', async () => {
			const user = await createUser();
			const req = { params: { sessionId: new mongoose.Types.ObjectId().toString() }, user: { id: user._id } };
			await gameController.getSessionQuestions(req, res, next);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it('403 si user pas participant', async () => {
			const organizer = await createUser();
			const nonParticipant = await createUser();
			const { quiz } = await createQuizWithQuestions({
				creatorId: organizer._id,
				questionConfigs: [
					{ type: 'CLASSIC', answer: [{ text: 'rep', isCorrect: true }] }
				]
			});
			const session = await createPlayingSession({ quiz, organizer });
			const req = { params: { sessionId: session._id.toString() }, user: { id: nonParticipant._id } };
			await gameController.getSessionQuestions(req, res, next);
			expect(res.status).toHaveBeenCalledWith(403);
		});

		it('200 retourne la question courante sans réponses correctes', async () => {
			const organizer = await createUser();
			const player = await createUser();
			const { quiz, questions } = await createQuizWithQuestions({
				creatorId: organizer._id,
				questionConfigs: [
					{ type: 'CLASSIC', content: 'Capital France ?', answer: [{ text: 'Paris', isCorrect: true }], points: 100 }
				]
			});
			const session = await createPlayingSession({ quiz, organizer });
			await GameParticipant.create({ sessionId: session._id, quizId: quiz._id, userId: player._id, userName: player.userName });
			const req = { params: { sessionId: session._id.toString() }, user: { id: player._id } };
			await gameController.getSessionQuestions(req, res, next);
			expect(res.status).not.toHaveBeenCalled(); 
			const payload = res.json.mock.calls[0][0];
			expect(payload.status).toBe('success');
			expect(payload.data.question.id.toString()).toBe(questions[0]._id.toString());
			expect(payload.data.question.answers[0]).not.toHaveProperty('isCorrect');
		});
	});

	describe('submitSessionAnswer', () => {
		it('404 session inexistante', async () => {
			const user = await createUser();
			const req = { params: { sessionId: new mongoose.Types.ObjectId().toString() }, body: {}, user: { id: user._id } };
			await gameController.submitSessionAnswer(req, res, next);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it('400 session pas en playing', async () => {
			const organizer = await createUser();
			const player = await createUser();
			const { quiz, questions } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'Paris', isCorrect: true }] } ] });
			const session = await GameSession.create({
				quizId: quiz._id,
				organizerId: organizer._id,
				sessionCode: GameSession.generateSessionCode(),
				status: 'lobby',
				settings: { maxParticipants: 50, timePerQuestion: 30, showCorrectAnswers: true, allowLateJoin: false },
				gameState: { currentQuestionIndex: 0, currentQuestionStartTime: new Date(), totalQuestions: quiz.questions.length, questionTimeLimit: 30 }
			});
			await GameParticipant.create({ sessionId: session._id, quizId: quiz._id, userId: player._id, userName: player.userName });
			const req = { params: { sessionId: session._id.toString() }, user: { id: player._id }, body: { questionId: questions[0]._id.toString(), answer: 'Paris' } };
			await gameController.submitSessionAnswer(req, res, next);
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('403 user non participant', async () => {
			const organizer = await createUser();
			const outsider = await createUser();
			const { quiz, questions } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'Paris', isCorrect: true }] } ] });
			const session = await createPlayingSession({ quiz, organizer });
			const req = { params: { sessionId: session._id.toString() }, user: { id: outsider._id }, body: { questionId: questions[0]._id.toString(), answer: 'Paris' } };
			await gameController.submitSessionAnswer(req, res, next);
			expect(res.status).toHaveBeenCalledWith(403);
		});

		it('404 question inexistante', async () => {
			const organizer = await createUser();
			const player = await createUser();
			const { quiz } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'Paris', isCorrect: true }] } ] });
			const session = await createPlayingSession({ quiz, organizer });
			await GameParticipant.create({ sessionId: session._id, quizId: quiz._id, userId: player._id, userName: player.userName });
			const fakeQ = new mongoose.Types.ObjectId();
			const req = { params: { sessionId: session._id.toString() }, user: { id: player._id }, body: { questionId: fakeQ.toString(), answer: 'Paris' } };
			await gameController.submitSessionAnswer(req, res, next);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it('400 déjà répondu', async () => {
			const organizer = await createUser();
			const player = await createUser();
			const { quiz, questions } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'Paris', isCorrect: true }] } ] });
			const session = await createPlayingSession({ quiz, organizer });
			const participant = await GameParticipant.create({ sessionId: session._id, quizId: quiz._id, userId: player._id, userName: player.userName });
			participant.answers.push({ questionId: questions[0]._id, questionIndex: 0, answer: 'Paris', submittedAt: new Date(), isCorrect: true, points: 50, timeSpent: 1000 });
			await participant.save();
			const req = { params: { sessionId: session._id.toString() }, user: { id: player._id }, body: { questionId: questions[0]._id.toString(), answer: 'Paris' } };
			await gameController.submitSessionAnswer(req, res, next);
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('200 enregistre une réponse correcte', async () => {
			const organizer = await createUser();
			const player = await createUser();
			const { quiz, questions } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'Paris', isCorrect: true }], points: 100 } ] });
			const session = await createPlayingSession({ quiz, organizer });
			await GameParticipant.create({ sessionId: session._id, quizId: quiz._id, userId: player._id, userName: player.userName });
			const req = { params: { sessionId: session._id.toString() }, user: { id: player._id }, body: { questionId: questions[0]._id.toString(), answer: 'Paris' } };
			await gameController.submitSessionAnswer(req, res, next);
			const payload = res.json.mock.calls[0][0];
			expect(payload.status).toBe('success');
			expect(payload.data.isCorrect).toBe(true);
			expect(payload.data.points).toBeGreaterThan(0);
		});
	});

	describe('nextSessionQuestion', () => {
		it('404 session inexistante', async () => {
			const user = await createUser();
			const req = { params: { sessionId: new mongoose.Types.ObjectId().toString() }, user: { id: user._id } };
			await gameController.nextSessionQuestion(req, res, next);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it('403 si pas organisateur', async () => {
			const organizer = await createUser();
			const other = await createUser();
			const { quiz } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'A', isCorrect: true }] } ] });
			const session = await createPlayingSession({ quiz, organizer });
			const req = { params: { sessionId: session._id.toString() }, user: { id: other._id } };
			await gameController.nextSessionQuestion(req, res, next);
			expect(res.status).toHaveBeenCalledWith(403);
		});

		it('400 si session pas en playing', async () => {
			const organizer = await createUser();
			const { quiz } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'A', isCorrect: true }] } ] });
			const session = await GameSession.create({
				quizId: quiz._id,
				organizerId: organizer._id,
				sessionCode: GameSession.generateSessionCode(),
				status: 'lobby',
				settings: { maxParticipants: 50, timePerQuestion: 30, showCorrectAnswers: true, allowLateJoin: false },
				gameState: { currentQuestionIndex: 0, currentQuestionStartTime: new Date(), totalQuestions: quiz.questions.length, questionTimeLimit: 30 }
			});
			const req = { params: { sessionId: session._id.toString() }, user: { id: organizer._id } };
			await gameController.nextSessionQuestion(req, res, next);
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('200 passage à la question suivante (ou fin)', async () => {
			const organizer = await createUser();
			const { quiz } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'A', isCorrect: true }] } ] });
			const session = await createPlayingSession({ quiz, organizer });
			const req = { params: { sessionId: session._id.toString() }, user: { id: organizer._id } };
			await gameController.nextSessionQuestion(req, res, next);
			const payload = res.json.mock.calls[0][0];
			expect(payload.status).toBe('success');
		});
	});

	describe('getSessionLeaderboard', () => {
		it('404 session inexistante', async () => {
			const req = { params: { sessionId: new mongoose.Types.ObjectId().toString() } };
			await gameController.getSessionLeaderboard(req, res, next);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it('200 retourne classement', async () => {
			const organizer = await createUser();
			const player1 = await createUser();
			const player2 = await createUser();
			const { quiz } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'A', isCorrect: true }] } ] });
			const session = await createPlayingSession({ quiz, organizer });
			await GameParticipant.create({ sessionId: session._id, quizId: quiz._id, userId: player1._id, userName: player1.userName, totalScore: 50 });
			await GameParticipant.create({ sessionId: session._id, quizId: quiz._id, userId: player2._id, userName: player2.userName, totalScore: 100 });
			const req = { params: { sessionId: session._id.toString() } };
			await gameController.getSessionLeaderboard(req, res, next);
			const payload = res.json.mock.calls[0][0];
			expect(payload.status).toBe('success');
			expect(payload.data.leaderboard[0].totalScore).toBeGreaterThanOrEqual(payload.data.leaderboard[1].totalScore);
		});
	});

	describe('getParticipantState', () => {
		it('404 si pas participant', async () => {
			const organizer = await createUser();
			const outsider = await createUser();
			const { quiz } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'A', isCorrect: true }] } ] });
			const session = await createPlayingSession({ quiz, organizer });
			const req = { params: { sessionId: session._id.toString() }, user: { id: outsider._id } };
			await gameController.getParticipantState(req, res, next);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it('200 retourne état du participant', async () => {
			const organizer = await createUser();
			const player = await createUser();
			const { quiz } = await createQuizWithQuestions({ creatorId: organizer._id, questionConfigs: [ { type: 'CLASSIC', answer: [{ text: 'A', isCorrect: true }] } ] });
			const session = await createPlayingSession({ quiz, organizer });
			await GameParticipant.create({ sessionId: session._id, quizId: quiz._id, userId: player._id, userName: player.userName, totalScore: 10 });
			const req = { params: { sessionId: session._id.toString() }, user: { id: player._id } };
			await gameController.getParticipantState(req, res, next);
			const payload = res.json.mock.calls[0][0];
			expect(payload.status).toBe('success');
			expect(payload.data.participant.totalScore).toBe(10);
		});
	});
});
