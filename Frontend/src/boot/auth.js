import { boot } from 'quasar/wrappers'
import AuthService from 'src/services/AuthService'

export default boot(({router }) => {
  // On vérifie le token au chargement de l'application
  const token = localStorage.getItem('authToken')
  if (token) {
    // Configuration de Axios avec le token existant
    AuthService.setToken(token)
    
    // Vérification de la validité du token en arrière-plan
    AuthService.verifyToken().catch(() => {
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push('/login')
      }
    })
  }
})