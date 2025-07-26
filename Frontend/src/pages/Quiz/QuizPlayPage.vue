<template>
  <main class="full-width bg-gradient-primary" aria-label="Jouer au quiz">
    <!-- TODO : Aller chercher les questions dans le back,
    ne pas afficher si on a la bonne réponse,
    attendre que tout le monde ait répondu avant de passer à la suivante -->
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
              :disabled="false"
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
            <div class="bg-white rounded-borders q-pa-xl shadow-8">
              <q-icon name="emoji_events" size="4rem" color="amber" class="q-mb-lg" />
              <h2 class="text-h4 text-secondary text-weight-bold q-mb-md">Quiz terminé !</h2>
              <div class="text-h5 text-weight-bold q-mb-lg">
                Score final : {{ finalScore }} points
              </div>
              <!-- Classement sera ajouté plus tard -->
              <div class="q-mt-xl">
                <q-btn
                  label="Voir le classement complet"
                  color="secondary"
                  text-color="primary"
                  size="lg"
                  rounded
                  unelevated
                  @click="showFullLeaderboard = true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import QuizTimer from 'src/components/QuizTimer.vue'
import QuizQuestion from 'src/components/QuizQuestion.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

// Props de la route
const quizId = route.params.id

// État du jeu
const gameState = ref('waiting') // 'waiting', 'playing', 'question_results', 'finished'
const quizData = ref(null)
const currentQuestionIndex = ref(0)
const currentQuestion = ref(null)
const timeLeft = ref(30)
const totalQuestions = ref(0)
const participantsCount = ref(1)

// Score et réponses
const currentScore = ref(0)
const finalScore = ref(0)
const selectedAnswers = ref([])
const shuffledOrderItems = ref([])
const lastAnswerCorrect = ref(false)
const lastQuestionPoints = ref(0)
const currentAnswer = ref(null)

// UI state
const showFullLeaderboard = ref(false)
const questionComponent = ref(null)

// Timer
let timerInterval = null

// Computed properties

const hasAnswered = computed(() => {
  return currentAnswer.value !== null
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

const submitAnswer = () => {
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

  console.log('Réponse soumise:', answer)

  // Simuler la vérification
  lastAnswerCorrect.value = Math.random() > 0.5
  lastQuestionPoints.value = lastAnswerCorrect.value ? 100 : 0
  currentScore.value += lastQuestionPoints.value

  // Afficher les résultats
  gameState.value = 'question_results'

  // Passer à la question suivante après 3 secondes
  setTimeout(() => {
    nextQuestion()
  }, 3000)
}

const nextQuestion = () => {
  currentQuestionIndex.value++

  if (currentQuestionIndex.value >= totalQuestions.value) {
    // Quiz terminé
    gameState.value = 'finished'
    finalScore.value = currentScore.value
    return
  }

  // Charger la question suivante
  loadQuestion()
  gameState.value = 'playing'
  currentAnswer.value = null
}

const loadQuestion = () => {
  // Simuler le chargement d'une question
  const questions = [
    {
      id: 1,
      title: 'Quelle est la capitale de la France ?',
      type: 'multiple_choice',
      timeLimit: 30,
      points: 100,
      answers: [
        { text: 'Paris', correct: true },
        { text: 'Lyon', correct: false },
        { text: 'Marseille', correct: false },
        { text: 'Toulouse', correct: false },
      ],
    },
    {
      id: 2,
      title: 'La Terre est-elle ronde ?',
      type: 'true_false',
      timeLimit: 20,
      points: 50,
      correctAnswer: true,
    },
    {
      id: 3,
      title: "Remettez ces événements dans l'ordre chronologique :",
      type: 'order',
      timeLimit: 45,
      points: 150,
      items: [
        { text: 'Première Guerre mondiale', order: 1 },
        { text: 'Révolution française', order: 0 },
        { text: 'Seconde Guerre mondiale', order: 2 },
        { text: 'Chute du mur de Berlin', order: 3 },
      ],
    },
    {
      id: 4,
      title: "Décrivez brièvement l'importance de l'eau dans la vie :",
      type: 'text',
      timeLimit: 60,
      points: 200,
      maxLength: 300,
    },
  ]

  currentQuestion.value = questions[currentQuestionIndex.value % questions.length]

  // Démarrer le timer
  timeLeft.value = currentQuestion.value.timeLimit
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

const initializeGame = () => {
  // Simuler l'initialisation du jeu
  quizData.value = {
    title: 'Quiz de Culture Générale',
    description: 'Testez vos connaissances !',
  }

  totalQuestions.value = 5
  participantsCount.value = Math.floor(Math.random() * 20) + 1

  // Démarrer le jeu après 2 secondes
  setTimeout(() => {
    gameState.value = 'playing'
    loadQuestion()
  }, 2000)
}

// Lifecycle
onMounted(() => {
  console.log('Initialisation du quiz:', quizId)
  initializeGame()
})

onUnmounted(() => {
  // Nettoyer les timers
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
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
