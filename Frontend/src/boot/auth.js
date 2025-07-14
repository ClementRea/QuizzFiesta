import { boot } from 'quasar/wrappers'
import AuthService from 'src/services/AuthService'
import axios from 'axios'

export default boot(({ router }) => {
  // Configuration d'un intercepteur global pour Axios
  axios.interceptors.request.use(
    async (config) => {
      // Vérifier et renouveler le token automatiquement pour toutes les requêtes
      const isValid = await AuthService.ensureValidToken()
      if (!isValid && config.url && !config.url.includes('/auth/')) {
        // Rediriger vers login si le token ne peut pas être renouvelé
        // (sauf pour les requêtes d'authentification)
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

  // Intercepteur global pour les réponses 401
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        // Ne pas essayer de refresh sur les routes d'auth
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

  // Vérification initiale du token au chargement de l'application
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    // Configuration de Axios avec le token existant
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

    // Vérification de la validité du token en arrière-plan
    AuthService.verifyToken().catch(() => {
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push('/login')
      }
    })
  }
})
