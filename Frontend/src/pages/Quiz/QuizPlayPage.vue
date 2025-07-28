<template>
  <main class="full-width bg-gradient-primary" aria-label="Jouer au quiz">
    <!-- Header avec infos du quiz -->
    <section class="q-pa-lg rounded-borders-bottom">
      <div class="row justify-center">
        <div class="col-12 col-md-10">
          <div class="row items-center q-gutter-md">
            <!-- Info du quiz -->
            <div class="col">
              <h1 class="text-h4 text-secondary text-weight-bold q-mb-sm">
                {{ quizData?.title || 'Quiz en cours' }}
              </h1>
              <div class="row q-gutter-sm items-center">
                <q-chip dense color="secondary" text-color="primary" icon="quiz">
                  Question {{ currentQuestionIndex + 1 }} / {{ totalQuestions }}
                </q-chip>
                <q-chip dense color="accent" text-color="secondary" icon="people">
                  {{ participantsCount }} participants
                </q-chip>
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

          <!-- Attente des autres participants -->
          <div v-else-if="gameState === 'waiting_others'" class="text-center">
            <div class="bg-white rounded-borders q-pa-xl shadow-8">
              <q-icon name="hourglass_empty" size="3rem" color="orange" class="q-mb-lg" />
              <h2 class="text-h5 text-secondary text-weight-bold q-mb-md">Réponse envoyée !</h2>
              <p class="text-body1 text-grey-7 q-mb-md">
                En attente que tous les participants répondent...
              </p>
            </div>
          </div>

          <!-- Jeu en cours -->
          <div v-else-if="gameState === 'playing'" class="q-gutter-lg">
            <!-- Timer Component -->
            <QuizTimer
              :total-time="currentQuestion?.timeLimit || 30"
              :time-left="timeLeft"
              title="Temps restant"
              @time-up="onTimeUp"
            />

            <!-- Question Component -->
            <QuizQuestion
              v-if="currentQuestion"
              :question="currentQuestion"
              :question-number="currentQuestionIndex + 1"
              :total-questions="totalQuestions"
              :disabled="hasSubmittedAnswer"
              @answer-selected="onAnswerSelected"
              ref="questionComponent"
            />

            <!-- Bouton de validation -->
            <div class="text-center q-mt-xl">
              <q-btn
                label="Valider ma réponse"
                color="secondary"
                text-color="primary"
                size="lg"
                rounded
                unelevated
                :disable="!hasAnswered"
                @click="submitAnswer"
                class="q-px-xl shadow-4"
              />
            </div>
          </div>

          <!-- Résultats intermédiaires -->
          <div v-else-if="gameState === 'question_results'" class="text-center">
            <div class="bg-white rounded-borders q-pa-xl shadow-8">
              <div class="q-mb-lg">
                <q-icon
                  :name="lastAnswerCorrect ? 'check_circle' : 'cancel'"
                  :color="lastAnswerCorrect ? 'positive' : 'negative'"
                  size="4rem"
                />
              </div>
              <h2
                class="text-h5 text-weight-bold q-mb-md"
                :class="lastAnswerCorrect ? 'text-positive' : 'text-negative'"
              >
                {{ lastAnswerCorrect ? 'Bonne réponse !' : 'Réponse incorrecte' }}
              </h2>
              <div class="text-body1 text-grey-7 q-mb-lg">
                {{ lastAnswerCorrect ? `+${lastQuestionPoints} points` : '0 points' }}
              </div>
              <div class="text-caption text-grey-6">
                Prochaine question dans quelques secondes...
              </div>
            </div>
          </div>

          <!-- Quiz terminé -->
          <div v-else-if="gameState === 'finished'" class="text-center">
            <QuizScoreRecap
              :final-score="finalScore"
              :total-questions="totalQuestions"
              :questions-results="questionsResults"
              :current-rank="currentRank"
              :total-participants="participantsCount"
              @show-leaderboard="showFullLeaderboard = true"
              @go-home="goToHome"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Leaderboard Dialog -->
    <QuizLeaderboard
      v-model="showFullLeaderboard"
      :participants="leaderboardParticipants"
      :current-user-id="currentUserId"
      :total-questions="totalQuestions"
      @play-again="playAgain"
      @go-home="goToHome"
    />
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import QuizTimer from 'src/components/QuizTimer.vue'
import QuizQuestion from 'src/components/QuizQuestion.vue'
import QuizScoreRecap from 'src/components/QuizScoreRecap.vue'
import QuizLeaderboard from 'src/components/QuizLeaderboard.vue'
import QuizService from 'src/services/QuizService.js'
import UserService from 'src/services/UserService.js'
import AuthService from 'src/services/AuthService.js'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

