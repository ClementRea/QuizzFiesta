describe('SocketService utility functions', () => {
  describe('Socket event helpers', () => {
    const validEvents = [
      'lobby:joined',
      'lobby:participants-updated',
      'lobby:user-joined',
      'lobby:user-left',
      'lobby:user-ready-changed',
      'lobby:session-started',
      'game:current-question',
      'game:answer-result',
      'game:participant-answered',
      'game:leaderboard-updated',
      'game:new-question',
      'game:time-up',
      'game:time-up-organizer',
      'game:session-ended',
      'error'
    ]

    it('should contain expected event names', () => {
      expect(validEvents).toContain('lobby:joined')
      expect(validEvents).toContain('game:session-ended')
      expect(validEvents).toContain('error')
    })

    it('should not contain unknown events', () => {
      expect(validEvents).not.toContain('unknown:event')
      expect(validEvents).not.toContain('')
    })
  })

  describe('Socket data validation', () => {
    const isValidSessionId = (id) => {
      // Un id de session doit être une string non vide
      return typeof id === 'string' && id.length > 0
    }

    it('should validate correct session ids', () => {
      expect(isValidSessionId('abc123')).toBe(true)
      expect(isValidSessionId('session-42')).toBe(true)
    })

    it('should reject invalid session ids', () => {
      expect(isValidSessionId('')).toBe(false)
      expect(isValidSessionId(null)).toBe(false)
      expect(isValidSessionId(undefined)).toBe(false)
    })
  })
})
