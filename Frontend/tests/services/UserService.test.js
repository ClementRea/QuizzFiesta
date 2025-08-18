const UserService = require('../../src/services/UserService').default
const axios = require('axios')

jest.mock('axios')

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'mock-token'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.getItem.mockReturnValue('mock-token')
  })

  describe('User utility functions', () => {
    describe('User data validation', () => {
      it('should validate correct email formats', () => {
        expect(UserService.validateEmail('user@example.com')).toBe(true)
        expect(UserService.validateEmail('test.email@domain.co.uk')).toBe(true)
        expect(UserService.validateEmail('user123@test-domain.com')).toBe(true)
      })

      it('should reject invalid email formats', () => {
        expect(UserService.validateEmail('invalid-email')).toBe(false)
        expect(UserService.validateEmail('user@')).toBe(false)
        expect(UserService.validateEmail('@domain.com')).toBe(false)
        expect(UserService.validateEmail('')).toBe(false)
      })

      it('should validate correct usernames', () => {
        expect(UserService.validateUsername('user123')).toBe(true)
        expect(UserService.validateUsername('testuser')).toBe(true)
        expect(UserService.validateUsername('user_name')).toBe(true)
      })

      it('should reject invalid usernames', () => {
        expect(UserService.validateUsername('us')).toBe(false)
        expect(UserService.validateUsername('user name')).toBe(false)
        expect(UserService.validateUsername('')).toBe(false)
        expect(UserService.validateUsername(null)).toBe(false)
      })

      it('should validate correct passwords', () => {
        expect(UserService.validatePassword('password123')).toBe(true)
        expect(UserService.validatePassword('123456')).toBe(true)
        expect(UserService.validatePassword('motdepasse')).toBe(true)
      })

      it('should reject invalid passwords', () => {
        expect(UserService.validatePassword('12345')).toBe(false)
        expect(UserService.validatePassword('')).toBe(false)
        expect(UserService.validatePassword(null)).toBe(false)
      })
    })

    describe('File validation for avatar', () => {
      it('should validate correct image file types', () => {
        const jpegFile = { type: 'image/jpeg', size: 1000000 }
        const pngFile = { type: 'image/png', size: 1000000 }
        const gifFile = { type: 'image/gif', size: 1000000 }

        expect(UserService.isValidImageFile(jpegFile)).toBe(true)
        expect(UserService.isValidImageFile(pngFile)).toBe(true)
        expect(UserService.isValidImageFile(gifFile)).toBe(true)
      })

      it('should reject invalid file types', () => {
        const txtFile = { type: 'text/plain', size: 1000000 }
        const pdfFile = { type: 'application/pdf', size: 1000000 }

        expect(UserService.isValidImageFile(txtFile)).toBe(false)
        expect(UserService.isValidImageFile(pdfFile)).toBe(false)
        expect(UserService.isValidImageFile(null)).toBe(false)
      })

      it('should validate file sizes', () => {
        const smallFile = { size: 1024 * 1024 }
        const largeFile = { size: 10 * 1024 * 1024 }

        expect(UserService.isValidFileSize(smallFile, 5)).toBe(true)
        expect(UserService.isValidFileSize(largeFile, 5)).toBe(false)
        expect(UserService.isValidFileSize(null)).toBe(false)
      })
    })

    describe('Form data utilities', () => {
      it('should filter allowed user fields only', () => {
        const userData = {
          userName: 'testuser',
          email: 'test@example.com',
          password: 'secret',
          role: 'admin',
          id: '123',
          currentPassword: 'oldpass',
          newPassword: 'newpass',
        }

        const filtered = UserService.filterUserFields(userData)

        expect(filtered).toEqual({
          userName: 'testuser',
          email: 'test@example.com',
          currentPassword: 'oldpass',
          newPassword: 'newpass',
        })
        expect(filtered.password).toBeUndefined()
        expect(filtered.role).toBeUndefined()
        expect(filtered.id).toBeUndefined()
      })

      it('should handle empty or null values', () => {
        const userData = {
          userName: '',
          email: 'test@example.com',
          currentPassword: null,
          newPassword: 'newpass',
        }

        const filtered = UserService.filterUserFields(userData)

        expect(filtered).toEqual({
          email: 'test@example.com',
          newPassword: 'newpass',
        })
      })
    })
  })

  describe('API methods', () => {
    it('should get current user', async () => {
      const mockResponse = { data: { id: 1, userName: 'testuser', email: 'test@example.com' } }
      axios.get.mockResolvedValue(mockResponse)

      const result = await UserService.getMe()
      expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/user/getMe')
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle get current user error', async () => {
      const mockError = { response: { data: { error: 'Unauthorized' } } }
      axios.get.mockRejectedValue(mockError)
      await expect(UserService.getMe()).rejects.toMatchObject({
        response: { data: { error: 'Unauthorized' } },
      })
    })

    it('should update user without file', async () => {
      const mockResponse = {
        data: { id: 1, userName: 'updateduser', email: 'updated@example.com' },
      }
      axios.put.mockResolvedValue(mockResponse)

      const userData = {
        userName: 'updateduser',
        email: 'updated@example.com',
      }

      const result = await UserService.updateMe(userData)
      expect(axios.put).toHaveBeenCalledWith('http://localhost:3000/api/user/updateMe', userData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should update user with avatar file', async () => {
      const mockResponse = { data: { id: 1, userName: 'testuser', avatar: 'new-avatar.jpg' } }
      axios.put.mockResolvedValue(mockResponse)

      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const userData = {
        userName: 'testuser',
        email: 'test@example.com',
        avatar: mockFile,
      }

      const result = await UserService.updateMe(userData)
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/updateMe',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }),
        }),
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle update user error', async () => {
      const mockError = { response: { data: { error: 'Validation failed' } } }
      axios.put.mockRejectedValue(mockError)
      await expect(UserService.updateMe({})).rejects.toMatchObject({
        response: { data: { error: 'Validation failed' } },
      })
    })

    it('should update password', async () => {
      const mockResponse = { data: { success: true, message: 'Password updated' } }
      axios.put.mockResolvedValue(mockResponse)

      const result = await UserService.updatePassword('oldpass', 'newpass')
      expect(axios.put).toHaveBeenCalledWith('http://localhost:3000/api/user/updateMe', {
        currentPassword: 'oldpass',
        newPassword: 'newpass',
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle update password error', async () => {
      const mockError = { response: { data: { error: 'Current password incorrect' } } }
      axios.put.mockRejectedValue(mockError)
      await expect(UserService.updatePassword('wrongpass', 'newpass')).rejects.toMatchObject({
        response: { data: { error: 'Current password incorrect' } },
      })
    })

    it('should update avatar', async () => {
      const mockResponse = { data: { id: 1, avatar: 'new-avatar.jpg' } }
      axios.put.mockResolvedValue(mockResponse)

      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const result = await UserService.updateAvatar(mockFile)
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/updateMe',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }),
        }),
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should update profile only', async () => {
      const mockResponse = { data: { id: 1, userName: 'newuser', email: 'new@example.com' } }
      axios.put.mockResolvedValue(mockResponse)

      const profileData = {
        userName: 'newuser',
        email: 'new@example.com',
        password: 'ignored',
        role: 'ignored',
      }

      const result = await UserService.updateProfile(profileData)
      expect(axios.put).toHaveBeenCalledWith('http://localhost:3000/api/user/updateMe', {
        userName: 'newuser',
        email: 'new@example.com',
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should get user by id', async () => {
      const mockResponse = { data: { id: 2, userName: 'otheruser', email: 'other@example.com' } }
      axios.get.mockResolvedValue(mockResponse)

      const result = await UserService.getUserById(2)
      expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/user/2')
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle get user by id error', async () => {
      const mockError = { response: { data: { error: 'User not found' } } }
      axios.get.mockRejectedValue(mockError)
      await expect(UserService.getUserById(999)).rejects.toMatchObject({
        response: { data: { error: 'User not found' } },
      })
    })

    it('should handle no auth token', async () => {
      window.localStorage.getItem.mockReturnValue(null)

      const mockResponse = { data: { error: 'No token' } }
      axios.get.mockResolvedValue(mockResponse)

      await UserService.getMe()
      expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/user/getMe')
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      axios.get.mockRejectedValue(networkError)

      await expect(UserService.getMe()).rejects.toEqual(networkError)
    })

    it('should handle errors without response data', async () => {
      const errorWithoutResponse = new Error('Something went wrong')
      axios.put.mockRejectedValue(errorWithoutResponse)

      await expect(UserService.updateMe({})).rejects.toEqual(errorWithoutResponse)
    })
  })
})
