import { boot } from 'quasar/wrappers'
import AuthService from 'src/services/AuthService'
import axios from 'axios'

export default boot(({ router }) => {
  AuthService.setupInterceptors()

  // Intercepteur
  axios.interceptors.request.use(
    (config) => {
      if (config.url?.includes('/auth/')) {
        return config
      }

      const token = AuthService.getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  }
})
