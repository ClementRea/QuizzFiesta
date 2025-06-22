import { boot } from 'quasar/wrappers'
import AuthService from 'src/services/AuthService'
import axios from 'axios'

export default boot(({router }) => {
  // On vérifie le token au chargement de l'application
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