const SessionService = require('../../src/services/SessionService').default
const axios = require('axios')

jest.mock('axios')

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Session Management', () => {
    it('should create a new session', async () => {
      const mockResponse = { data: { sessionId: '123', code: 'ABC123' } }
      axios.post.mockResolvedValue(mockResponse)

      const result = await SessionService.createSession('quiz123', { maxPlayers: 10 })

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/session/create/quiz123'),
        { settings: { maxPlayers: 10 } }
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle create session error', async () => {
      const mockError = { response: { data: { error: 'Quiz not found' } } }
      axios.post.mockRejectedValue(mockError)

      await expect(SessionService.createSession('invalidQuiz')).rejects.toEqual({ error: 'Quiz not found' })
    })

    it('should join session by code', async () => {
      const mockResponse = { data: { sessionId: '123', quiz: { title: 'Test Quiz' } } }
      axios.get.mockResolvedValue(mockResponse)

      const result = await SessionService.joinSessionByCode('ABC123')

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/session/join/ABC123'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle join session by code error', async () => {
      const mockError = { response: { data: { error: 'Session not found' } } }
      axios.get.mockRejectedValue(mockError)

      await expect(SessionService.joinSessionByCode('INVALID')).rejects.toEqual({ error: 'Session not found' })
    })

    it('should join session lobby', async () => {
      const mockResponse = { data: { success: true, participantId: 'p123' } }
      axios.post.mockResolvedValue(mockResponse)

      const result = await SessionService.joinSessionLobby('session123')

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/session/session123/lobby/join'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should leave session lobby', async () => {
      const mockResponse = { data: { success: true } }
      axios.post.mockResolvedValue(mockResponse)

      const result = await SessionService.leaveSessionLobby('session123')

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/session/session123/lobby/leave'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should get session participants', async () => {
      const mockResponse = { data: { participants: [{ id: 'p1', name: 'Player 1' }] } }
      axios.get.mockResolvedValue(mockResponse)

      const result = await SessionService.getSessionParticipants('session123')

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/session/session123/lobby/participants'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should set session ready state', async () => {
      const mockResponse = { data: { success: true, isReady: true } }
      axios.put.mockResolvedValue(mockResponse)

      const result = await SessionService.setSessionReady('session123', true)

      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/session/session123/lobby/ready'),
        { isReady: true }
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should start game session', async () => {
      const mockResponse = { data: { success: true, status: 'started' } }
      axios.post.mockResolvedValue(mockResponse)

      const result = await SessionService.startGameSession('session123')

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/session/session123/start'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should get session state', async () => {
      const mockResponse = { data: { status: 'lobby', currentQuestion: null } }
      axios.get.mockResolvedValue(mockResponse)

      const result = await SessionService.getSessionState('session123')

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/session/session123/state'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should end game session', async () => {
      const mockResponse = { data: { success: true, status: 'ended' } }
      axios.delete.mockResolvedValue(mockResponse)

      const result = await SessionService.endGameSession('session123')

      expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/session/session123/end'))
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('Gameplay', () => {
    it('should get session questions', async () => {
      const mockResponse = { data: { questions: [{ id: 'q1', text: 'Question 1' }] } }
      axios.get.mockResolvedValue(mockResponse)

      const result = await SessionService.getSessionQuestions('session123')

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/session/session123/questions'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should submit session answer', async () => {
      const mockResponse = { data: { success: true, correct: true, score: 100 } }
      axios.post.mockResolvedValue(mockResponse)

      const result = await SessionService.submitSessionAnswer('session123', 'q1', 'answer A')

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/session/session123/answer'),
        { questionId: 'q1', answer: 'answer A' }
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle submit answer error', async () => {
      const mockError = { response: { data: { error: 'Time expired' } } }
      axios.post.mockRejectedValue(mockError)

      await expect(SessionService.submitSessionAnswer('session123', 'q1', 'answer A'))
        .rejects.toEqual({ error: 'Time expired' })
    })

    it('should go to next session question', async () => {
      const mockResponse = { data: { success: true, currentQuestion: 2 } }
      axios.post.mockResolvedValue(mockResponse)

      const result = await SessionService.nextSessionQuestion('session123')

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/session/session123/next-question'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should get session leaderboard', async () => {
      const mockResponse = {
        data: {
          leaderboard: [
            { participantId: 'p1', name: 'Player 1', score: 200 },
            { participantId: 'p2', name: 'Player 2', score: 150 }
          ]
        }
      }
      axios.get.mockResolvedValue(mockResponse)

      const result = await SessionService.getSessionLeaderboard('session123')

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/session/session123/leaderboard'))
      expect(result).toEqual(mockResponse.data)
    })

    it('should get participant state', async () => {
      const mockResponse = { data: { participantId: 'p1', score: 150, answeredQuestions: ['q1'] } }
      axios.get.mockResolvedValue(mockResponse)

      const result = await SessionService.getParticipantState('session123')

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/session/session123/participant/state'))
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error')
      axios.get.mockRejectedValue(networkError)

      await expect(SessionService.getSessionState('session123')).rejects.toEqual(networkError)
    })

    it('should handle errors without response data', async () => {
      const errorWithoutResponse = new Error('Something went wrong')
      axios.post.mockRejectedValue(errorWithoutResponse)

      await expect(SessionService.createSession('quiz123')).rejects.toEqual(errorWithoutResponse)
    })
  })
})
