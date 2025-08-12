import { io } from 'socket.io-client'
import AuthService from './AuthService'

const getSocketUrl = () => {
  // Utilise la variable d'environnement ou l'URL de production
  const apiUrl = process.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'

  // Fallback pour le développement local
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000'
  }

  return apiUrl
}

const SocketService = {
  socket: null,
  isConnected: false,
  listeners: new Map(),

  // Connexion au serveur WebSocket
  connect() {
    if (this.socket && this.isConnected) {
      return Promise.resolve(this.socket)
    }

    const token = AuthService.getAccessToken()
    if (!token) {
      console.error('Token manquant pour la connexion WebSocket')
      return Promise.reject(new Error('Token manquant'))
    }

    const backendUrl = getSocketUrl()

    this.socket = io(backendUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    })

    this.setupEventHandlers()

    // Retourner une Promise qui se résout quand la connexion est établie
    return new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        reject(new Error('Timeout de connexion WebSocket'))
      }, 10000)

      this.socket.once('connect', () => {
        clearTimeout(connectTimeout)
        resolve(this.socket)
      })

      this.socket.once('connect_error', (error) => {
        clearTimeout(connectTimeout)
        reject(error)
      })
    })
  },

  // Configuration des handlers d'événements de base
  setupEventHandlers() {
    this.socket.on('connect', () => {
      this.isConnected = true
    })

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false

      // Tentative de reconnexion automatique sauf si c'est volontaire
      if (reason !== 'io client disconnect') {
        setTimeout(() => {
          if (!this.isConnected) {
            this.connect()
          }
        }, 2000)
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Erreur connexion WebSocket:', error.message)
      this.isConnected = false
    })

    this.socket.on('error', (error) => {
      console.error('Erreur WebSocket:', error)
    })
  },

  // Déconnexion
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
    }
  },

  // === LOBBY METHODS ===

  // Rejoindre un lobby
  joinLobby(sessionId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket non connecté')
      return false
    }

    this.socket.emit('lobby:join', { sessionId })
    return true
  },

  // Quitter un lobby
  leaveLobby(sessionId) {
    if (!this.socket || !this.isConnected) return false

    this.socket.emit('lobby:leave', { sessionId })
    return true
  },

  // Changer le statut prêt
  setReady(sessionId, isReady) {
    if (!this.socket || !this.isConnected) return false

    this.socket.emit('lobby:ready', { sessionId, isReady })
    return true
  },

  // Démarrer la session (organisateur)
  startSession(sessionId) {
    if (!this.socket || !this.isConnected) return false

    this.socket.emit('lobby:start', { sessionId })
    return true
  },

  // === GAME METHODS ===

  // Rejoindre une session de jeu
  joinGame(sessionId) {
    if (!this.socket || !this.isConnected) return false

    this.socket.emit('game:join', { sessionId })
    return true
  },

  // Soumettre une réponse
  submitAnswer(sessionId, questionId, answer) {
    if (!this.socket || !this.isConnected) return false

    this.socket.emit('game:answer', { sessionId, questionId, answer })
    return true
  },

  // Passer à la question suivante (organisateur)
  nextQuestion(sessionId) {
    if (!this.socket || !this.isConnected) return false

    this.socket.emit('game:next-question', { sessionId })
    return true
  },

  // Terminer la session (organisateur)
  endSession(sessionId) {
    if (!this.socket || !this.isConnected) return false

    this.socket.emit('game:end', { sessionId })
    return true
  },

  // === EVENT LISTENERS ===

  // Ajouter un listener d'événement
  on(event, callback) {
    if (!this.socket) {
      console.warn("Socket non initialisé pour l'événement:", event)
      return
    }

    // Stocker le callback pour pouvoir le supprimer plus tard
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    this.socket.on(event, callback)
  },

  // Supprimer un listener d'événement
  off(event, callback) {
    if (!this.socket) return

    if (callback) {
      this.socket.off(event, callback)
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback)
      }
    } else {
      this.socket.off(event)
      this.listeners.delete(event)
    }
  },

  // Supprimer tous les listeners
  removeAllListeners() {
    if (!this.socket) return

    this.listeners.forEach((callbacks, event) => {
      this.socket.off(event)
    })
    this.listeners.clear()
  },

  // === UTILITY METHODS ===

  // Vérifier si la connexion est active
  isSocketConnected() {
    return !!(this.socket && this.isConnected)
  },

  // Obtenir l'ID du socket
  getSocketId() {
    return this.socket?.id || null
  },

  // Émettre un événement personnalisé
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket non connecté pour émettre:', event)
      return false
    }

    this.socket.emit(event, data)
    return true
  },

  // === LOBBY EVENT HANDLERS HELPERS ===

  // Helpers pour simplifier l'utilisation dans les composants
  onLobbyJoined(callback) {
    this.on('lobby:joined', callback)
  },

  onLobbyParticipantsUpdated(callback) {
    this.on('lobby:participants-updated', callback)
  },

  onLobbyUserJoined(callback) {
    this.on('lobby:user-joined', callback)
  },

  onLobbyUserLeft(callback) {
    this.on('lobby:user-left', callback)
  },

  onLobbyUserReadyChanged(callback) {
    this.on('lobby:user-ready-changed', callback)
  },

  onLobbySessionStarted(callback) {
    this.on('lobby:session-started', callback)
  },

  // === GAME EVENT HANDLERS HELPERS ===

  onGameCurrentQuestion(callback) {
    this.on('game:current-question', callback)
  },

  onGameAnswerResult(callback) {
    this.on('game:answer-result', callback)
  },

  onGameParticipantAnswered(callback) {
    this.on('game:participant-answered', callback)
  },

  onGameLeaderboardUpdated(callback) {
    this.on('game:leaderboard-updated', callback)
  },

  onGameNewQuestion(callback) {
    this.on('game:new-question', callback)
  },

  onGameTimeUp(callback) {
    this.on('game:time-up', callback)
  },

  onGameTimeUpOrganizer(callback) {
    this.on('game:time-up-organizer', callback)
  },

  onGameSessionEnded(callback) {
    this.on('game:session-ended', callback)
  },

  onError(callback) {
    this.on('error', callback)
  },

  // Utility functions
  isValidSessionId(id) {
    // Un id de session doit être une string non vide
    return typeof id === 'string' && id.length > 0
  },

  getValidEvents() {
    return [
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
      'error',
    ]
  },
}

export default SocketService
