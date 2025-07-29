<template>
  <main class="full-width bg-gradient-primary" aria-label="Jouer à la session de quiz">
    <section class="q-pa-lg rounded-borders-bottom">
      <div class="row justify-center">
        <div class="col-12 col-md-10">
          <div class="row items-center q-gutter-md">
            <div class="col">
              <h1 class="text-h4 text-secondary text-weight-bold q-mb-sm">
                {{ session?.quiz?.title }}
              </h1>
              <div class="row q-gutter-sm items-center">
                <q-chip color="secondary" text-color="primary" icon="quiz">
                  Question {{ currentQuestionIndex + 1 }} / {{ totalQuestions }}
                </q-chip>
                <q-chip color="accent" text-color="secondary" icon="people">
                  {{ participantsCount }} participants
                </q-chip>
              </div>
            </div>

            <!-- Timer -->
            <div class="col-auto">
              <q-circular-progress
                v-if="timeRemaining > 0"
                :value="timeProgress"
                size="80px"
                :thickness="0.15"
                color="negative"
                track-color="grey-3"
                class="q-ma-md"
              >
                <div class="text-h6 text-secondary text-weight-bold">
                  {{ Math.ceil(timeRemaining / 1000) }}
                </div>
              </q-circular-progress>
              <div v-else class="text-center q-pa-md">
                <q-icon name="timer_off" size="40px" color="grey-5" />
                <div class="text-caption text-grey-6">Temps écoulé</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Zone de jeu principale -->
    <section class="q-pa-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <!-- État d'attente -->
          <div v-if="gameState === 'waiting'" class="text-center">
            <div class="bg-white rounded-borders q-pa-xl shadow-8">
              <q-spinner-dots size="3rem" color="secondary" class="q-mb-lg" />
              <h2 class="text-h5 text-secondary text-weight-bold q-mb-md">
                En attente du démarrage...
              </h2>
              <p class="text-body1 text-grey-7">L'organisateur va bientôt lancer le quiz</p>
            </div>
          </div>

          <!-- État de chargement -->
          <div v-else-if="gameState === 'loading'" class="text-center">
            <div class="bg-white rounded-borders q-pa-xl shadow-8">
              <q-spinner-hourglass size="3rem" color="secondary" class="q-mb-lg" />
              <h2 class="text-h5 text-secondary text-weight-bold q-mb-md">Chargement du quiz...</h2>
              <p class="text-body1 text-grey-7">Récupération des questions en cours</p>
            </div>
          </div>

          <!-- Quiz terminé -->
          <div v-else-if="gameState === 'finished'" class="text-center">
            <div class="bg-white rounded-borders q-pa-xl shadow-8">
              <q-icon name="flag_circle" size="4rem" color="positive" class="q-mb-lg" />
              <h2 class="text-h5 text-secondary text-weight-bold q-mb-md">Quiz terminé !</h2>

              <!-- Score final -->
              <div class="q-mb-lg">
                <div class="text-h3 text-primary text-weight-bold q-mb-sm">
                  {{ participantState?.totalScore }} points
                </div>
                <div class="text-body1 text-grey-7">
                  {{ participantState?.correctAnswers }} bonnes réponses
                </div>
              </div>

              <!-- Classement final -->
              <QuizFinalRanking :leaderboard="leaderboard" />

              <!-- Bouton d'action -->
              <div class="row q-gutter-md justify-center">
                <q-btn
                  outline
                  color="secondary"
                  icon="home"
                  label="Retour à l'accueil"
                  @click="goHome"
                />
              </div>
            </div>
          </div>

          <!-- Question active -->
          <div v-else-if="gameState === 'playing' && currentQuestion">
            <QuizQuestion
              :question="currentQuestion"
              :question-number="currentQuestionIndex + 1"
              :total-questions="totalQuestions"
              :disabled="hasAnswered || timeRemaining <= 0"
              @answer-selected="onAnswerSelected"
              @answer-changed="onAnswerChanged"
            />

            <!-- submit -->
            <div class="text-center q-mt-lg">
              <q-btn
                color="positive"
                icon="send"
                :label="hasAnswered ? 'Réponse validée' : 'Valider ma réponse'"
                :disable="hasAnswered ? true : false"
                @click="submitCurrentAnswer"
                :loading="submitting"
              />
            </div>
          </div>

          <!-- En attente de la prochaine question -->
          <div v-else-if="gameState === 'waitingNextQuestion'" class="text-center">
            <div class="bg-white rounded-borders q-pa-xl shadow-8">
              <q-spinner-clock size="3rem" color="secondary" class="q-mb-lg" />
              <h2 class="text-h5 text-secondary text-weight-bold q-mb-md">
                En attente de la prochaine question...
              </h2>
              <p class="text-body1 text-grey-7">L'organisateur prépare la suite</p>
            </div>
          </div>

          <!-- État d'erreur -->
          <div v-else-if="gameState === 'error'" class="text-center">
            <div class="bg-white rounded-borders q-pa-xl shadow-8">
              <q-icon name="error" size="4rem" color="negative" class="q-mb-lg" />
              <h2 class="text-h5 text-secondary text-weight-bold q-mb-md">Erreur de connexion</h2>
              <p class="text-body1 text-grey-7 q-mb-lg">{{ errorMessage }}</p>
              <q-btn color="primary" icon="refresh" label="Réessayer" @click="retry" outline />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Panneau latéral du classement (organisateur) -->
    <OrganizerPanel
      v-if="isOrganizer"
      v-model="showOrganizerPanel"
      :session="session"
      :is-last-question="isLastQuestion"
      :leaderboard="leaderboard"
      :loading-next="loadingNext"
      :ending="ending"
      @nextQuestion="nextQuestion"
      @endSession="endSession"
    />

    <!-- Bouton flottant pour organisateur -->
    <q-page-sticky v-if="isOrganizer" position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="settings"
        color="secondary"
        @click="showOrganizerPanel = !showOrganizerPanel"
      />
    </q-page-sticky>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import OrganizerPanel from 'src/components/OrganizerPanel.vue'
