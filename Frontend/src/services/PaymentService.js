import axios from 'axios'

const getApiBaseUrl = () => {
  // Utilise la variable d'environnement ou l'URL de production
  const apiUrl = process.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'

  // Fallback pour le développement local
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api'
  }

  return `${apiUrl}/api`
}

const PaymentService = {
  async createCheckoutSession() {
    const apiUrl = `${getApiBaseUrl()}/payment/create-checkout-session`
    const response = await axios.post(apiUrl)
    return response.data
  },
}

export default PaymentService
