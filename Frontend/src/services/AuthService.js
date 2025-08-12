import axios from 'axios'

const getApiBaseUrl = () => {
  const apiUrl = process.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api'
  }

  return `${apiUrl}/api`
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
    return localStorage.getItem('accessToken')
  },

  getRefreshToken() {
    return localStorage.getItem('refreshToken')
  },

  clearTokens() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    delete axios.defaults.headers.common['Authorization']
  },

  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await axios.post(`${getApiBaseUrl()}/auth/refresh-token`, {
        refreshToken,
      })

      if (response.data.status === 'success') {
        this.setTokens(response.data.accessToken, response.data.refreshToken)
        return response.data.accessToken
      } else {
        throw new Error('Failed to refresh token')
      }
    } catch (error) {
      this.clearTokens()
      throw error
    }
  },

  isTokenExpired() {
    const token = this.getAccessToken()
    if (!token) return true

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Date.now() / 1000

      return payload.exp <= now
    } catch {
      return true
    }
  },

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
  },
}

export default AuthService
