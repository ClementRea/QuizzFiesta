import axios from 'axios'
import AuthService from './AuthService'

// Dynamic URL based on environment
const getApiBaseUrl = () => {
  const backendPort = window.location.hostname === 'localhost' ? ':3000' : ''
  const protocol = window.location.protocol
  const hostname = window.location.hostname

  return `${protocol}//${hostname}${backendPort}/api`
}

class QuizService {
  constructor() {
    this.api = axios.create({
      baseURL: getApiBaseUrl(),
    })
    // Note: Authentication is handled globally by AuthService
  }

  // ======== LEGACY METHODS (pour compatibilité) ========
  async joinQuizByCode(joinCode) {
    try {
      const response = await this.api.get(`/quiz/join/${joinCode}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // ======== MÉTHODES POUR LES SESSIONS ========

  // Créer une nouvelle session de jeu
  async createSession(quizId, settings = {}) {
    try {
      const response = await this.api.post(`/session/create/${quizId}`, { settings })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Alias pour compatibilité
  async createGameSession(quizId, settings = {}) {
    return this.createSession(quizId, settings)
  }

  // Rejoindre une session via son code
  async joinSessionByCode(sessionCode) {
    try {
      const response = await this.api.get(`/session/join/${sessionCode}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Rejoindre une session par ID
  async joinSession(sessionId) {
    try {
      const response = await this.api.post(`/session/${sessionId}/lobby/join`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getQuizById(quizId) {
    try {
      const response = await this.api.get(`/quiz/${quizId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getAllQuizzes(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.isPublic !== undefined) {
        params.append('isPublic', filters.isPublic)
      }
      if (filters.active !== undefined) {
        params.append('active', filters.active)
      }

      const response = await this.api.get(`/quiz/?${params.toString()}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getMyQuizes() {
    try {
      const response = await this.api.get('/quiz/myQuizes')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async createQuiz(quizData) {
    try {
      if (quizData.logo && quizData.logo instanceof File) {
        const formData = new FormData()

        formData.append('logo', quizData.logo)

        formData.append('title', quizData.title)
        formData.append('description', quizData.description)
        formData.append('startDate', quizData.startDate)
        formData.append('questions', JSON.stringify(quizData.questions))

        const response = await this.api.post('/quiz/create', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data
      } else {
        const response = await this.api.post('/quiz/create', quizData)
        return response.data
      }
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async updateQuiz(quizId, quizData) {
    try {
      const response = await this.api.put(`/quiz/update/${quizId}`, quizData)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async deleteQuiz(quizId) {
    try {
      const response = await this.api.delete(`/quiz/${quizId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async generateJoinCode(quizId) {
    try {
      const response = await this.api.post(`/quiz/generateCode/${quizId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async addQuestionsToQuiz(quizId, questions) {
    try {
      const response = await this.api.put(`/quiz/addQuestions/${quizId}`, { questions })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // ======== MÉTHODES POUR LES SESSIONS LOBBY ========

  // Rejoindre le lobby d'une session
  async joinSessionLobby(sessionId) {
    try {
      const response = await this.api.post(`/session/${sessionId}/lobby/join`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Quitter le lobby d'une session
  async leaveSessionLobby(sessionId) {
    try {
      const response = await this.api.post(`/session/${sessionId}/lobby/leave`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Récupérer les participants du lobby d'une session
  async getSessionParticipants(sessionId) {
    try {
      const response = await this.api.get(`/session/${sessionId}/lobby/participants`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Marquer comme prêt/pas prêt dans le lobby
  async setSessionReady(sessionId, isReady) {
    try {
      const response = await this.api.put(`/session/${sessionId}/lobby/ready`, { isReady })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Démarrer la session (organisateur seulement)
  async startGameSession(sessionId) {
    try {
      const response = await this.api.post(`/session/${sessionId}/start`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Récupérer l'état d'une session
  async getSessionState(sessionId) {
    try {
      const response = await this.api.get(`/session/${sessionId}/state`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Terminer une session (organisateur seulement)
  async endGameSession(sessionId) {
    try {
      const response = await this.api.delete(`/session/${sessionId}/end`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }


  // ======== MÉTHODES POUR LE GAMEPLAY DE SESSION ========

  // Récupérer les questions d'une session (question courante)
  async getSessionQuestions(sessionId) {
    try {
      const response = await this.api.get(`/session/${sessionId}/questions`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Soumettre une réponse dans une session
  async submitSessionAnswer(sessionId, questionId, answer) {
    try {
      const response = await this.api.post(`/session/${sessionId}/answer`, {
        questionId,
        answer
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Passer à la question suivante (organisateur)
  async nextSessionQuestion(sessionId) {
    try {
      const response = await this.api.post(`/session/${sessionId}/next-question`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Récupérer le classement d'une session
  async getSessionLeaderboard(sessionId) {
    try {
      const response = await this.api.get(`/session/${sessionId}/leaderboard`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Récupérer l'état d'un participant dans une session
  async getParticipantState(sessionId) {
    try {
      const response = await this.api.get(`/session/${sessionId}/participant/state`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }


  // ======== MÉTHODES UTILITAIRES ========

  // Validation des codes de session (même format que les codes de quiz)
  static validateSessionCode(code) {
    const hexPattern = /^[A-Fa-f0-9]{6}$/
    return hexPattern.test(code)
  }

  static formatSessionCode(code) {
    return code.replace(/\s/g, '').toUpperCase()
  }

  // Vérifier si une session est active
  static isSessionActive(session) {
    return session.status === 'playing' || session.status === 'lobby'
  }

  // Obtenir le statut d'une session
  static getSessionStatus(session) {
    switch (session.status) {
      case 'lobby':
        return {
          status: 'waiting',
          message: 'En attente des participants',
          canJoin: true
        }
      case 'playing':
        return {
          status: 'active',
          message: 'Session en cours',
          canJoin: session.settings?.allowLateJoin || false
        }
      case 'finished':
        return {
          status: 'finished',
          message: 'Session terminée',
          canJoin: false
        }
      case 'cancelled':
        return {
          status: 'cancelled',
          message: 'Session annulée',
          canJoin: false
        }
      default:
        return {
          status: 'unknown',
          message: 'Statut inconnu',
          canJoin: false
        }
    }
  }

  // Calculer le temps restant pour une question
  static getQuestionTimeRemaining(gameState, settings) {
    if (!gameState.currentQuestionStartTime) return 0

    const startTime = new Date(gameState.currentQuestionStartTime)
    const elapsed = Date.now() - startTime.getTime()
    const timeLimit = (settings.timePerQuestion || 30) * 1000

    return Math.max(0, timeLimit - elapsed)
  }

  // ======== LEGACY UTILITIES ========

  static validateJoinCode(code) {
    const hexPattern = /^[A-Fa-f0-9]{6}$/
    return hexPattern.test(code)
  }

  static formatJoinCode(code) {
    return code.replace(/\s/g, '').toUpperCase()
  }

  static isQuizActive(quiz) {
    const now = new Date()
    const startDate = new Date(quiz.startDate)
    const endDate = quiz.endDate ? new Date(quiz.endDate) : null

    return startDate <= now && (!endDate || endDate >= now)
  }

  static getQuizTimeStatus(quiz) {
    const now = new Date()
    const startDate = new Date(quiz.startDate)
    const endDate = quiz.endDate ? new Date(quiz.endDate) : null

    if (startDate > now) {
      return {
        status: 'not_started',
        timeRemaining: startDate - now,
        message: 'The quiz has not started yet'
      }
    }

    if (endDate && endDate < now) {
      return {
        status: 'ended',
        timeRemaining: 0,
        message: 'The quiz is over'
      }
    }

    return {
      status: 'active',
      timeRemaining: endDate ? endDate - now : null,
      message: 'The quiz is in progress'
    }
  }
}

const quizServiceInstance = new QuizService()

quizServiceInstance.validateJoinCode = QuizService.validateJoinCode
quizServiceInstance.formatJoinCode = QuizService.formatJoinCode
quizServiceInstance.isQuizActive = QuizService.isQuizActive
quizServiceInstance.getQuizTimeStatus = QuizService.getQuizTimeStatus

export default quizServiceInstance
