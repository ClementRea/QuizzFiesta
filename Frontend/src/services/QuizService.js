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

  async joinQuizByCode(joinCode) {
    try {
      const response = await this.api.get(`/quiz/join/${joinCode}`)
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
      // If there's a logo (file), use FormData
      if (quizData.logo && quizData.logo instanceof File) {
        const formData = new FormData()

        // Add the logo file
        formData.append('logo', quizData.logo)

        // Add other quiz data
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
        // Otherwise, send as classic JSON
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

  // Methods for waiting room (lobby)
  async joinLobby(quizId) {
    try {
      const response = await this.api.post(`/quiz/${quizId}/lobby/join`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async leaveLobby(quizId) {
    try {
      const response = await this.api.post(`/quiz/${quizId}/lobby/leave`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getLobbyParticipants(quizId) {
    try {
      const response = await this.api.get(`/quiz/${quizId}/lobby/participants`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async setLobbyReady(quizId, isReady) {
    try {
      const response = await this.api.put(`/quiz/${quizId}/lobby/ready`, { isReady })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async startQuizFromLobby(quizId) {
    try {
      const response = await this.api.post(`/quiz/${quizId}/lobby/start`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Methods for quiz gameplay
  async getQuizQuestions(quizId) {
    try {
      const response = await this.api.get(`/quiz/${quizId}/questions`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async submitAnswer(quizId, questionId, answer) {
    try {
      const response = await this.api.post(`/quiz/${quizId}/answer`, {
        questionId,
        answer
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getGameState(quizId) {
    try {
      const response = await this.api.get(`/quiz/${quizId}/game/state`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async nextQuestion(quizId) {
    try {
      const response = await this.api.post(`/quiz/${quizId}/game/next-question`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getGameEvents(quizId) {
    try {
      const response = await this.api.get(`/quiz/${quizId}/game/events`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

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
