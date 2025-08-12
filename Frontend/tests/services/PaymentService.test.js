const PaymentService = require('../../src/services/PaymentService').default
const axios = require('axios')

jest.mock('axios')

// Mock window.location
delete window.location
window.location = { hostname: 'test.com' }

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.VITE_API_URL
    window.location.hostname = 'test.com'
  })

  it('should create checkout session successfully', async () => {
    const mockResponse = {
      data: {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        success: true
      }
    }

    axios.post.mockResolvedValue(mockResponse)

    const result = await PaymentService.createCheckoutSession()

    expect(result).toEqual(mockResponse.data)
    expect(axios.post).toHaveBeenCalledWith(
      'https://quizzfiesta.onrender.com/api/payment/create-checkout-session'
    )
    expect(axios.post).toHaveBeenCalledTimes(1)
  })

  it('should use environment variable for API URL', async () => {
    process.env.VITE_API_URL = 'https://custom-api.com'
    const mockResponse = {
      data: {
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/pay/cs_test_456'
      }
    }

    axios.post.mockResolvedValue(mockResponse)

    await PaymentService.createCheckoutSession()

    expect(axios.post).toHaveBeenCalledWith(
      'https://custom-api.com/api/payment/create-checkout-session'
    )
  })

  it('should use localhost URL in development', async () => {
    window.location.hostname = 'localhost'
    const mockResponse = {
      data: {
        id: 'cs_test_local',
        url: 'https://checkout.stripe.com/pay/cs_test_local'
      }
    }

    axios.post.mockResolvedValue(mockResponse)

    await PaymentService.createCheckoutSession()

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/payment/create-checkout-session'
    )
  })

  it('should handle API errors properly', async () => {
    const mockError = new Error('Network Error')
    mockError.response = {
      status: 500,
      data: { message: 'Internal Server Error' }
    }

    axios.post.mockRejectedValue(mockError)

    await expect(PaymentService.createCheckoutSession()).rejects.toThrow('Network Error')
    expect(axios.post).toHaveBeenCalledWith(
      'https://quizzfiesta.onrender.com/api/payment/create-checkout-session'
    )
  })

  it('should handle different error responses', async () => {
    const mockError = new Error('Bad Request')
    mockError.response = {
      status: 400,
      data: {
        message: 'Invalid payment parameters'
      }
    }

    axios.post.mockRejectedValue(mockError)

    await expect(PaymentService.createCheckoutSession()).rejects.toThrow('Bad Request')
  })

  it('should return response data directly', async () => {
    const mockData = {
      sessionId: 'cs_test_789',
      url: 'https://checkout.stripe.com/pay/cs_test_789',
      amount: 2000,
      currency: 'eur'
    }
    const mockResponse = { data: mockData }

    axios.post.mockResolvedValue(mockResponse)

    const result = await PaymentService.createCheckoutSession()

    expect(result).toEqual(mockData)
    expect(result.sessionId).toBe('cs_test_789')
    expect(result.amount).toBe(2000)
  })
})
