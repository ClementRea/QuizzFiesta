import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import SessionService from 'src/services/SessionService'
import UserService from 'src/services/UserService'
import SocketService from 'src/services/SocketService'
import QuizService from 'src/services/QuizService'

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
      console.log('🎮 Chargement session:', sessionId.value)
      const response = await SessionService.getSessionState(sessionId.value)
      session.value = response.data.session
      console.log('📊 État session reçu:', session.value.status, session.value)

      if (session.value.status === 'finished') {
        console.log('🏁 Session terminée, chargement résultats')
        gameState.value = 'finished'
        await loadFinalResults()
        return
      }

      if (session.value.status === 'playing') {
        console.log('🎯 Session en cours, initialisation WebSocket')
        await initializeGameSocket()
      } else {
        console.log('⏳ Session en attente, statut:', session.value.status)
        gameState.value = 'waiting'
      }
    } catch (error) {
      console.error('❌ Erreur chargement session:', error)
      gameState.value = 'error'
      errorMessage.value = error.message || 'Erreur de connexion'
    }
  }

  const initializeGameSocket = async () => {
    try {
      console.log('🔌 Connexion WebSocket...')
      // Connecter le socket et attendre la connexion
      const socket = await SocketService.connect()
      if (!socket) {
        throw new Error('Impossible de se connecter au serveur')
      }
      console.log('✅ WebSocket connecté')

      // Configurer les événements WebSocket
      console.log('⚙️ Configuration des listeners WebSocket')
      setupGameSocketListeners()

      // Appeler le callback pour initialiser les autres listeners
      if (onSocketConnected) {
        console.log('🔧 Initialisation listeners additionnels')
        onSocketConnected()
      }

      // Rejoindre la session de jeu
      console.log('🎮 Rejoindre session de jeu:', sessionId.value)
      SocketService.joinGame(sessionId.value)

      socketConnected.value = true
      gameState.value = 'playing'
      console.log('🎯 État de jeu initialisé: playing')
      
      // Fallback : charger les questions via HTTP si WebSocket ne les envoie pas
      console.log('📥 Chargement questions via HTTP (fallback)')
      await loadCurrentQuestion()
    } catch (error) {
      console.error('❌ Erreur connexion socket jeu:', error)
      gameState.value = 'error'
      errorMessage.value = 'Impossible de se connecter au jeu'
      socketConnected.value = false
    }
  }

  const loadCurrentQuestion = async () => {
    try {
      console.log('🔄 Récupération question courante session via HTTP')
      const response = await SessionService.getSessionQuestions(sessionId.value)
      
      // Backend retourne {question, gameState, participant}
      const questionData = response.data.question
      const gameStateData = response.data.gameState
      
      console.log('📝 Question reçue:', questionData ? 'Oui' : 'Non')
      
      if (questionData) {
        currentQuestion.value = questionData
        currentQuestionIndex.value = gameStateData.currentQuestionIndex || 0
        totalQuestions.value = gameStateData.totalQuestions || 1
        console.log('✅ Question courante chargée:', (currentQuestionIndex.value + 1), '/', totalQuestions.value)
      } else {
        console.log('❌ Aucune question trouvée')
      }
    } catch (error) {
      console.error('❌ Erreur chargement question:', error)
      // Essayer d'obtenir les questions depuis le quiz directement si l'utilisateur n'est pas encore participant
      if (error.response?.status === 403) {
        console.log('🔄 Tentative de récupération des questions depuis le quiz')
        await loadQuestionsFromQuiz()
      }
    }
  }

  const loadQuestionsFromQuiz = async () => {
    try {
      if (!session.value?.quizId) return

      console.log('📥 Récupération questions depuis le quiz:', session.value.quizId)
      const response = await QuizService.getQuizById(session.value.quizId)
      const quiz = response.data.quiz
      
      if (quiz && quiz.questions && quiz.questions.length > 0) {
        const gameState_local = session.value.gameState || {}
        const questionIndex = gameState_local.currentQuestionIndex || 0
        
        currentQuestion.value = quiz.questions[questionIndex]
        currentQuestionIndex.value = questionIndex
        totalQuestions.value = quiz.questions.length
        console.log('✅ Question depuis quiz chargée:', (questionIndex + 1), '/', quiz.questions.length)
      }
    } catch (error) {
      console.error('❌ Erreur chargement questions depuis quiz:', error)
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

      // Notification gérée automatiquement par l'intercepteur global
      console.log('Quiz terminé !')

      // Charger les résultats finaux
      loadFinalResults()
    })

    // Erreurs
    SocketService.onError((error) => {
      console.error('Erreur Socket jeu:', error)
      // Erreur gérée automatiquement par l'intercepteur global
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
