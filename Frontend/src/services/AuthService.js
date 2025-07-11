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

  async getMe() {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('No access token')

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await axios.get(`${getApiBaseUrl()}/user/getMe`)
      return response.data
    } catch (error) {
      this.clearTokens()
      throw error
    }
  }
}

export default AuthService
