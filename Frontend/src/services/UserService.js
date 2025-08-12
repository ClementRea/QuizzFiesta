import axios from 'axios'

// Dynamic URL based on environment
const getApiBaseUrl = () => {
  // Utilise la variable d'environnement ou l'URL de production
  const apiUrl = process.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'

  // Fallback pour le développement local
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api'
  }

  return `${apiUrl}/api`
}

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const UserService = {
  async getMe() {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/user/getMe`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

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

        const response = await axios.put(`${getApiBaseUrl()}/user/updateMe`, formData, {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      } else {
        // Otherwise, send as classic JSON
        const response = await axios.put(`${getApiBaseUrl()}/user/updateMe`, userData, {
          headers: getAuthHeaders(),
        })
        return response.data
      }
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await axios.put(
        `${getApiBaseUrl()}/user/updateMe`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async updateAvatar(avatarFile) {
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response = await axios.put(`${getApiBaseUrl()}/user/updateMe`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async updateProfile(profileData) {
    try {
      // Only profile data (no password, no avatar)
      const filteredData = {
        userName: profileData.userName,
        email: profileData.email,
      }

      const response = await axios.put(`${getApiBaseUrl()}/user/updateMe`, filteredData, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  async getUserById(userId) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/user/${userId}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Utility functions for tests
  validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  },

  validateUsername(username) {
    // Au moins 3 caractères, pas d'espaces
    return !!(username && username.length >= 3 && !/\s/.test(username))
  },

  validatePassword(password) {
    // Au moins 6 caractères
    return !!(password && password.length >= 6)
  },

  isValidImageFile(file) {
    if (!file) return false
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    return validTypes.includes(file.type)
  },

  isValidFileSize(file, maxSizeMB = 5) {
    if (!file) return false
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
  },

  filterUserFields(userData) {
    const allowedFields = ['userName', 'email', 'currentPassword', 'newPassword']
    const filtered = {}

    Object.keys(userData).forEach((key) => {
      if (allowedFields.includes(key) && userData[key]) {
        filtered[key] = userData[key]
      }
    })

    return filtered
  },
}

export default UserService
