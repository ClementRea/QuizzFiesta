const SocketService = require('../../src/services/SocketService').default
const { io } = require('socket.io-client')
const AuthService = require('../../src/services/AuthService').default

// Mock socket.io-client
jest.mock('socket.io-client')
jest.mock('../../src/services/AuthService')

describe('SocketService', () => {
  let mockSocket

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset SocketService state
    SocketService.socket = null
    SocketService.isConnected = false
    SocketService.listeners = new Map()

    // Mock socket instance
    mockSocket = {
      id: 'mock-socket-id',
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      disconnect: jest.fn(),
    }

    io.mockReturnValue(mockSocket)
    AuthService.getAccessToken.mockReturnValue('mock-token')

    // Mock console methods to avoid test noise
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Utility functions', () => {
    it('should validate correct session ids', () => {
      expect(SocketService.isValidSessionId('abc123')).toBe(true)
      expect(SocketService.isValidSessionId('session-42')).toBe(true)
      expect(SocketService.isValidSessionId('xyz')).toBe(true)
    })

    it('should reject invalid session ids', () => {
      expect(SocketService.isValidSessionId('')).toBe(false)
      expect(SocketService.isValidSessionId(null)).toBe(false)
      expect(SocketService.isValidSessionId(undefined)).toBe(false)
      expect(SocketService.isValidSessionId(123)).toBe(false)
    })

    it('should return valid events list', () => {
      const validEvents = SocketService.getValidEvents()

      expect(validEvents).toContain('lobby:joined')
      expect(validEvents).toContain('game:session-ended')
      expect(validEvents).toContain('error')
      expect(validEvents).not.toContain('unknown:event')
      expect(validEvents.length).toBeGreaterThan(10)
    })
  })

  describe('Connection management', () => {
    it('should connect successfully with valid token', async () => {
      const connectPromise = SocketService.connect()

      // Simulate successful connection
      const connectCallback = mockSocket.once.mock.calls.find((call) => call[0] === 'connect')[1]
      connectCallback()

      const result = await connectPromise

      expect(io).toHaveBeenCalledWith(
        'http://localhost:3000',
        expect.objectContaining({
          auth: { token: 'mock-token' },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
        }),
      )
      expect(result).toBe(mockSocket)
      expect(SocketService.socket).toBe(mockSocket)
    })

    it('should reject connection when no token available', async () => {
      AuthService.getAccessToken.mockReturnValue(null)

      await expect(SocketService.connect()).rejects.toThrow('Token manquant')
      expect(io).not.toHaveBeenCalled()
    })

    it('should handle connection error', async () => {
      const connectPromise = SocketService.connect()
      const error = new Error('Connection failed')

      // Simulate connection error
      const errorCallback = mockSocket.once.mock.calls.find(
        (call) => call[0] === 'connect_error',
      )[1]
      errorCallback(error)

      await expect(connectPromise).rejects.toThrow('Connection failed')
    })

    it('should handle connection timeout', async () => {
      jest.useFakeTimers()

      const connectPromise = SocketService.connect()

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(10000)

      await expect(connectPromise).rejects.toThrow('Timeout de connexion WebSocket')

      jest.useRealTimers()
    })

    it('should return existing socket if already connected', async () => {
      SocketService.socket = mockSocket
      SocketService.isConnected = true

      const result = await SocketService.connect()

      expect(result).toBe(mockSocket)
      expect(io).not.toHaveBeenCalled()
    })

    it('should disconnect properly', () => {
      SocketService.socket = mockSocket
      SocketService.isConnected = true
      SocketService.listeners.set('test', new Set(['callback']))

      SocketService.disconnect()

      expect(mockSocket.disconnect).toHaveBeenCalled()
      expect(SocketService.socket).toBeNull()
      expect(SocketService.isConnected).toBe(false)
      expect(SocketService.listeners.size).toBe(0)
    })
  })

  describe('Event handlers setup', () => {
    beforeEach(() => {
      SocketService.socket = mockSocket
    })

    it('should setup event handlers correctly', () => {
      SocketService.setupEventHandlers()

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should handle connect event', () => {
      SocketService.setupEventHandlers()

      const connectHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'connect')[1]
      connectHandler()

      expect(SocketService.isConnected).toBe(true)
    })

    it('should handle disconnect event', () => {
      SocketService.isConnected = true
      SocketService.setupEventHandlers()

      const disconnectHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'disconnect')[1]
      disconnectHandler('transport close')

      expect(SocketService.isConnected).toBe(false)
    })
  })

  describe('Lobby methods', () => {
    beforeEach(() => {
      SocketService.socket = mockSocket
      SocketService.isConnected = true
    })

    it('should join lobby successfully', () => {
      const result = SocketService.joinLobby('session123')

      expect(result).toBe(true)
      expect(mockSocket.emit).toHaveBeenCalledWith('lobby:join', { sessionId: 'session123' })
    })

    it('should leave lobby successfully', () => {
      const result = SocketService.leaveLobby('session123')

      expect(result).toBe(true)
      expect(mockSocket.emit).toHaveBeenCalledWith('lobby:leave', { sessionId: 'session123' })
    })

    it('should set ready status', () => {
      const result = SocketService.setReady('session123', true)

      expect(result).toBe(true)
      expect(mockSocket.emit).toHaveBeenCalledWith('lobby:ready', {
        sessionId: 'session123',
        isReady: true,
      })
    })

    it('should start session', () => {
      const result = SocketService.startSession('session123')

      expect(result).toBe(true)
      expect(mockSocket.emit).toHaveBeenCalledWith('lobby:start', { sessionId: 'session123' })
    })

    it('should return false when socket not connected', () => {
      SocketService.isConnected = false

      expect(SocketService.joinLobby('session123')).toBe(false)
      expect(SocketService.leaveLobby('session123')).toBe(false)
      expect(SocketService.setReady('session123', true)).toBe(false)
      expect(SocketService.startSession('session123')).toBe(false)
    })
  })

  describe('Game methods', () => {
    beforeEach(() => {
      SocketService.socket = mockSocket
      SocketService.isConnected = true
    })

    it('should join game successfully', () => {
      const result = SocketService.joinGame('session123')

      expect(result).toBe(true)
      expect(mockSocket.emit).toHaveBeenCalledWith('game:join', { sessionId: 'session123' })
    })

    it('should submit answer', () => {
      const result = SocketService.submitAnswer('session123', 'q1', 'answer A')

      expect(result).toBe(true)
      expect(mockSocket.emit).toHaveBeenCalledWith('game:answer', {
        sessionId: 'session123',
        questionId: 'q1',
        answer: 'answer A',
      })
    })

    it('should go to next question', () => {
      const result = SocketService.nextQuestion('session123')

      expect(result).toBe(true)
      expect(mockSocket.emit).toHaveBeenCalledWith('game:next-question', {
        sessionId: 'session123',
      })
    })

    it('should end session', () => {
      const result = SocketService.endSession('session123')

      expect(result).toBe(true)
      expect(mockSocket.emit).toHaveBeenCalledWith('game:end', { sessionId: 'session123' })
    })

    it('should return false when socket not connected', () => {
      SocketService.isConnected = false

      expect(SocketService.joinGame('session123')).toBe(false)
      expect(SocketService.submitAnswer('session123', 'q1', 'answer')).toBe(false)
      expect(SocketService.nextQuestion('session123')).toBe(false)
      expect(SocketService.endSession('session123')).toBe(false)
    })
  })

  describe('Event listener management', () => {
    beforeEach(() => {
      SocketService.socket = mockSocket
    })

    it('should add event listener', () => {
      const callback = jest.fn()

      SocketService.on('test-event', callback)

      expect(mockSocket.on).toHaveBeenCalledWith('test-event', callback)
      expect(SocketService.listeners.get('test-event')).toContain(callback)
    })

    it('should remove specific event listener', () => {
      const callback = jest.fn()
      SocketService.listeners.set('test-event', new Set([callback]))

      SocketService.off('test-event', callback)

      expect(mockSocket.off).toHaveBeenCalledWith('test-event', callback)
      expect(SocketService.listeners.get('test-event').has(callback)).toBe(false)
    })

    it('should remove all listeners for event', () => {
      SocketService.listeners.set('test-event', new Set(['callback1', 'callback2']))

      SocketService.off('test-event')

      expect(mockSocket.off).toHaveBeenCalledWith('test-event')
      expect(SocketService.listeners.has('test-event')).toBe(false)
    })

    it('should remove all listeners', () => {
      SocketService.listeners.set('event1', new Set(['callback1']))
      SocketService.listeners.set('event2', new Set(['callback2']))

      SocketService.removeAllListeners()

      expect(mockSocket.off).toHaveBeenCalledTimes(2)
      expect(SocketService.listeners.size).toBe(0)
    })

    it('should handle adding listener when socket not initialized', () => {
      SocketService.socket = null

      SocketService.on('test-event', jest.fn())

      expect(console.warn).toHaveBeenCalledWith(
        "Socket non initialisé pour l'événement:",
        'test-event',
      )
    })
  })

  describe('Utility methods', () => {
    it('should check socket connection status', () => {
      SocketService.socket = null
      SocketService.isConnected = false
      expect(SocketService.isSocketConnected()).toBe(false)

      SocketService.socket = mockSocket
      SocketService.isConnected = false
      expect(SocketService.isSocketConnected()).toBe(false)

      SocketService.socket = mockSocket
      SocketService.isConnected = true
      expect(SocketService.isSocketConnected()).toBe(true)
    })

    it('should get socket id', () => {
      SocketService.socket = null
      expect(SocketService.getSocketId()).toBeNull()

      SocketService.socket = mockSocket
      expect(SocketService.getSocketId()).toBe('mock-socket-id')
    })

    it('should emit custom event', () => {
      SocketService.socket = mockSocket
      SocketService.isConnected = true

      const result = SocketService.emit('custom-event', { data: 'test' })

      expect(result).toBe(true)
      expect(mockSocket.emit).toHaveBeenCalledWith('custom-event', { data: 'test' })
    })

    it('should fail to emit when not connected', () => {
      SocketService.socket = mockSocket
      SocketService.isConnected = false

      const result = SocketService.emit('custom-event', { data: 'test' })

      expect(result).toBe(false)
      expect(console.warn).toHaveBeenCalledWith('Socket non connecté pour émettre:', 'custom-event')
    })
  })

  describe('Event handler helpers', () => {
    beforeEach(() => {
      SocketService.socket = mockSocket
      jest.spyOn(SocketService, 'on')
    })

    it('should register lobby event handlers', () => {
      const callback = jest.fn()

      SocketService.onLobbyJoined(callback)
      SocketService.onLobbyParticipantsUpdated(callback)
      SocketService.onLobbyUserJoined(callback)
      SocketService.onLobbyUserLeft(callback)
      SocketService.onLobbyUserReadyChanged(callback)
      SocketService.onLobbySessionStarted(callback)

      expect(SocketService.on).toHaveBeenCalledWith('lobby:joined', callback)
      expect(SocketService.on).toHaveBeenCalledWith('lobby:participants-updated', callback)
      expect(SocketService.on).toHaveBeenCalledWith('lobby:user-joined', callback)
      expect(SocketService.on).toHaveBeenCalledWith('lobby:user-left', callback)
      expect(SocketService.on).toHaveBeenCalledWith('lobby:user-ready-changed', callback)
      expect(SocketService.on).toHaveBeenCalledWith('lobby:session-started', callback)
    })

    it('should register game event handlers', () => {
      const callback = jest.fn()

      SocketService.onGameCurrentQuestion(callback)
      SocketService.onGameAnswerResult(callback)
      SocketService.onGameParticipantAnswered(callback)
      SocketService.onGameLeaderboardUpdated(callback)
      SocketService.onGameNewQuestion(callback)
      SocketService.onGameTimeUp(callback)
      SocketService.onGameTimeUpOrganizer(callback)
      SocketService.onGameSessionEnded(callback)
      SocketService.onError(callback)

      expect(SocketService.on).toHaveBeenCalledWith('game:current-question', callback)
      expect(SocketService.on).toHaveBeenCalledWith('game:answer-result', callback)
      expect(SocketService.on).toHaveBeenCalledWith('game:participant-answered', callback)
      expect(SocketService.on).toHaveBeenCalledWith('game:leaderboard-updated', callback)
      expect(SocketService.on).toHaveBeenCalledWith('game:new-question', callback)
      expect(SocketService.on).toHaveBeenCalledWith('game:time-up', callback)
      expect(SocketService.on).toHaveBeenCalledWith('game:time-up-organizer', callback)
      expect(SocketService.on).toHaveBeenCalledWith('game:session-ended', callback)
      expect(SocketService.on).toHaveBeenCalledWith('error', callback)
    })
  })
})
