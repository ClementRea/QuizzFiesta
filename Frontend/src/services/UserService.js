import axios from 'axios'

const getApiBaseUrl = () => {
  const apiUrl = process.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api'
  }

  return `${apiUrl}/api`
}

const UserService = {
  async getMe() {
    const response = await axios.get(`${getApiBaseUrl()}/user/getMe`)
    return response.data
  },

  async updateMe(userData) {
    if (userData.avatar && userData.avatar instanceof File) {
      const formData = new FormData()

      formData.append('avatar', userData.avatar)

      if (userData.userName) formData.append('userName', userData.userName)
      if (userData.email) formData.append('email', userData.email)
      if (userData.currentPassword) formData.append('currentPassword', userData.currentPassword)
      if (userData.newPassword) formData.append('newPassword', userData.newPassword)

      const response = await axios.put(`${getApiBaseUrl()}/user/updateMe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      const response = await axios.put(`${getApiBaseUrl()}/user/updateMe`, userData)
      return response.data
    }
  },

  async updatePassword(currentPassword, newPassword) {
    const response = await axios.put(
      `${getApiBaseUrl()}/user/updateMe`,
      {
        currentPassword,
        newPassword,
      }
    )
    return response.data
  },

  async updateAvatar(avatarFile) {
    const formData = new FormData()
    formData.append('avatar', avatarFile)

    const response = await axios.put(`${getApiBaseUrl()}/user/updateMe`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async updateProfile(profileData) {
    const filteredData = {
      userName: profileData.userName,
      email: profileData.email,
    }

    const response = await axios.put(`${getApiBaseUrl()}/user/updateMe`, filteredData)
    return response.data
  },

  async getUserById(userId) {
    const response = await axios.get(`${getApiBaseUrl()}/user/${userId}`)
    return response.data
  },

  // Utility functions for tests
  validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  },

  validateUsername(username) {
    return !!(username && username.length >= 3 && !/\s/.test(username))
  },

  validatePassword(password) {
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
