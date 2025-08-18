import { boot } from 'quasar/wrappers'
import { setupErrorInterceptor } from 'src/plugins/errorHandler'
import axios from 'axios'

export default boot(() => {
  // Setup du gestionnaire d'erreurs global unique (gère tout : erreurs + refresh token + ajout du token)
  setupErrorInterceptor()

  // Initialiser le token au démarrage
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  }
})
