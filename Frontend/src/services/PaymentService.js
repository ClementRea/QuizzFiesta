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
  async createCheckoutSession(amount) {
    const apiUrl = `${getApiBaseUrl()}/payment/create-checkout-session`
    const token = localStorage.getItem('accessToken')
    const response = await axios.post(
      apiUrl,
      { amount },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    return response.data
  },

  async getPredefinedAmounts() {
    const apiUrl = `${getApiBaseUrl()}/payment/predefined-amounts`
    const response = await axios.get(apiUrl)
    return response.data
  },
}

export default PaymentService
