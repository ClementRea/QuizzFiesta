const  QuizService = require('../../src/services/QuizService').default
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
      endDate: new Date(now.getTime() + 10000).toISOString()
    }
    expect(QuizService.isQuizActive(activeQuiz)).toBe(true)
  })

  it('should detect inactive quiz', () => {
    const now = new Date()
    const futureQuiz = {
      startDate: new Date(now.getTime() + 10000).toISOString(),
      endDate: new Date(now.getTime() + 20000).toISOString()
    }
    expect(QuizService.isQuizActive(futureQuiz)).toBe(false)
  })

  it('should get quiz time status', () => {
    const now = new Date()
    const quizNotStarted = {
      startDate: new Date(now.getTime() + 10000).toISOString(),
      endDate: new Date(now.getTime() + 20000).toISOString()
    }
    const quizEnded = {
      startDate: new Date(now.getTime() - 20000).toISOString(),
      endDate: new Date(now.getTime() - 10000).toISOString()
    }
    const quizActive = {
      startDate: new Date(now.getTime() - 10000).toISOString(),
      endDate: new Date(now.getTime() + 10000).toISOString()
    }
    expect(QuizService.getQuizTimeStatus(quizNotStarted).status).toBe('not_started')
    expect(QuizService.getQuizTimeStatus(quizEnded).status).toBe('ended')
    expect(QuizService.getQuizTimeStatus(quizActive).status).toBe('active')
  })
})

describe('QuizService API methods', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should get quiz by id', async () => {
    axios.get.mockResolvedValue({ data: { id: 1, title: 'Test Quiz' } })
    const quiz = await QuizService.getQuizById(1)
    expect(quiz).toEqual({ id: 1, title: 'Test Quiz' })
  })

  it('should get all quizzes', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] })
    const quizzes = await QuizService.getAllQuizzes()
    expect(quizzes).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('should create quiz', async () => {
    axios.post.mockResolvedValue({ data: { id: 2, title: 'New Quiz' } })
    const quizData = { title: 'New Quiz', description: 'desc', questions: [] }
    const quiz = await QuizService.createQuiz(quizData)
    expect(quiz).toEqual({ id: 2, title: 'New Quiz' })
  })

  it('should update quiz', async () => {
    axios.put.mockResolvedValue({ data: { id: 2, title: 'Updated Quiz' } })
    const quizData = { title: 'Updated Quiz', description: 'desc', questions: [] }
    const quiz = await QuizService.updateQuiz(2, quizData)
    expect(quiz).toEqual({ id: 2, title: 'Updated Quiz' })
  })

  it('should delete quiz', async () => {
    axios.delete.mockResolvedValue({ data: { success: true } })
    const result = await QuizService.deleteQuiz(1)
    expect(result).toEqual({ success: true })
  })

  it('should generate join code', async () => {
    axios.post.mockResolvedValue({ data: { code: 'ABC123' } })
    const result = await QuizService.generateJoinCode(1)
    expect(result).toEqual({ code: 'ABC123' })
  })

  it('should add questions to quiz', async () => {
    axios.put.mockResolvedValue({ data: { success: true } })
    const result = await QuizService.addQuestionsToQuiz(1, [{ q: 'Q1' }])
    expect(result).toEqual({ success: true })
  })
})