import QuizFinalRanking from 'src/components/QuizFinalRanking.vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import QuizService from 'src/services/QuizService'
import UserService from 'src/services/UserService'
import QuizQuestion from 'src/components/QuizQuestion.vue'
import SocketService from 'src/services/SocketService'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

// Props
const sessionId = computed(() => route.params.sessionId)

// State
const session = ref(null)
const currentUser = ref(null)
const currentQuestion = ref(null)
const participantState = ref(null)
const leaderboard = ref([])
const gameState = ref('loading') // loading, waiting, playing, waitingNextQuestion, finished, error
const errorMessage = ref('')
const maximizedToggle = ref(false)

// Question/Answer state
const currentQuestionIndex = ref(0)
const totalQuestions = ref(0)
const participantsCount = ref(0)
const hasAnswered = ref(false)
const canSubmit = ref(false)
const currentAnswer = ref(null)
const lastResult = ref(null)
const submitting = ref(false)

// Timer
const timeRemaining = ref(0)
const timeLimit = ref(30000)
const timerInterval = ref(null)

// Organisateur
const showOrganizerPanel = ref(false)
const loadingNext = ref(false)
const ending = ref(false)
const showLeaderboardDialog = ref(false)

// WebSocket connection
const socketConnected = ref(false)
const realTimeSync = ref(true)

// Computed
const isOrganizer = computed(() => {
  if (!currentUser.value || !session.value) return false
  return currentUser.value._id === session.value.organizerId
})

const timeProgress = computed(() => {
  if (timeLimit.value === 0) return 0
  return Math.max(0, (timeRemaining.value / timeLimit.value) * 100)
})

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value >= totalQuestions.value - 1
})

// Methods
const loadSession = async () => {
  try {
    const response = await QuizService.getSessionState(sessionId.value)
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
      QuizService.getParticipantState(sessionId.value),
      QuizService.getSessionLeaderboard(sessionId.value),
    ])

    participantState.value = stateResponse.data.participant
    console.log('Participant state:', participantState.value)
    leaderboard.value = leaderboardResponse.data.leaderboard
  } catch (error) {
    console.error('Erreur chargement résultats:', error)
  }
}

const onAnswerSelected = (answerData) => {
  currentAnswer.value = answerData
  canSubmit.value = answerData.hasAnswered
}

const onAnswerChanged = (hasAnswer) => {
  canSubmit.value = hasAnswer
}

const submitCurrentAnswer = async () => {
  if (!currentAnswer.value || submitting.value) return

  try {
    submitting.value = true

    // Utiliser WebSocket pour soumettre la réponse
    if (socketConnected.value) {
      SocketService.submitAnswer(
        sessionId.value,
        currentQuestion.value.id,
        currentAnswer.value.answer,
      )
      // Le résultat sera reçu via l'événement WebSocket
      hasAnswered.value = true
      canSubmit.value = false
    } else {
      // Fallback HTTP
      const response = await QuizService.submitSessionAnswer(
        sessionId.value,
        currentQuestion.value.id,
        currentAnswer.value.answer,
      )

      hasAnswered.value = true
      canSubmit.value = false
      lastResult.value = response.data

      if (participantState.value) {
        participantState.value.totalScore = response.data.totalScore
      }
    }
  } catch (error) {
    console.error('Erreur soumission réponse:', error)
    $q.notify({
      type: 'negative',
      position: 'top',
      message: error.message || "Erreur lors de l'envoi",
    })
  } finally {
    submitting.value = false
  }
}

