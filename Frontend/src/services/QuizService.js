import axios from 'axios'
import AuthService from './AuthService'

// URL dynamique selon l'environnement
const getApiBaseUrl = () => {
  const backendPort = window.location.hostname === 'localhost' ? ':3000' : ''
  const protocol = window.location.protocol
  const hostname = window.location.hostname

  return `${protocol}//${hostname}${backendPort}/api`
}

const API_URL = `${getApiBaseUrl()}/quiz`

class QuizService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
    })

    this.api.interceptors.request.use(
      (config) => {
        const token = AuthService.getAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            await AuthService.refreshAccessToken()
            const newToken = AuthService.getAccessToken()
            error.config.headers.Authorization = `Bearer ${newToken}`
            return this.api.request(error.config)
          } catch (refreshError) {
            AuthService.logout()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )
  }

  async joinQuizByCode(joinCode) {
    try {
      const response = await this.api.get(`/join/${joinCode}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getQuizById(quizId) {
    try {
      const response = await this.api.get(`/${quizId}`)
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

      const response = await this.api.get(`/?${params.toString()}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getMyQuizes() {
    try {
      const response = await this.api.get('/myQuizes')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async createQuiz(quizData) {
    try {
      // Si il y a un logo (fichier), utiliser FormData
      if (quizData.logo && quizData.logo instanceof File) {
        const formData = new FormData()

        // Ajouter le fichier logo
        formData.append('logo', quizData.logo)

        // Ajouter les autres données du quiz
        formData.append('title', quizData.title)
        formData.append('description', quizData.description)
        formData.append('startDate', quizData.startDate)
        formData.append('questions', JSON.stringify(quizData.questions))

        const response = await this.api.post('/create', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data
      } else {
        // Sinon, envoyer en JSON classique
        const response = await this.api.post('/create', quizData)
        return response.data
      }
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async updateQuiz(quizId, quizData) {
    try {
      const response = await this.api.post(`/update/${quizId}`, quizData)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async deleteQuiz(quizId) {
    try {
      const response = await this.api.delete(`/${quizId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async generateJoinCode(quizId) {
    try {
      const response = await this.api.post(`/generateCode/${quizId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async addQuestionsToQuiz(quizId, questions) {
    try {
      const response = await this.api.post(`/addQuestions/${quizId}`, { questions })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Méthodes pour la salle d'attente (lobby)
  async joinLobby(quizId) {
    try {
      const response = await this.api.post(`/${quizId}/lobby/join`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async leaveLobby(quizId) {
    try {
      const response = await this.api.post(`/${quizId}/lobby/leave`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getLobbyParticipants(quizId) {
    try {
      const response = await this.api.get(`/${quizId}/lobby/participants`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async setLobbyReady(quizId, isReady) {
    try {
      const response = await this.api.post(`/${quizId}/lobby/ready`, { isReady })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async startQuizFromLobby(quizId) {
    try {
      const response = await this.api.post(`/${quizId}/lobby/start`)
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
        message: 'Le quiz n\'a pas encore commencé'
      }
    }

    if (endDate && endDate < now) {
      return {
        status: 'ended',
        timeRemaining: 0,
        message: 'Le quiz est terminé'
      }
    }

    return {
      status: 'active',
      timeRemaining: endDate ? endDate - now : null,
      message: 'Le quiz est en cours'
    }
  }
}

const quizServiceInstance = new QuizService()

quizServiceInstance.validateJoinCode = QuizService.validateJoinCode
quizServiceInstance.formatJoinCode = QuizService.formatJoinCode
quizServiceInstance.isQuizActive = QuizService.isQuizActive
quizServiceInstance.getQuizTimeStatus = QuizService.getQuizTimeStatus

export default quizServiceInstance