// Props de la route
const quizId = route.params.id

// État du jeu
const gameState = ref('loading')
const quizData = ref(null)
const questionsData = ref([])
const currentQuestionIndex = ref(0)
const currentQuestion = ref(null)
const timeLeft = ref(30)
const totalQuestions = ref(0)
const participantsCount = ref(1)

// États de synchronisation
const allParticipantsAnswered = ref(false)
const hasSubmittedAnswer = ref(false)

// Score et réponses
const currentScore = ref(0)
const finalScore = ref(0)
const lastAnswerCorrect = ref(false)
const lastQuestionPoints = ref(0)
const currentAnswer = ref(null)
const questionsResults = ref([])
const currentRank = ref(1)
const leaderboardParticipants = ref([])
const currentUserId = ref('')

// UI state
const showFullLeaderboard = ref(false)
const questionComponent = ref(null)

// Timer
let timerInterval = null

// SSE for real-time sync
let gameEventSource = null

// Computed properties

const hasAnswered = computed(() => {
  return currentAnswer.value !== null && !hasSubmittedAnswer.value
})

// Methods - Timer events
const onTimeUp = async () => {
  if (gameState.value === 'playing' && !hasSubmittedAnswer.value) {
    // Soumettre automatiquement la réponse (même vide)
    await submitAnswer()

    // Attendre un peu pour montrer le résultat puis passer à la question suivante
    setTimeout(async () => {
      try {
        const result = await QuizService.nextQuestion(quizId)
        if (result.data.gameStatus === 'finished') {
          // Quiz terminé
          gameState.value = 'finished'
          finalScore.value = currentScore.value
          loadLeaderboard()
        } else {
          // Passer à la question suivante
          currentQuestionIndex.value = result.data.currentQuestionIndex
          await loadQuestion()
          gameState.value = 'playing'
        }
      } catch (error) {
        console.error('Erreur passage question suivante:', error)
      }
    }, 2000)
  }
}

// Methods - Question events
const onAnswerSelected = (answerData) => {
  currentAnswer.value = answerData.answer
}

const submitAnswer = async () => {
  if (hasSubmittedAnswer.value) return

  try {
    // Arrêter le timer
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    // Récupérer la réponse du composant
    let answer = currentAnswer.value
    if (!answer && questionComponent.value) {
      answer = questionComponent.value.getSelectedAnswer()
    }

    if (answer === null || answer === undefined) {
      $q.notify({
        type: 'warning',
        message: 'Veuillez sélectionner une réponse',
        position: 'top',
      })
      return
    }

    // Marquer comme soumis pour éviter les doublons
    hasSubmittedAnswer.value = true

    // Envoyer la réponse au backend
    const result = await QuizService.submitAnswer(quizId, currentQuestion.value._id, answer)

    // Mettre à jour le score
    lastAnswerCorrect.value = result.data.isCorrect
    lastQuestionPoints.value = result.data.points
    currentScore.value = result.data.totalScore

    // Enregistrer le résultat pour le récapitulatif
    questionsResults.value.push({
      title: currentQuestion.value.title,
      type: currentQuestion.value.type,
      userAnswer: answer,
      isCorrect: result.data.isCorrect,
      points: result.data.points,
      correctAnswer: result.data.correctAnswer, // Sera fourni par le backend
    })

    $q.notify({
      type: 'positive',
      message: 'Réponse validée !',
      position: 'top',
      timeout: 2000,
    })

    gameState.value = 'waiting_others'
  } catch (error) {
    console.error('Erreur soumission réponse:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la soumission de la réponse',
      position: 'top',
    })
    hasSubmittedAnswer.value = false
  }
}

const nextQuestion = async () => {
  currentQuestionIndex.value++

  if (currentQuestionIndex.value >= totalQuestions.value) {
    // Quiz terminé
    gameState.value = 'finished'
    finalScore.value = currentScore.value
    // Charger le classement
    await loadLeaderboard()
    return
  }

  // Charger la question suivante
  loadQuestion()
  gameState.value = 'playing'
  currentAnswer.value = null
}

