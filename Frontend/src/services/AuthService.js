import axios from 'axios'

const AuthService = {
  // On vérifie si l'utilisateur est authentifié
  isAuthenticated() {
    return !!localStorage.getItem('accessToken')
  },

  // On configure les tokens d'authentification  
  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  },

  //On récupère l'access token
  getAccessToken() {
    return localStorage.getItem('accessToken');
  },

  //On récupère le refresh token
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  // On supprime les tokens
  clearTokens() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    delete axios.defaults.headers.common['Authorization']
  },

  // On vérifie la validité du token
  async verifyToken() {
    const token = localStorage.getItem('accessToken')
    if (!token) return false

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await axios.get('http://localhost:3000/api/user/getMe')
      return response.data.status === 'success'
    } catch {
      this.clearTokens()
      return false
    }
  }
}

export default AuthService