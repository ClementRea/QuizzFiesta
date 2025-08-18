import { Notify } from 'quasar'
import axios from 'axios'

// Variables pour la gestion du refresh token
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const errorMessages = {
  // Erreurs d'authentification
  'Invalid email or password': 'Email ou mot de passe incorrect.',
  'Email already registered': 'Cette adresse email est déjà utilisée.',
  'User not found': 'Utilisateur non trouvé.',
  'Token family revoked or expired': 'Session expirée, veuillez vous reconnecter.',
  'Invalid or expired refresh token': 'Session expirée, veuillez vous reconnecter.',

  // Erreurs de validation communes
  'Email valide requis': 'Veuillez entrer une adresse email valide.',
  'Mot de passe requis': 'Le mot de passe est requis.',
  'Token de rafraîchissement requis': 'Session expirée, veuillez vous reconnecter.',

  // Erreurs réseau
  'Network Error': 'Erreur de connexion au serveur.',
  'Request failed with status code 500': 'Erreur interne du serveur.',
  'Request failed with status code 404': 'Ressource non trouvée.',
  'Request failed with status code 403': 'Accès refusé.',
  'Request failed with status code 401': 'Non autorisé, veuillez vous reconnecter.',
}

// extract error msg
const extractErrorMessage = (error) => {
  if (!error.response) {
    return errorMessages['Network Error'] || 'Erreur de connexion.'
  }

  const { status, data } = error.response

  if (data?.message) {
    const translatedMessage = errorMessages[data.message]
    if (translatedMessage) {
      return translatedMessage
    }
    return data.message
  }

  const statusMessages = {
    400: 'Données invalides.',
    401: 'Non autorisé, veuillez vous reconnecter.',
    403: 'Accès refusé.',
    404: 'Ressource non trouvée.',
    409: 'Conflit de données.',
    422: 'Données non conformes.',
    500: 'Erreur interne du serveur.',
    502: 'Service temporairement indisponible.',
    503: 'Service indisponible.',
  }

  return statusMessages[status] || "Une erreur inattendue s'est produite."
}

// Fonctions utilitaires pour les tokens
const getApiBaseUrl = () => {
  const apiUrl = process.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api'
  }
  return `${apiUrl}/api`
}

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await axios.post(`${getApiBaseUrl()}/auth/refresh-token`, {
    refreshToken,
  })

  if (response.data.status === 'success') {
    localStorage.setItem('accessToken', response.data.accessToken)
    localStorage.setItem('refreshToken', response.data.refreshToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`
    return response.data.accessToken
  } else {
    throw new Error('Failed to refresh token')
  }
}

const clearTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  delete axios.defaults.headers.common['Authorization']
}

const setupErrorInterceptor = () => {
  axios.interceptors.request.use(
    (config) => {
      if (config.url?.includes('/auth/')) {
        return config
      }

      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  axios.interceptors.response.use(
    (response) => response,

    async (error) => {
      const originalRequest = error.config

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/')
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return axios(originalRequest)
            })
            .catch((err) => {
              return Promise.reject(err)
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const newToken = await refreshAccessToken()
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axios(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          clearTokens()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      const errorMessage = extractErrorMessage(error)

      const isAuthEndpoint = originalRequest.url?.includes('/auth/')

      if (!isAuthEndpoint) {
        Notify.create({
          color: 'negative',
          message: errorMessage,
          position: 'top',
          timeout: 5000,
          actions: [
            {
              icon: 'close',
              color: 'white',
              round: true,
              handler: () => {},
            },
          ],
        })
      }

      return Promise.reject(error)
    },
  )
}

// user notify for errors
const showError = (message) => {
  Notify.create({
    color: 'negative',
    message,
    position: 'top',
    timeout: 5000,
    actions: [
      {
        icon: 'close',
        color: 'white',
        round: true,
        handler: () => {},
      },
    ],
  })
}

export { setupErrorInterceptor, extractErrorMessage, showError }
