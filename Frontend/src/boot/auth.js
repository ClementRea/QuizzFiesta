import { boot } from 'quasar/wrappers'
import { setupErrorInterceptor } from 'src/plugins/errorHandler'
import axios from 'axios'

export default boot(() => {
  // Manager error
  setupErrorInterceptor()

  // initialize token when starting
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  }
})
