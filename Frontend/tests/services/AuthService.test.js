const AuthService = require('../../src/services/AuthService').default
const axios = require('axios')

jest.mock('axios')

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear()
    axios.defaults.headers.common = {}
  })

  it('should set and get tokens', () => {
    AuthService.setTokens('access', 'refresh')
    expect(localStorage.getItem('accessToken')).toBe('access')
    expect(localStorage.getItem('refreshToken')).toBe('refresh')
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer access')
    expect(AuthService.getAccessToken()).toBe('access')
    expect(AuthService.getRefreshToken()).toBe('refresh')
  })

  it('should clear tokens', () => {
    AuthService.setTokens('access', 'refresh')
    AuthService.clearTokens()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined()
  })

  it('should identify authentication state', () => {
    expect(AuthService.isAuthenticated()).toBe(false)
    AuthService.setTokens('access', 'refresh')
    expect(AuthService.isAuthenticated()).toBe(true)
  })

  it('should detect expired token', () => {
    // Token JWT expiré
    const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 100 }
    const encodedPayload = btoa(JSON.stringify(expiredPayload))
    const expiredToken = `header.${encodedPayload}.signature`
    localStorage.setItem('accessToken', expiredToken)
    expect(AuthService.isTokenExpired()).toBe(true)
  })

  it('should detect valid token', () => {
    // Token JWT valide
    const validPayload = { exp: Math.floor(Date.now() / 1000) + 1000 }
    const encodedPayload = btoa(JSON.stringify(validPayload))
    const validToken = `header.${encodedPayload}.signature`
    localStorage.setItem('accessToken', validToken)
    expect(AuthService.isTokenExpired()).toBe(false)
  })

  it('should refresh access token', async () => {
    localStorage.setItem('refreshToken', 'refresh')
    axios.post.mockResolvedValue({
      data: {
        status: 'success',
        accessToken: 'newAccess',
        refreshToken: 'newRefresh'
      }
    })
    const token = await AuthService.refreshAccessToken()
    expect(token).toBe('newAccess')
    expect(localStorage.getItem('accessToken')).toBe('newAccess')
    expect(localStorage.getItem('refreshToken')).toBe('newRefresh')
  })

  it('should clear tokens on refresh failure', async () => {
    localStorage.setItem('refreshToken', 'refresh')
    axios.post.mockRejectedValue(new Error('fail'))
    await expect(AuthService.refreshAccessToken()).rejects.toThrow('fail')
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('should logout and clear tokens', async () => {
    AuthService.setTokens('access', 'refresh')
    axios.post.mockResolvedValue({})
    await AuthService.logout()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })
})
