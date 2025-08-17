import { boot } from 'quasar/wrappers'
import { setupErrorInterceptor } from 'src/plugins/errorHandler'
import axios from 'axios'

export default boot(() => {
  // Setup du gestionnaire d'erreurs global unique (gère tout : erreurs + refresh token + ajout du token)
  // setupErrorInterceptor()

  // Intercepteur de requête pour ajouter le token (temporaire sans error handler)
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
    (error) => Promise.reject(error)
  )

  // Initialiser le token au démarrage
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  }
})
