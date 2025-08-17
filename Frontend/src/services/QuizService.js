import axios from 'axios'

const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api'
  }

  return `${apiUrl}/api`
}

const QuizService = {
  // ======== LEGACY METHODS (pour compatibilité) ========
  async joinQuizByCode(joinCode) {
    const response = await axios.get(`${getApiBaseUrl()}/quiz/join/${joinCode}`)
    return response.data
  },

  async getQuizById(quizId) {
    const response = await axios.get(`${getApiBaseUrl()}/quiz/${quizId}`)
    return response.data
  },

  async getAllQuizzes(filters = {}) {
    const params = new URLSearchParams()

    if (filters.isPublic !== undefined) {
      params.append('isPublic', filters.isPublic)
    }
    if (filters.active !== undefined) {
      params.append('active', filters.active)
    }

    const response = await axios.get(`${getApiBaseUrl()}/quiz/?${params.toString()}`)
    return response.data
  },

  async getMyQuizes() {
    const response = await axios.get(`${getApiBaseUrl()}/quiz/myQuizes`)
    return response.data
  },

  async createQuiz(quizData) {
    if (quizData.logo && quizData.logo instanceof File) {
      const formData = new FormData()

      formData.append('logo', quizData.logo)
      formData.append('title', quizData.title)
      formData.append('description', quizData.description)
      formData.append('startDate', quizData.startDate)
      formData.append('questions', JSON.stringify(quizData.questions))

      const response = await axios.post(`${getApiBaseUrl()}/quiz/create`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      const response = await axios.post(`${getApiBaseUrl()}/quiz/create`, quizData)
      return response.data
    }
  },

  async updateQuiz(quizId, quizData) {
    if (quizData.logo && quizData.logo instanceof File) {
      const formData = new FormData()

      formData.append('logo', quizData.logo)
      formData.append('title', quizData.title)
      formData.append('description', quizData.description)
      formData.append('isPublic', quizData.isPublic)

      if (quizData.questions) {
        formData.append('questions', JSON.stringify(quizData.questions))
      }

      const response = await axios.put(`${getApiBaseUrl()}/quiz/update/${quizId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      const response = await axios.put(`${getApiBaseUrl()}/quiz/update/${quizId}`, quizData)
      return response.data
    }
  },

  async deleteQuiz(quizId) {
    const response = await axios.delete(`${getApiBaseUrl()}/quiz/${quizId}`)
    return response.data
  },

  async generateJoinCode(quizId) {
    const response = await axios.post(`${getApiBaseUrl()}/quiz/generateCode/${quizId}`)
    return response.data
  },

  async addQuestionsToQuiz(quizId, questions) {
    const response = await axios.put(`${getApiBaseUrl()}/quiz/addQuestions/${quizId}`, {
      questions,
    })
    return response.data
  },

  // Validation des codes de session
  validateSessionCode(code) {
    const hexPattern = /^[A-Fa-f0-9]{6}$/
    return hexPattern.test(code)
  },

  formatSessionCode(code) {
    return code.replace(/\s/g, '').toUpperCase()
  },

  // Vérifier si une session est active
  isSessionActive(session) {
    return session.status === 'playing' || session.status === 'lobby'
  },

  // Obtenir le statut d'une session
  getSessionStatus(session) {
    switch (session.status) {
      case 'lobby':
        return {
          status: 'waiting',
          message: 'En attente des participants',
          canJoin: true,
        }
      case 'playing':
        return {
          status: 'active',
          message: 'Session en cours',
          canJoin: session.settings?.allowLateJoin || false,
        }
      case 'finished':
        return {
          status: 'finished',
          message: 'Session terminée',
          canJoin: false,
        }
      case 'cancelled':
        return {
          status: 'cancelled',
          message: 'Session annulée',
          canJoin: false,
        }
      default:
        return {
          status: 'unknown',
          message: 'Statut inconnu',
          canJoin: false,
        }
    }
  },

  // Calculer le temps restant pour une question
  getQuestionTimeRemaining(gameState, settings) {
    if (!gameState.currentQuestionStartTime) return 0

    const startTime = new Date(gameState.currentQuestionStartTime)
    const elapsed = Date.now() - startTime.getTime()
    const timeLimit = (settings.timePerQuestion || 30) * 1000

    return Math.max(0, timeLimit - elapsed)
  },

  // ======== LEGACY UTILITIES ========

  validateJoinCode(code) {
    const hexPattern = /^[A-Fa-f0-9]{6}$/
    return hexPattern.test(code)
  },

  formatJoinCode(code) {
    return code.replace(/\s/g, '').toUpperCase()
  },

  isQuizActive(quiz) {
    const now = new Date()
    const startDate = new Date(quiz.startDate)
    const endDate = quiz.endDate ? new Date(quiz.endDate) : null

    return startDate <= now && (!endDate || endDate >= now)
  },

  getQuizTimeStatus(quiz) {
    const now = new Date()
    const startDate = new Date(quiz.startDate)
    const endDate = quiz.endDate ? new Date(quiz.endDate) : null

    if (startDate > now) {
      return {
        status: 'not_started',
        timeRemaining: startDate - now,
        message: 'The quiz has not started yet',
      }
    }

    if (endDate && endDate < now) {
      return {
        status: 'ended',
        timeRemaining: 0,
        message: 'The quiz is over',
      }
    }

    return {
      status: 'active',
      timeRemaining: endDate ? endDate - now : null,
      message: 'The quiz is in progress',
    }
  },
}

export default QuizService