const loadQuestion = async () => {
  if (!questionsData.value || questionsData.value.length === 0) {
    console.error('Aucune question disponible')
    return
  }

  if (currentQuestionIndex.value >= questionsData.value.length) {
    // Quiz terminé
    gameState.value = 'finished'
    finalScore.value = currentScore.value
    loadLeaderboard()
    return
  }

  // Charger la question actuelle
  currentQuestion.value = questionsData.value[currentQuestionIndex.value]

  // Réinitialiser les états
  hasSubmittedAnswer.value = false
  allParticipantsAnswered.value = false
  currentAnswer.value = null

  // Récupérer l'état du jeu depuis le serveur pour synchroniser le timer
  try {
    const gameStateResponse = await QuizService.getGameState(quizId)
    if (
      gameStateResponse.data &&
      gameStateResponse.data.currentParticipant &&
      gameStateResponse.data.currentParticipant.timeLeft !== undefined &&
      gameStateResponse.data.currentParticipant.timeLeft > 0
    ) {
      timeLeft.value = gameStateResponse.data.currentParticipant.timeLeft
    } else {
      timeLeft.value = currentQuestion.value.timeLimit || 30
    }
  } catch (error) {
    console.error('Erreur récupération état du jeu:', error)
    timeLeft.value = currentQuestion.value.timeLimit || 30
  }

  startTimer()
}

const startTimer = () => {
  // Nettoyer le timer précédent s'il existe
  if (timerInterval) {
    clearInterval(timerInterval)
  }

  timerInterval = setInterval(() => {
    timeLeft.value--

    if (timeLeft.value <= 0) {
      clearInterval(timerInterval)
      timerInterval = null
      // Le timer se charge d'émettre l'événement timeUp
    }
  }, 1000)
}

const initializeGame = async () => {
  try {
    gameState.value = 'loading'

    // Récupérer les questions du quiz depuis le backend
    const result = await QuizService.getQuizQuestions(quizId)

    quizData.value = result.data.quiz
    questionsData.value = result.data.questions
    totalQuestions.value = questionsData.value.length

    if (result.data.participant) {
      currentScore.value = result.data.participant.totalScore
      currentQuestionIndex.value = result.data.participant.currentQuestionIndex
    }

    gameState.value = 'playing'
    await loadQuestion()

    connectToGameEvents()
  } catch (error) {
    console.error('Erreur initialisation jeu:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement du quiz',
      position: 'top',
    })

    router.push('/accueil')
  }
}

const connectToGameEvents = () => {
  try {
    const token = AuthService.getAccessToken()
    const baseUrl =
      window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin
    gameEventSource = new EventSource(`${baseUrl}/api/quiz/${quizId}/game/events?token=${token}`)

    gameEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleGameEvent(data)
      } catch (error) {
        console.error('Erreur parsing événement SSE:', error)
      }
    }

    gameEventSource.onerror = (error) => {
      console.error('Erreur connexion SSE:', error)
    }
  } catch (error) {
    console.error('Erreur initialisation SSE:', error)
  }
}

const handleGameEvent = (event) => {
  switch (event.type) {
    case 'all_answered':
      allParticipantsAnswered.value = true

      setTimeout(() => {
        nextQuestion()
      }, 3000)
      break

    case 'participant_answered':
      participantsCount.value = event.participantsCount || participantsCount.value
      break

    case 'quiz_finished':
      gameState.value = 'finished'
      finalScore.value = currentScore.value
      loadLeaderboard()
      break

    default:
  }
}

// Navigation methods
const goToHome = () => {
  router.push('/accueil')
}

const playAgain = () => {
  window.location.reload()
}

const loadLeaderboard = async () => {
  try {
    const result = await QuizService.getGameState(quizId)
    leaderboardParticipants.value = result.data.participants

    const userIndex = leaderboardParticipants.value.findIndex(
      (p) => p.userId === currentUserId.value,
    )
    currentRank.value = userIndex !== -1 ? userIndex + 1 : 1
  } catch (error) {
    console.error('Erreur chargement leaderboard:', error)
  }
}

onMounted(async () => {
  try {
    const currentUser = await UserService.getMe()
    currentUserId.value = currentUser.data.user._id
  } catch (error) {
    console.error('Erreur chargement utilisateur:', error)
  }

  initializeGame()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  if (gameEventSource) {
    gameEventSource.close()
    gameEventSource = null
  }
})
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #f5f2e8 0%, #ece8d2 100%);
  min-height: 100vh;
}

.rounded-borders-bottom {
  border-radius: 0 0 2rem 2rem;
}

.rounded-borders {
  border-radius: 1rem;
}

.answer-option {
  transition: all 0.3s ease;
}

.answer-option:hover .hover-shadow {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.order-item {
  transition: all 0.3s ease;
}

.order-item:hover {
  transform: translateY(-2px);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.q-linear-progress {
  animation: pulse 2s infinite;
}
</style>
