const express = require('express');
const gameSessionController = require('../controllers/gameSessionController');
const gameController = require('../controllers/gameController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour la gestion des sessions
router.post('/create/:quizId', gameSessionController.createGameSession);
router.get('/join/:sessionCode', gameSessionController.joinSessionByCode);
router.get('/:sessionId/state', gameSessionController.getSessionState);
router.delete('/:sessionId/end', gameSessionController.endGameSession);

// Routes pour le lobby
router.post('/:sessionId/lobby/join', gameSessionController.joinSessionLobby);
router.post('/:sessionId/lobby/leave', gameSessionController.leaveSessionLobby);
router.get('/:sessionId/lobby/participants', gameSessionController.getSessionParticipants);
router.put('/:sessionId/lobby/ready', gameSessionController.setParticipantReady);

// Route pour démarrer le jeu
router.post('/:sessionId/start', gameSessionController.startGameSession);

// Routes pour le gameplay
router.get('/:sessionId/questions', gameController.getSessionQuestions);
router.post('/:sessionId/answer', gameController.submitSessionAnswer);
router.post('/:sessionId/next-question', gameController.nextSessionQuestion);
router.get('/:sessionId/leaderboard', gameController.getSessionLeaderboard);
router.get('/:sessionId/participant/state', gameController.getParticipantState);

module.exports = router;