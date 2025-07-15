describe('QuizService utility functions', () => {

  const validateJoinCode = (code) => {
    const hexPattern = /^[A-Fa-f0-9]{6}$/
    return hexPattern.test(code)
  }

  const formatJoinCode = (code) => {
    return code.replace(/\s/g, '').toUpperCase()
  }

  const isQuizActive = (quiz) => {
    const now = new Date()
    const startDate = new Date(quiz.startDate)
    const endDate = quiz.endDate ? new Date(quiz.endDate) : null

    return startDate <= now && (!endDate || endDate >= now)
  }

  describe('validateJoinCode', () => {
    it('should validate correct hexadecimal codes', () => {
      expect(validateJoinCode('ABC123')).toBe(true)
      expect(validateJoinCode('def456')).toBe(true)
      expect(validateJoinCode('123ABC')).toBe(true)
    })

    it('should reject invalid join codes', () => {
      expect(validateJoinCode('ABCG23')).toBe(false)
      expect(validateJoinCode('ABC12')).toBe(false)
      expect(validateJoinCode('ABC1234')).toBe(false)
      expect(validateJoinCode('')).toBe(false)
    })
  })

  describe('formatJoinCode', () => {
    it('should format join codes correctly', () => {
      expect(formatJoinCode('abc 123')).toBe('ABC123')
      expect(formatJoinCode('  def456  ')).toBe('DEF456')
      expect(formatJoinCode('a b c 1 2 3')).toBe('ABC123')
    })
  })

  describe('isQuizActive', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return true for active quiz', () => {
      const now = new Date('2025-07-15T12:00:00Z')
      jest.setSystemTime(now)

      const activeQuiz = {
        startDate: '2025-07-15T10:00:00Z',
        endDate: '2025-07-15T14:00:00Z'
      }
      expect(isQuizActive(activeQuiz)).toBe(true)
    })

    it('should return false for quiz not started', () => {
      const now = new Date('2025-07-15T12:00:00Z')
      jest.setSystemTime(now)

      const futureQuiz = {
        startDate: '2025-07-15T14:00:00Z',
        endDate: '2025-07-15T16:00:00Z'
      }
      expect(isQuizActive(futureQuiz)).toBe(false)
    })

    it('should return false for ended quiz', () => {
      const now = new Date('2025-07-15T12:00:00Z')
      jest.setSystemTime(now)

      const endedQuiz = {
        startDate: '2025-07-15T08:00:00Z',
        endDate: '2025-07-15T10:00:00Z'
      }
      expect(isQuizActive(endedQuiz)).toBe(false)
    })
  })
})
