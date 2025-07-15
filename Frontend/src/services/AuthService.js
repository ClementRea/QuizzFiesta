import axios from 'axios'

// URL dynamique selon l'environnement
const getApiBaseUrl = () => {
  const backendPort = window.location.hostname === 'localhost' ? ':3000' : ''
  const protocol = window.location.protocol
  const hostname = window.location.hostname

  return `${protocol}//${hostname}${backendPort}/api`
}

const AuthService = {
  isAuthenticated() {
    return !!localStorage.getItem('accessToken')
  },

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  },

  getAccessToken() {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  clearTokens() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    delete axios.defaults.headers.common['Authorization']
  },

  // Nouvelle méthode pour renouveler automatiquement l'access token
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await axios.post(`${getApiBaseUrl()}/auth/refresh-token`, {
        refreshToken
      })

      if (response.data.status === 'success') {
        // Sauvegarder les nouveaux tokens
        this.setTokens(response.data.accessToken, response.data.refreshToken)
        return response.data.accessToken
      } else {
        throw new Error('Failed to refresh token')
      }
    } catch (error) {
      // Si le refresh échoue, nettoyer tous les tokens
      this.clearTokens()
      throw error
    }
  },

  // Vérifier si le token est expiré ou proche de l'expiration
  isTokenExpired() {
    const token = this.getAccessToken()
    if (!token) return true

    try {
      // Décoder le token JWT (partie payload)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Date.now() / 1000

      // Vérifier si le token expire dans les 2 prochaines minutes
      return payload.exp <= (now)
    } catch {
      return true
    }
  },

  // Méthode pour renouveler automatiquement si nécessaire
  async ensureValidToken() {
    if (this.isTokenExpired()) {
      try {
        await this.refreshAccessToken()
        return true
      } catch {
        return false
      }
    }
    return true
  },

  // On vérifie la validité du token
  async verifyToken() {
    const token = localStorage.getItem('accessToken')
    if (!token) return false

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await axios.get(`${getApiBaseUrl()}/user/getMe`)
      return response.data.status === 'success'
    } catch {
      this.clearTokens()
      return false
    }
  },

  async logout() {
    try {
      await axios.post(`${getApiBaseUrl()}/auth/logout`)
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      this.clearTokens()
    }
  }
}

export default AuthService
