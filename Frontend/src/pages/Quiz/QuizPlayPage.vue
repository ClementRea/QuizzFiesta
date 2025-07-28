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

            <!-- Score actuel -->
            <div class="col-auto text-right">
              <div class="text-h5 text-secondary text-weight-bold">{{ currentScore }} pts</div>
              <div class="text-caption text-grey-7">Votre score</div>
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
              <h2 class="text-h5 text-secondary text-weight-bold q-mb-md">
                Chargement du quiz...
              </h2>
              <p class="text-body1 text-grey-7">
                Récupération des questions en cours
              </p>
            </div>
          </div>

          <!-- Attente des autres participants -->
          <div v-else-if="gameState === 'waiting_others'" class="text-center">
            <div class="bg-white rounded-borders q-pa-xl shadow-8">
              <q-icon name="hourglass_empty" size="3rem" color="orange" class="q-mb-lg" />
              <h2 class="text-h5 text-secondary text-weight-bold q-mb-md">
                Réponse envoyée !
              </h2>
              <p class="text-body1 text-grey-7 q-mb-md">
                En attente que tous les participants répondent...
              </p>
              <div v-if="lastAnswerCorrect !== null" class="q-mb-lg">
                <q-icon 
                  :name="lastAnswerCorrect ? 'check_circle' : 'cancel'"
                  :color="lastAnswerCorrect ? 'positive' : 'negative'"
                  size="2rem"
                />
                <div class="text-body1 q-mt-sm" :class="lastAnswerCorrect ? 'text-positive' : 'text-negative'">
                  {{ lastAnswerCorrect ? `Bonne réponse ! +${lastQuestionPoints} points` : 'Réponse incorrecte' }}
                </div>
              </div>
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
              @warning="onTimeWarning"
              @urgent="onTimeUrgent"
            />

            <!-- Question Component -->
            <QuizQuestion
              v-if="currentQuestion"
              :question="currentQuestion"
              :question-number="currentQuestionIndex + 1"
              :total-questions="totalQuestions"
              :disabled="hasSubmittedAnswer"
              @answer-selected="onAnswerSelected"
              @answer-changed="onAnswerChanged"
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
import AuthService from 'src/services/AuthService.js'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

// Props de la route
const quizId = route.params.id

// État du jeu
const gameState = ref('loading') // 'loading', 'waiting', 'playing', 'question_results', 'finished'
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
const selectedAnswers = ref([])
const shuffledOrderItems = ref([])
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
const onTimeUp = () => {
  console.log('Temps écoulé !')
  if (gameState.value === 'playing') {
    submitAnswer()
  }
}

const onTimeWarning = (timeRemaining) => {
  console.log('Attention, plus que', timeRemaining, 'secondes !')
  $q.notify({
    type: 'warning',
    message: `Plus que ${timeRemaining} secondes !`,
    position: 'top',
    timeout: 2000,
  })
}

const onTimeUrgent = (timeRemaining) => {
  console.log('Urgent ! Plus que', timeRemaining, 'secondes !')
  $q.notify({
    type: 'negative',
    message: `Urgent ! Plus que ${timeRemaining} secondes !`,
    position: 'top',
    timeout: 1500,
  })
}

// Methods - Question events
const onAnswerSelected = (answerData) => {
  console.log('Réponse sélectionnée:', answerData)
  currentAnswer.value = answerData.answer
}

const onAnswerChanged = (hasAnswer) => {
  console.log('État de réponse changé:', hasAnswer)
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
        position: 'top'
      })
      return
    }
    
    console.log('Réponse soumise:', answer)
    
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
      correctAnswer: result.data.correctAnswer // Sera fourni par le backend
    })
    
    $q.notify({
      type: lastAnswerCorrect.value ? 'positive' : 'negative',
      message: lastAnswerCorrect.value ? `Bonne réponse ! +${lastQuestionPoints.value} points` : 'Réponse incorrecte',
      position: 'top',
      timeout: 2000
    })
    
    // Passer à l'état d'attente
    gameState.value = 'waiting_others'
    
  } catch (error) {
    console.error('Erreur soumission réponse:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la soumission de la réponse',
      position: 'top'
    })
    hasSubmittedAnswer.value = false // Permettre de réessayer
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

const loadQuestion = () => {
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
  
  // Démarrer le timer
  timeLeft.value = currentQuestion.value.timeLimit || 30
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
    
    console.log('Questions chargées:', questionsData.value)
    
    // Démarrer le jeu
    gameState.value = 'playing'
    loadQuestion()
    
    // Se connecter aux événements SSE pour la synchronisation
    connectToGameEvents()
    
  } catch (error) {
    console.error('Erreur initialisation jeu:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement du quiz',
      position: 'top'
    })
    
    // Rediriger vers l'accueil en cas d'erreur
    router.push('/accueil')
  }
}

// Se connecter aux événements du jeu via SSE
const connectToGameEvents = () => {
  try {
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin
    gameEventSource = new EventSource(`${baseUrl}/api/quiz/${quizId}/game/events`, {
      withCredentials: true
    })

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

// Gérer les événements du jeu
const handleGameEvent = (event) => {
  console.log('Événement reçu:', event)
  
  switch (event.type) {
    case 'all_answered':
      // Tous les participants ont répondu, passer à la question suivante
      allParticipantsAnswered.value = true
      
      $q.notify({
        type: 'info',
        message: 'Tous les participants ont répondu !',
        position: 'top',
        timeout: 2000
      })
      
      // Passer à la question suivante après 3 secondes
      setTimeout(() => {
        nextQuestion()
      }, 3000)
      break
      
    case 'participant_answered':
      // Un participant a répondu (optionnel pour afficher le décompte)
      participantsCount.value = event.participantsCount || participantsCount.value
      break
      
    case 'quiz_finished':
      // Quiz terminé
      gameState.value = 'finished'
      finalScore.value = currentScore.value
      loadLeaderboard()
      break
      
    default:
      console.log('Événement non géré:', event.type)
  }
}

// Navigation methods
const goToHome = () => {
  router.push('/accueil')
}

const playAgain = () => {
  // Redémarrer le quiz ou rediriger vers le lobby
  window.location.reload()
}

const loadLeaderboard = async () => {
  try {
    const result = await QuizService.getGameState(quizId)
    leaderboardParticipants.value = result.data.participants
    
    // Trouver le rang du joueur actuel
    const userIndex = leaderboardParticipants.value.findIndex(p => p.userId === currentUserId.value)
    currentRank.value = userIndex !== -1 ? userIndex + 1 : 1
  } catch (error) {
    console.error('Erreur chargement leaderboard:', error)
  }
}

// Lifecycle
onMounted(async () => {
  console.log('Initialisation du quiz:', quizId)
  
  // Charger l'utilisateur actuel
  try {
    const currentUser = await AuthService.getCurrentUser()
    currentUserId.value = currentUser.data.user._id
  } catch (error) {
    console.error('Erreur chargement utilisateur:', error)
  }
  
  initializeGame()
})

onUnmounted(() => {
  // Nettoyer les timers
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  
  // Fermer la connexion SSE
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
