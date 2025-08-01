import axios from 'axios'

// Dynamic URL based on environment
const getApiBaseUrl = () => {
  // Utilise la variable d'environnement ou l'URL de production
  const apiUrl = import.meta.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'
  
  // Fallback pour le développement local
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api'
  }
  
  return `${apiUrl}/api`
}

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

class UserService {
  constructor() {
    this.baseURL = getApiBaseUrl()
  }

  async getMe() {
    try {
      const response = await axios.get(`${this.baseURL}/user/getMe`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async updateMe(userData) {
    try {
      // If there's an avatar (file), use FormData
      if (userData.avatar && userData.avatar instanceof File) {
        const formData = new FormData()

        // Add the avatar file
        formData.append('avatar', userData.avatar)

        // Add other user data
        if (userData.userName) formData.append('userName', userData.userName)
        if (userData.email) formData.append('email', userData.email)
        if (userData.currentPassword) formData.append('currentPassword', userData.currentPassword)
        if (userData.newPassword) formData.append('newPassword', userData.newPassword)

        const response = await axios.put(`${this.baseURL}/user/updateMe`, formData, {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data
      } else {
        // Otherwise, send as classic JSON
        const response = await axios.put(`${this.baseURL}/user/updateMe`, userData, {
          headers: getAuthHeaders()
        })
        return response.data
      }
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await axios.put(`${this.baseURL}/user/updateMe`, {
        currentPassword,
        newPassword
      }, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async updateAvatar(avatarFile) {
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response = await axios.put(`${this.baseURL}/user/updateMe`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async updateProfile(profileData) {
    try {
      // Only profile data (no password, no avatar)
      const filteredData = {
        userName: profileData.userName,
        email: profileData.email
      }

      const response = await axios.put(`${this.baseURL}/user/updateMe`, filteredData, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async getUserById(userId) {
    try {
      const response = await axios.get(`${this.baseURL}/user/${userId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

const userServiceInstance = new UserService()

export default userServiceInstance
