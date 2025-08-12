import { boot } from 'quasar/wrappers'
import AuthService from 'src/services/AuthService'
import axios from 'axios'

export default boot(({ router }) => {
  axios.interceptors.request.use(
    async (config) => {
      // Skip auth for authentication endpoints
      if (config.url?.includes('/auth/')) {
        return config
      }

      const isValid = await AuthService.ensureValidToken()
      if (!isValid) {
        router.push('/login')
        return Promise.reject(new Error('Authentication failed'))
      }

      const token = AuthService.getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        if (originalRequest.url?.includes('/auth/')) {
          return Promise.reject(error)
        }

        try {
          await AuthService.refreshAccessToken()
          const newToken = AuthService.getAccessToken()
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axios.request(originalRequest)
        } catch (refreshError) {
          AuthService.clearTokens()
          router.push('/login')
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    },
  )

  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  }
})
