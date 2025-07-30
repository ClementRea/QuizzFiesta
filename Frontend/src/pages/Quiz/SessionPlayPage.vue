<template>
  <main
    class="full-width bg-gradient-primary"
    style="height: 100vh"
    aria-label="Jouer à la session de quiz"
  >
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
              <GameFinalRanking :leaderboard="leaderboard" />

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
            <GameQuestion
              :question="currentQuestion"
              :question-number="currentQuestionIndex + 1"
              :total-questions="totalQuestions"
              :disabled="hasAnswered || (isTimerStarted && isTimeUp)"
              @answer-selected="onAnswerSelected"
              @answer-changed="onAnswerChanged"
            />

            <div class="q-mt-lg">
              <GameTimer :timeLeft="timeRemainingSeconds" :totalTime="timeLimit / 1000" />
            </div>

            <!-- Submit button -->
            <div class="text-center q-mt-lg">
              <q-btn
                color="positive"
                icon="send"
                :label="hasAnswered ? 'Réponse validée' : 'Valider ma réponse'"
                :disable="hasAnswered || !isAnswerReady"
                @click="handleSubmitAnswer"
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

    <SessionOrganizerPanel
      v-if="isOrganizer"
      v-model="showOrganizerPanel"
      :session="session"
      :is-last-question="isLastQuestion"
      :leaderboard="leaderboard"
      :loading-next="loadingNext"
      :ending="ending"
      @nextQuestion="handleNextQuestion"
      @endSession="handleEndSession"
    />

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
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SessionOrganizerPanel from 'src/components/session/SessionOrganizerPanel.vue'
import GameFinalRanking from 'src/components/game/GameFinalRanking.vue'
import GameQuestion from 'src/components/game/GameQuestion.vue'
import GameTimer from 'src/components/game/GameTimer.vue'

// Composables
import { useGameSession } from 'src/composables/useGameSession'
import { useGameTimer } from 'src/composables/useGameTimer'
import { useGameAnswers } from 'src/composables/useGameAnswers'
import { useOrganizerControls } from 'src/composables/useOrganizerControls'

const router = useRouter()
const route = useRoute()

// Props dérivées
const sessionId = computed(() => route.params.sessionId)

const setupAllSocketListeners = () => {
  setupTimerSocketListeners()
  setupAnswerSocketListeners()
  setupOrganizerSocketListeners()
}

// Composables principaux
const {
  session,
  currentQuestion,
  participantState,
  leaderboard,
  gameState,
  errorMessage,
  currentQuestionIndex,
  totalQuestions,
  participantsCount,
  socketConnected,
  isOrganizer,
  isLastQuestion,
  retry,
} = useGameSession(sessionId, setupAllSocketListeners)

const { timeLimit, timeRemainingSeconds, isTimeUp, isTimerStarted, setupTimerSocketListeners } =
  useGameTimer()

const {
  hasAnswered,
  submitting,
  isAnswerReady,
  onAnswerSelected,
  onAnswerChanged,
  submitCurrentAnswer,
  setupAnswerSocketListeners,
} = useGameAnswers(sessionId, participantState)

const {
  showOrganizerPanel,
  loadingNext,
  ending,
  nextQuestion,
  endSession,
  setupOrganizerSocketListeners,
} = useOrganizerControls(sessionId, isOrganizer, socketConnected)

const handleSubmitAnswer = () => {
  submitCurrentAnswer(currentQuestion, socketConnected)
}

const handleNextQuestion = () => {
  nextQuestion()
}

const handleEndSession = () => {
  endSession()
}

const goHome = () => {
  router.push('/accueil')
}
</script>
