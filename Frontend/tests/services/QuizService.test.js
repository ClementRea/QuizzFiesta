const QuizService = require('../../src/services/QuizService').default
const axios = require('axios')

jest.mock('axios')

describe('QuizService utility functions', () => {
  it('should validate correct hexadecimal codes', () => {
    expect(QuizService.validateJoinCode('ABC123')).toBe(true)
    expect(QuizService.validateJoinCode('def456')).toBe(true)
    expect(QuizService.validateJoinCode('123ABC')).toBe(true)
  })

  it('should reject invalid join codes', () => {
    expect(QuizService.validateJoinCode('ABCG23')).toBe(false)
    expect(QuizService.validateJoinCode('ABC12')).toBe(false)
    expect(QuizService.validateJoinCode('ABC1234')).toBe(false)
    expect(QuizService.validateJoinCode('')).toBe(false)
  })

  it('should format join codes correctly', () => {
    expect(QuizService.formatJoinCode('abc 123')).toBe('ABC123')
    expect(QuizService.formatJoinCode('  def456  ')).toBe('DEF456')
    expect(QuizService.formatJoinCode('a b c 1 2 3')).toBe('ABC123')
  })

  it('should detect active quiz', () => {
    const now = new Date()
    const activeQuiz = {
      startDate: new Date(now.getTime() - 10000).toISOString(),
      endDate: new Date(now.getTime() + 10000).toISOString(),
    }
    expect(QuizService.isQuizActive(activeQuiz)).toBe(true)
  })

  it('should detect inactive quiz', () => {
    const now = new Date()
    const futureQuiz = {
      startDate: new Date(now.getTime() + 10000).toISOString(),
      endDate: new Date(now.getTime() + 20000).toISOString(),
    }
    expect(QuizService.isQuizActive(futureQuiz)).toBe(false)
  })

  it('should get quiz time status', () => {
    const now = new Date()
    const quizNotStarted = {
      startDate: new Date(now.getTime() + 10000).toISOString(),
      endDate: new Date(now.getTime() + 20000).toISOString(),
    }
    const quizEnded = {
      startDate: new Date(now.getTime() - 20000).toISOString(),
      endDate: new Date(now.getTime() - 10000).toISOString(),
    }
    const quizActive = {
      startDate: new Date(now.getTime() - 10000).toISOString(),
      endDate: new Date(now.getTime() + 10000).toISOString(),
    }
    expect(QuizService.getQuizTimeStatus(quizNotStarted).status).toBe('not_started')
    expect(QuizService.getQuizTimeStatus(quizEnded).status).toBe('ended')
    expect(QuizService.getQuizTimeStatus(quizActive).status).toBe('active')
  })

  it('should validate session codes', () => {
    expect(QuizService.validateSessionCode('ABC123')).toBe(true)
    expect(QuizService.validateSessionCode('INVALID')).toBe(false)
  })

  it('should format session codes', () => {
    expect(QuizService.formatSessionCode('abc 123')).toBe('ABC123')
  })

  it('should detect session status', () => {
    expect(QuizService.isSessionActive({ status: 'lobby' })).toBe(true)
    expect(QuizService.isSessionActive({ status: 'playing' })).toBe(true)
    expect(QuizService.isSessionActive({ status: 'finished' })).toBe(false)
  })

  it('should get session status', () => {
    const lobbySession = { status: 'lobby' }
    const playingSession = { status: 'playing', settings: { allowLateJoin: true } }
    const finishedSession = { status: 'finished' }

    expect(QuizService.getSessionStatus(lobbySession).status).toBe('waiting')
    expect(QuizService.getSessionStatus(lobbySession).canJoin).toBe(true)

    expect(QuizService.getSessionStatus(playingSession).status).toBe('active')
    expect(QuizService.getSessionStatus(playingSession).canJoin).toBe(true)

    expect(QuizService.getSessionStatus(finishedSession).status).toBe('finished')
    expect(QuizService.getSessionStatus(finishedSession).canJoin).toBe(false)
  })

  it('should calculate question time remaining', () => {
    const gameState = {
      currentQuestionStartTime: new Date(Date.now() - 5000).toISOString(),
    }
    const settings = { timePerQuestion: 30 }

    const remaining = QuizService.getQuestionTimeRemaining(gameState, settings)
    expect(remaining).toBeGreaterThan(20000)
    expect(remaining).toBeLessThanOrEqual(25000)
  })
})

