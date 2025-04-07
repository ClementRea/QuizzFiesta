import axios from 'axios'

const AuthService = {
  // On vérifie si l'utilisateur est authentifié
  isAuthenticated() {
    return !!localStorage.getItem('authToken')
  },

  // On configure le token d'authentification
  setToken(token) {
    localStorage.setItem('authToken', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  },

  //On récupère le token d'authentification
  getToken() {
    return localStorage.getItem('authToken');
  },

  // On supprime le token d'authentification
  clearToken() {
    localStorage.removeItem('authToken')
    delete axios.defaults.headers.common['Authorization']
  },

  // On vérifie la validité du token
  async verifyToken() {
    const token = localStorage.getItem('authToken')
    if (!token) return false

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await axios.get('http://localhost:3000/api/user/getMe')
      return response.data.status === 'success'
    } catch {
      this.clearToken()
      return false
    }
  }
}

export default AuthService