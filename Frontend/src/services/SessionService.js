import axios from 'axios'

// Dynamic URL based on environment
const getApiBaseUrl = () => {
  // Utilise la variable d'environnement ou l'URL de production
  const apiUrl = process.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'

  // Fallback pour le développement local
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api'
  }

  return `${apiUrl}/api`
}

/**
 * Service pour la gestion des sessions de jeu
 * Séparé de QuizService pour une meilleure organisation
 */
const SessionService = {
  // ======== GESTION DES SESSIONS ========

  // Créer une nouvelle session de jeu
  async createSession(quizId, settings = {}) {
    const response = await axios.post(`${getApiBaseUrl()}/session/create/${quizId}`, { settings })
    return response.data
  },

  // Rejoindre une session via son code
  async joinSessionByCode(sessionCode) {
    const response = await axios.get(`${getApiBaseUrl()}/session/join/${sessionCode}`)
    return response.data
  },

  // Rejoindre le lobby d'une session
  async joinSessionLobby(sessionId) {
    const response = await axios.post(`${getApiBaseUrl()}/session/${sessionId}/lobby/join`)
    return response.data
  },

  // Quitter le lobby d'une session
  async leaveSessionLobby(sessionId) {
    const response = await axios.post(`${getApiBaseUrl()}/session/${sessionId}/lobby/leave`)
    return response.data
  },

  // Récupérer les participants d'une session
  async getSessionParticipants(sessionId) {
    const response = await axios.get(`${getApiBaseUrl()}/session/${sessionId}/lobby/participants`)
    return response.data
  },

  // Marquer un participant comme prêt/pas prêt
  async setSessionReady(sessionId, isReady) {
    const response = await axios.put(`${getApiBaseUrl()}/session/${sessionId}/lobby/ready`, {
      isReady,
    })
    return response.data
  },

  // Démarrer une session (organisateur)
  async startGameSession(sessionId) {
    const response = await axios.post(`${getApiBaseUrl()}/session/${sessionId}/start`)
    return response.data
  },

  // Récupérer l'état d'une session
  async getSessionState(sessionId) {
    const response = await axios.get(`${getApiBaseUrl()}/session/${sessionId}/state`)
    return response.data
  },

  // Terminer une session
  async endGameSession(sessionId) {
    const response = await axios.delete(`${getApiBaseUrl()}/session/${sessionId}/end`)
    return response.data
  },

  // ======== GAMEPLAY ========

  // Récupérer les questions d'une session
  async getSessionQuestions(sessionId) {
    const response = await axios.get(`${getApiBaseUrl()}/session/${sessionId}/questions`)
    return response.data
  },

  // Soumettre une réponse
  async submitSessionAnswer(sessionId, questionId, answer) {
    const response = await axios.post(`${getApiBaseUrl()}/session/${sessionId}/answer`, {
      questionId,
      answer,
    })
    return response.data
  },

  // Passer à la question suivante (organisateur)
  async nextSessionQuestion(sessionId) {
    const response = await axios.post(`${getApiBaseUrl()}/session/${sessionId}/next-question`)
    return response.data
  },

  // Récupérer le classement d'une session
  async getSessionLeaderboard(sessionId) {
    const response = await axios.get(`${getApiBaseUrl()}/session/${sessionId}/leaderboard`)
    return response.data
  },

  // Récupérer l'état d'un participant
  async getParticipantState(sessionId) {
    const response = await axios.get(`${getApiBaseUrl()}/session/${sessionId}/participant/state`)
    return response.data
  },
}

export default SessionService
