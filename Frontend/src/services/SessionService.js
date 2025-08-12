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
    try {
      const response = await axios.post(`${getApiBaseUrl()}/session/create/${quizId}`, { settings })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Rejoindre une session via son code
  async joinSessionByCode(sessionCode) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/session/join/${sessionCode}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Rejoindre le lobby d'une session
  async joinSessionLobby(sessionId) {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/session/${sessionId}/lobby/join`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Quitter le lobby d'une session
  async leaveSessionLobby(sessionId) {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/session/${sessionId}/lobby/leave`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Récupérer les participants d'une session
  async getSessionParticipants(sessionId) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/session/${sessionId}/lobby/participants`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Marquer un participant comme prêt/pas prêt
  async setSessionReady(sessionId, isReady) {
    try {
      const response = await axios.put(`${getApiBaseUrl()}/session/${sessionId}/lobby/ready`, {
        isReady,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Démarrer une session (organisateur)
  async startGameSession(sessionId) {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/session/${sessionId}/start`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Récupérer l'état d'une session
  async getSessionState(sessionId) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/session/${sessionId}/state`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Terminer une session
  async endGameSession(sessionId) {
    try {
      const response = await axios.delete(`${getApiBaseUrl()}/session/${sessionId}/end`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // ======== GAMEPLAY ========

  // Récupérer les questions d'une session
  async getSessionQuestions(sessionId) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/session/${sessionId}/questions`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Soumettre une réponse
  async submitSessionAnswer(sessionId, questionId, answer) {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/session/${sessionId}/answer`, {
        questionId,
        answer,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Passer à la question suivante (organisateur)
  async nextSessionQuestion(sessionId) {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/session/${sessionId}/next-question`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Récupérer le classement d'une session
  async getSessionLeaderboard(sessionId) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/session/${sessionId}/leaderboard`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Récupérer l'état d'un participant
  async getParticipantState(sessionId) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/session/${sessionId}/participant/state`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },
}

export default SessionService