describe('QuizService API methods', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should join quiz by code', async () => {
    const mockResponse = { data: { quiz: { id: 1, title: 'Test Quiz' } } }
    axios.get.mockResolvedValue(mockResponse)

    const result = await QuizService.joinQuizByCode('ABC123')

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/quiz/join/ABC123'))
    expect(result).toEqual(mockResponse.data)
  })

  it('should handle join quiz by code error', async () => {
    const mockError = { response: { data: { error: 'Quiz not found' } } }
    axios.get.mockRejectedValue(mockError)

    await expect(QuizService.joinQuizByCode('INVALID')).rejects.toEqual({ error: 'Quiz not found' })
  })

  it('should get quiz by id', async () => {
    const mockResponse = { data: { id: 1, title: 'Test Quiz' } }
    axios.get.mockResolvedValue(mockResponse)

    const quiz = await QuizService.getQuizById(1)

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/quiz/1'))
    expect(quiz).toEqual(mockResponse.data)
  })

  it('should handle get quiz by id error', async () => {
    const mockError = { response: { data: { error: 'Quiz not found' } } }
    axios.get.mockRejectedValue(mockError)

    await expect(QuizService.getQuizById(999)).rejects.toEqual({ error: 'Quiz not found' })
  })

  it('should get all quizzes', async () => {
    const mockResponse = { data: [{ id: 1 }, { id: 2 }] }
    axios.get.mockResolvedValue(mockResponse)

    const quizzes = await QuizService.getAllQuizzes()

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/quiz/?'))
    expect(quizzes).toEqual(mockResponse.data)
  })

  it('should get all quizzes with filters', async () => {
    const mockResponse = { data: [{ id: 1 }] }
    axios.get.mockResolvedValue(mockResponse)

    const quizzes = await QuizService.getAllQuizzes({ isPublic: true, active: true })

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('isPublic=true'))
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('active=true'))
    expect(quizzes).toEqual(mockResponse.data)
  })

  it('should get my quizzes', async () => {
    const mockResponse = { data: [{ id: 1, title: 'My Quiz' }] }
    axios.get.mockResolvedValue(mockResponse)

    const result = await QuizService.getMyQuizes()

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/quiz/myQuizes'))
    expect(result).toEqual(mockResponse.data)
  })

  it('should create quiz without file', async () => {
    const mockResponse = { data: { id: 2, title: 'New Quiz' } }
    axios.post.mockResolvedValue(mockResponse)

    const quizData = { title: 'New Quiz', description: 'desc', questions: [] }
    const quiz = await QuizService.createQuiz(quizData)

    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/quiz/create'), quizData)
    expect(quiz).toEqual(mockResponse.data)
  })

  it('should create quiz with file', async () => {
    const mockResponse = { data: { id: 2, title: 'New Quiz' } }
    axios.post.mockResolvedValue(mockResponse)

    const mockFile = new File(['logo'], 'logo.png', { type: 'image/png' })
    const quizData = {
      title: 'New Quiz',
      description: 'desc',
      questions: [],
      logo: mockFile,
    }

    const quiz = await QuizService.createQuiz(quizData)

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/quiz/create'),
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
    expect(quiz).toEqual(mockResponse.data)
  })

  it('should handle create quiz error', async () => {
    const mockError = { response: { data: { error: 'Validation failed' } } }
    axios.post.mockRejectedValue(mockError)

    await expect(QuizService.createQuiz({})).rejects.toEqual({ error: 'Validation failed' })
  })

  it('should update quiz without file', async () => {
    const mockResponse = { data: { id: 2, title: 'Updated Quiz' } }
    axios.put.mockResolvedValue(mockResponse)

    const quizData = { title: 'Updated Quiz', description: 'desc', questions: [] }
    const quiz = await QuizService.updateQuiz(2, quizData)

    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/quiz/update/2'), quizData)
    expect(quiz).toEqual(mockResponse.data)
  })

  it('should update quiz with file', async () => {
    const mockResponse = { data: { id: 2, title: 'Updated Quiz' } }
    axios.put.mockResolvedValue(mockResponse)

    const mockFile = new File(['logo'], 'logo.png', { type: 'image/png' })
    const quizData = {
      title: 'Updated Quiz',
      description: 'desc',
      isPublic: true,
      logo: mockFile,
    }

    const quiz = await QuizService.updateQuiz(2, quizData)

    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/quiz/update/2'),
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
    expect(quiz).toEqual(mockResponse.data)
  })

  it('should delete quiz', async () => {
    const mockResponse = { data: { success: true } }
    axios.delete.mockResolvedValue(mockResponse)

    const result = await QuizService.deleteQuiz(1)

    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/quiz/1'))
    expect(result).toEqual(mockResponse.data)
  })

  it('should handle delete quiz error', async () => {
    const mockError = { response: { data: { error: 'Not authorized' } } }
    axios.delete.mockRejectedValue(mockError)

    await expect(QuizService.deleteQuiz(1)).rejects.toEqual({ error: 'Not authorized' })
  })

  it('should generate join code', async () => {
    const mockResponse = { data: { code: 'ABC123' } }
    axios.post.mockResolvedValue(mockResponse)

    const result = await QuizService.generateJoinCode(1)

    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/quiz/generateCode/1'))
    expect(result).toEqual(mockResponse.data)
  })

  it('should add questions to quiz', async () => {
    const mockResponse = { data: { success: true } }
    axios.put.mockResolvedValue(mockResponse)

    const questions = [{ text: 'Question 1', options: ['A', 'B'] }]
    const result = await QuizService.addQuestionsToQuiz(1, questions)

    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/quiz/addQuestions/1'), {
      questions,
    })
    expect(result).toEqual(mockResponse.data)
  })

  it('should handle network errors', async () => {
    const networkError = new Error('Network Error')
    axios.get.mockRejectedValue(networkError)

    await expect(QuizService.getQuizById(1)).rejects.toEqual(networkError)
  })
})