const nextQuestion = async () => {
  if (!isOrganizer.value) return

  try {
    loadingNext.value = true

    // Utiliser WebSocket pour passer à la question suivante
    if (socketConnected.value) {
      SocketService.nextQuestion(sessionId.value)
      // La réponse sera gérée via les événements WebSocket
    } else {
      // Fallback HTTP
      await QuizService.nextSessionQuestion(sessionId.value)
      hasAnswered.value = false
      canSubmit.value = false
      currentAnswer.value = null
      lastResult.value = null
    }
  } catch (error) {
    console.error('Erreur question suivante:', error)
    $q.notify({
      type: 'negative',
      position: 'top',
      message: 'Erreur lors du passage à la question suivante',
    })
  } finally {
    loadingNext.value = false
  }
}

const endSession = async () => {
  if (!isOrganizer.value) return

  try {
    ending.value = true

    // Utiliser WebSocket pour terminer la session
    if (socketConnected.value) {
      SocketService.endSession(sessionId.value)
      // La fin sera gérée via les événements WebSocket
    } else {
      // Fallback HTTP
      await QuizService.endGameSession(sessionId.value)
      gameState.value = 'finished'
      await loadFinalResults()
    }
  } catch (error) {
    console.error('Erreur fin de session:', error)
    $q.notify({
      type: 'negative',
      position: 'top',
      message: 'Erreur lors de la fin de session',
    })
  } finally {
    ending.value = false
  }
}

const showLeaderboard = () => {
  showLeaderboardDialog.value = true
}

const goHome = () => {
  router.push('/accueil')
}

const setupGameSocketListeners = () => {
  // Réception de la question courante
  SocketService.onGameCurrentQuestion((data) => {
    currentQuestion.value = data.question
    currentQuestionIndex.value = data.gameState.currentQuestionIndex
    totalQuestions.value = data.gameState.totalQuestions

    // Configurer le timer
    timeLimit.value = data.question.timeLimit * 1000
    timeRemaining.value = data.timeRemaining || timeLimit.value

    // Réinitialiser l'état de la question
    hasAnswered.value = false
    canSubmit.value = false
    currentAnswer.value = null

    startTimer()
    gameState.value = 'playing'
  })

  // Résultat de la réponse soumise
  SocketService.onGameAnswerResult((result) => {
    lastResult.value = result

    if (participantState.value) {
      participantState.value.totalScore = result.totalScore
    }
  })

  // Mise à jour du classement en temps réel
  SocketService.onGameLeaderboardUpdated((data) => {
    leaderboard.value = data.leaderboard
    participantsCount.value = data.leaderboard.length
  })

  // SocketService.onGameParticipantAnswered((data) => {
  //   if (isOrganizer.value) {
  //     $q.notify({
  //       type: 'info',
  //       message: `${data.userName} a répondu ${data.isCorrect ? 'correctement' : 'incorrectement'}`,
  //       timeout: 2000,
  //     })
  //   }
  // })

  // Nouvelle question
  SocketService.onGameNewQuestion((data) => {
    gameState.value = 'waitingNextQuestion'

    // Réinitialiser l'état
    hasAnswered.value = false
    canSubmit.value = false
    currentAnswer.value = null
    lastResult.value = null
    loadingNext.value = false

    // La nouvelle question arrivera via game:current-question
  })

  // Temps écoulé
  SocketService.onGameTimeUp((data) => {
    timeRemaining.value = 0
    canSubmit.value = false

    // Arrêter le timer local
    stopTimer()

    $q.notify({
      type: 'info',
      position: 'top',
      message: 'Temps écoulé ! Passage automatique à la question suivante...',
    })

    gameState.value = 'waitingNextQuestion'
  })

  // Temps écoulé (pour l'organisateur) - Maintenant en mode automatique
  // SocketService.onGameTimeUpOrganizer((data) => {
  //   if (isOrganizer.value) {
  //     $q.notify({
  //       type: 'info',
  //       position: 'top',
  //       message: 'Temps écoulé ! Passage automatique en cours...',
  //     })
  //   }
  // })

  // Session terminée
  SocketService.onGameSessionEnded((data) => {
    gameState.value = 'finished'
    leaderboard.value = data.finalLeaderboard || []

    // Arrêter le timer
    stopTimer()

    $q.notify({
      type: 'positive',
      position: 'top',
      message: 'Quiz terminée !',
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

const formatCorrectAnswer = (answer) => {
  if (Array.isArray(answer)) {
    return answer.join(', ')
  }
  return String(answer)
}

// Timer
const startTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }

  timerInterval.value = setInterval(() => {
    timeRemaining.value = Math.max(0, timeRemaining.value - 100)

    if (timeRemaining.value <= 0) {
      clearInterval(timerInterval.value)
      if (!hasAnswered.value) {
        canSubmit.value = false
      }
    }
  }, 100)
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
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
  stopTimer()
})

// Watcher pour les changements d'état de session
watch(
  () => session.value?.status,
  (newStatus) => {
    if (newStatus === 'finished') {
      gameState.value = 'finished'
      // stopPolling()
      stopTimer()
      loadFinalResults()
    }
  },
)
</script>

<style scoped>
.full-width {
  width: 100%;
}

.rounded-borders-bottom {
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}
</style>
