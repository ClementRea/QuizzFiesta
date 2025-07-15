import { boot } from 'quasar/wrappers'
import AuthService from 'src/services/AuthService'
import axios from 'axios'

export default boot(({ router }) => {
  // Configuration globale des intercepteurs Axios pour l'authentification

  // Intercepteur de requête - Ajouter le token et gérer l'expiration
  axios.interceptors.request.use(
    async (config) => {
      // Skip auth for authentication endpoints
      if (config.url?.includes('/auth/')) {
        return config
      }

      // Ensure valid token before making any request
      const isValid = await AuthService.ensureValidToken()
      if (!isValid) {
        // Redirect to login if token cannot be renewed
        router.push('/login')
        return Promise.reject(new Error('Authentication failed'))
      }

      const token = AuthService.getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Intercepteur de réponse - Gérer les erreurs 401
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        // Don't try to refresh on auth routes
        if (originalRequest.url?.includes('/auth/')) {
          return Promise.reject(error)
        }

        try {
          await AuthService.refreshAccessToken()
          const newToken = AuthService.getAccessToken()
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axios.request(originalRequest)
        } catch (refreshError) {
          console.log('Global token refresh failed, redirecting to login')
          AuthService.clearTokens()
          router.push('/login')
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    }
  )

  // Configuration initiale du token au démarrage
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  }
})
