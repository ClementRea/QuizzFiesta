import axios from 'axios'

const getApiBaseUrl = () => {
  const backendPort = window.location.hostname === 'localhost' ? ':3000' : ''
  const protocol = window.location.protocol
  const hostname = window.location.hostname

  return `${protocol}//${hostname}${backendPort}/api`
}

const PaymentService = {

  async createCheckoutSession() {
    const apiUrl = `${getApiBaseUrl()}/payment/create-checkout-session`
    const response = await axios.post(apiUrl)
    return response.data
  }
}

export default PaymentService
