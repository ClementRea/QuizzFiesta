import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import SessionService from 'src/services/SessionService'
import UserService from 'src/services/UserService'
import SocketService from 'src/services/SocketService'

/**
 * Composable pour gérer l'état et la logique d'une session de jeu
 * Extrait de SessionPlayPage.vue pour réutilisabilité
 */
export function useGameSession(sessionId, onSocketConnected = null) {
  const $q = useQuasar()

  // État de la session
  const session = ref(null)
  const currentUser = ref(null)
  const currentQuestion = ref(null)
  const participantState = ref(null)
  const leaderboard = ref([])

  // États de jeu
  const gameState = ref('loading') // loading, waiting, playing, waitingNextQuestion, finished, error
  const errorMessage = ref('')
  const currentQuestionIndex = ref(0)
  const totalQuestions = ref(0)
  const participantsCount = ref(0)

  // État WebSocket
  const socketConnected = ref(false)

  // Computed
  const isOrganizer = computed(() => {
    if (!currentUser.value || !session.value) return false
    return currentUser.value._id === session.value.organizerId
  })

  const isLastQuestion = computed(() => {
    return currentQuestionIndex.value >= totalQuestions.value - 1
  })

  // Méthodes principales
  const loadSession = async () => {
    try {
      const response = await SessionService.getSessionState(sessionId.value)
      session.value = response.data.session

      if (session.value.status === 'finished') {
        gameState.value = 'finished'
        await loadFinalResults()
        return
      }

      if (session.value.status === 'playing') {
        await initializeGameSocket()
      } else {
        gameState.value = 'waiting'
      }
    } catch (error) {
      console.error('Erreur chargement session:', error)
      gameState.value = 'error'
      errorMessage.value = error.message || 'Erreur de connexion'
    }
  }

  const initializeGameSocket = async () => {
    try {
      // Connecter le socket et attendre la connexion
      const socket = await SocketService.connect()
      if (!socket) {
        throw new Error('Impossible de se connecter au serveur')
      }

      // Configurer les événements WebSocket
      setupGameSocketListeners()

      // Appeler le callback pour initialiser les autres listeners
      if (onSocketConnected) {
        onSocketConnected()
      }

      // Rejoindre la session de jeu
      SocketService.joinGame(sessionId.value)

      socketConnected.value = true
      gameState.value = 'playing'
    } catch (error) {
      console.error('Erreur connexion socket jeu:', error)
      gameState.value = 'error'
      errorMessage.value = 'Impossible de se connecter au jeu'
      socketConnected.value = false
    }
  }

  const loadFinalResults = async () => {
    try {
      const [stateResponse, leaderboardResponse] = await Promise.all([
        SessionService.getParticipantState(sessionId.value),
        SessionService.getSessionLeaderboard(sessionId.value),
      ])

      participantState.value = stateResponse.data.participant
      leaderboard.value = leaderboardResponse.data.leaderboard
    } catch (error) {
      console.error('Erreur chargement résultats:', error)
    }
  }

  const setupGameSocketListeners = () => {
    // Réception de la question courante
    SocketService.onGameCurrentQuestion((data) => {
      currentQuestion.value = data.question
      currentQuestionIndex.value = data.gameState.currentQuestionIndex
      totalQuestions.value = data.gameState.totalQuestions

      gameState.value = 'playing'
    })

    // Mise à jour du classement en temps réel
    SocketService.onGameLeaderboardUpdated((data) => {
      leaderboard.value = data.leaderboard
      participantsCount.value = data.leaderboard.length
    })

    // Nouvelle question
    SocketService.onGameNewQuestion((data) => {
      gameState.value = 'waitingNextQuestion'
    })

    // Session terminée
    SocketService.onGameSessionEnded((data) => {
      gameState.value = 'finished'
      leaderboard.value = data.finalLeaderboard || []

      $q.notify({
        type: 'positive',
        position: 'top',
        message: 'Quiz terminé !',
      })

      // Charger les résultats finaux
      loadFinalResults()
    })

    // Erreurs
    SocketService.onError((error) => {
      console.error('Erreur Socket jeu:', error)
      $q.notify({
        type: 'negative',
        position: 'top',
        message: error.message || 'Erreur de connexion',
      })
    })
  }

  const retry = () => {
    gameState.value = 'loading'
    loadSession()
  }

  // Nettoyage WebSocket
  const cleanupGameSocket = () => {
    if (socketConnected.value) {
      SocketService.removeAllListeners()
      SocketService.disconnect()
      socketConnected.value = false
    }
  }

  // Lifecycle
  onMounted(async () => {
    try {
      // Charger l'utilisateur actuel
      const userResponse = await UserService.getMe()
      currentUser.value = userResponse.data.user

      // Charger la session
      await loadSession()
    } catch (error) {
      console.error('Erreur initialisation:', error)
      gameState.value = 'error'
      errorMessage.value = "Erreur d'initialisation"
    }
  })

  onUnmounted(() => {
    cleanupGameSocket()
  })

  return {
    // État
    session,
    currentUser,
    currentQuestion,
    participantState,
    leaderboard,
    gameState,
    errorMessage,
    currentQuestionIndex,
    totalQuestions,
    participantsCount,
    socketConnected,

    // Computed
    isOrganizer,
    isLastQuestion,

    // Méthodes
    loadSession,
    loadFinalResults,
    retry,
    cleanupGameSocket,
  }
}
