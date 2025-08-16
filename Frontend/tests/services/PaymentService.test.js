const axios = require('axios')
jest.mock('axios')

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'mock-access'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

const loadService = () => require('../../src/services/PaymentService').default

describe('PaymentService', () => {
  let PaymentService

  beforeEach(() => {
    jest.clearAllMocks()
    delete window.location
    window.location = { hostname: 'localhost' }
    process.env.VITE_API_URL = ''
    PaymentService = loadService()
  })

  describe('createCheckoutSession', () => {
    it('envoie la requête POST avec le token', async () => {
      const mockResp = { data: { url: 'https://checkout.stripe/test' } }
      axios.post.mockResolvedValue(mockResp)

      const result = await PaymentService.createCheckoutSession(500)

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/payment/create-checkout-session',
        { amount: 500 },
        { headers: { Authorization: 'Bearer mock-access' } },
      )
      expect(result).toEqual(mockResp.data)
    })

    it('utilise Authorization: Bearer null si pas de token', async () => {
      window.localStorage.getItem.mockReturnValueOnce(null)
      const mockResp = { data: { url: 'https://stripe/no-token' } }
      axios.post.mockResolvedValue(mockResp)

      const result = await PaymentService.createCheckoutSession(1000)

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/payment/create-checkout-session',
        { amount: 1000 },
        { headers: { Authorization: 'Bearer null' } },
      )
      expect(result).toEqual(mockResp.data)
    })

    it('propage les erreurs (ex: réseau)', async () => {
      const netErr = new Error('Network')
      axios.post.mockRejectedValue(netErr)

      await expect(PaymentService.createCheckoutSession(2000)).rejects.toThrow('Network')
    })
  })

  describe('getPredefinedAmounts', () => {
    it('GET vers endpoint des montants', async () => {
      const mockResp = { data: [{ amount: 100, label: '1€' }] }
      axios.get.mockResolvedValue(mockResp)

      const result = await PaymentService.getPredefinedAmounts()

      expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/payment/predefined-amounts')
      expect(result).toEqual(mockResp.data)
    })

    it('base URL production quand hostname != localhost', async () => {
      window.location.hostname = 'prod.example.com'
      process.env.VITE_API_URL = 'https://prod.api'
      const mockResp = { data: [{ amount: 500 }] }
      axios.get.mockResolvedValue(mockResp)
      const result = await PaymentService.getPredefinedAmounts()
      expect(axios.get).toHaveBeenCalledWith('https://prod.api/api/payment/predefined-amounts')
      expect(result).toEqual(mockResp.data)
    })

    it('propage erreur backend', async () => {
      const err = { response: { data: { error: 'Service indisponible' } } }
      axios.get.mockRejectedValue(err)
      await expect(PaymentService.getPredefinedAmounts()).rejects.toEqual(err)
    })
  })
})
