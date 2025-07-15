describe('AuthService utility functions', () => {

  // Tests simples des fonctions utilitaires (style Backend)

  describe('validateJoinCode format (copied from AuthService logic)', () => {
    const validateJoinCode = (code) => {
      const hexPattern = /^[A-Fa-f0-9]{6}$/
      return hexPattern.test(code)
    }

    it('should validate correct hexadecimal codes', () => {
      expect(validateJoinCode('ABC123')).toBe(true)
      expect(validateJoinCode('def456')).toBe(true)
      expect(validateJoinCode('123ABC')).toBe(true)
    })

    it('should reject invalid codes', () => {
      expect(validateJoinCode('ABCG23')).toBe(false) // G pas hex
      expect(validateJoinCode('ABC12')).toBe(false)  // Trop court
      expect(validateJoinCode('')).toBe(false)       // Vide
    })
  })

  describe('isTokenExpired logic', () => {
    const isTokenExpired = (token) => {
      if (!token) return true

      try {
        // Décoder le token JWT (partie payload)
        const payload = JSON.parse(atob(token.split('.')[1]))
        const now = Date.now() / 1000

        // Vérifier si le token expire
        return payload.exp <= now
      } catch {
        return true
      }
    }

    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return true for null or undefined token', () => {
      expect(isTokenExpired(null)).toBe(true)
      expect(isTokenExpired(undefined)).toBe(true)
      expect(isTokenExpired('')).toBe(true)
    })

    it('should return true for malformed token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true)
      expect(isTokenExpired('header.invalid-payload.signature')).toBe(true)
    })

    it('should return true for expired token', () => {
      const now = new Date('2025-07-15T12:00:00Z')
      jest.setSystemTime(now)

      // Token expiré (exp correspond à 2025-07-15T10:00:00Z, soit 2h avant now)
      const expiredTime = Math.floor(new Date('2025-07-15T10:00:00Z').getTime() / 1000)
      const expiredPayload = { exp: expiredTime, userId: '123' }
      const encodedPayload = btoa(JSON.stringify(expiredPayload))
      const expiredToken = `header.${encodedPayload}.signature`

      expect(isTokenExpired(expiredToken)).toBe(true)
    })

    it('should return false for valid token', () => {
      const now = new Date('2025-07-15T12:00:00Z')
      jest.setSystemTime(now)

      // Token valide (exp correspond à 2025-07-15T15:00:00Z, soit 3h après now)
      const validTime = Math.floor(new Date('2025-07-15T15:00:00Z').getTime() / 1000)
      const validPayload = { exp: validTime, userId: '123' }
      const encodedPayload = btoa(JSON.stringify(validPayload))
      const validToken = `header.${encodedPayload}.signature`

      expect(isTokenExpired(validToken)).toBe(false)
    })
  })

  describe('localStorage simulation', () => {
    it('should correctly identify truthy values', () => {
      // Test de la logique !!value
      expect(!!'token').toBe(true)
      expect(!!'').toBe(false)
      expect(!!null).toBe(false)
      expect(!!undefined).toBe(false)
    })

    it('should handle string manipulation correctly', () => {
      // Test des manipulations de string communes dans AuthService
      const token = 'Bearer abc123def456'
      const cleaned = token.replace('Bearer ', '')
      expect(cleaned).toBe('abc123def456')
    })
  })
})
