<template>
  <main class="full-width bg-gradient-primary" aria-label="Rejoindre un quiz">
    <section class="q-pa-lg rounded-borders-bottom">
      <div class="row justify-center">
        <div class="col-12 col-md-8 text-center">
          <div class="q-mb-lg">
            <h1 class="text-h3 text-secondary text-weight-bold q-mb-md">🎮 Rejoindre un Quiz</h1>
            <p class="text-h6 text-secondary q-mt-none q-mb-xl">
              Entrez le code du quiz pour commencer à jouer
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Formulaire de saisie du code -->
    <section v-if="!foundQuiz" class="q-pa-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-6 col-lg-4">
          <div class="bg-white rounded-borders q-pa-xl text-center shadow-8">
            <div class="q-mb-xl">
              <q-icon name="mdi-key-variant" size="5rem" color="secondary" />
            </div>

            <q-input
              v-model="joinCode"
              label="Code du quiz"
              outlined
              rounded
              bg-color="white"
              label-color="secondary"
              color="secondary"
              fill-mask
              hint="Code à 6 caractères (ex: ABC123)"
              class="text-center q-mb-xl quiz-code-input"
              :loading="loading"
              :error="!!error"
              :error-message="error"
              @input="onCodeInput"
              @keyup.enter="searchQuiz"
              autofocus
              aria-label="Saisir le code du quiz à 6 caractères"
            >
              <template v-slot:prepend>
                <q-icon name="mdi-pound" color="secondary" />
              </template>
            </q-input>

            <q-btn
              label="🔍 Rechercher le quiz"
              color="secondary"
              text-color="primary"
              rounded
              size="lg"
              :loading="loading"
              :disable="!isValidCode"
              @click="searchQuiz"
              class="full-width shadow-4 text-weight-medium"
              no-caps
              unelevated
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Quiz trouvé -->
    <section
      v-else
      class="q-pa-lg"
      :style="{
        animation: 'slideIn 0.3s ease-out',
      }"
    >
      <div class="row justify-center">
        <div class="col-12 col-md-8">
          <!-- Header Success -->
          <div class="text-center q-mb-xl">
            <h2 class="text-h4 text-secondary text-weight-bold q-mb-sm">✅ Quiz trouvé !</h2>
            <q-separator class="q-mt-md" size="2px" />
          </div>

          <!-- Quiz Info Card -->
          <div class="row justify-center">
            <div class="col-12 col-md-10">
              <div class="rounded-borders q-pa-lg shadow-8">
                <QuizObject
                  :quiz="foundQuiz"
                  size="md"
                  :show-edit-button="false"
                  :show-delete-button="false"
                  :show-view-button="false"
                  :show-share-button="false"
                />

                <!-- Status du quiz -->
                <div class="q-mt-lg">
                  <q-banner
                    v-if="quizStatus.status === 'not_started'"
                    dense
                    class="bg-orange-1 text-orange-8 rounded-borders"
                    role="alert"
                  >
                    <template v-slot:avatar>
                      <q-icon name="schedule" color="orange" />
                    </template>
                    <div class="text-weight-medium">⏰ {{ quizStatus.message }}</div>
                    <div class="text-caption q-mt-xs">
                      Début : {{ formatDate(foundQuiz.startDate) }}
                    </div>
                  </q-banner>

                  <q-banner
                    v-else-if="quizStatus.status === 'ended'"
                    dense
                    class="bg-red-1 text-red-8 rounded-borders"
                    role="alert"
                  >
                    <template v-slot:avatar>
                      <q-icon name="event_busy" color="red" />
                    </template>
                    <div class="text-weight-medium">❌ {{ quizStatus.message }}</div>
                  </q-banner>

                  <q-banner
                    v-else
                    dense
                    class="bg-green-1 text-green-8 rounded-borders"
                    role="status"
                  >
                    <template v-slot:avatar>
                      <q-icon name="play_circle" color="green" />
                    </template>
                    <div class="text-weight-medium">🎯 {{ quizStatus.message }}</div>
                    <div v-if="quizStatus.timeRemaining" class="text-caption q-mt-xs">
                      Temps restant : {{ formatTimeRemaining(quizStatus.timeRemaining) }}
                    </div>
                  </q-banner>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="row q-gutter-md justify-center q-mt-xl">
            <q-btn
              label="⬅️ Modifier le code"
              color="secondary"
              outline
              rounded
              size="lg"
              @click="resetSearch"
              class="col-12 col-sm-5 shadow-2"
              no-caps
            />
            <q-btn
              label="🚀 Rejoindre le quiz"
              color="secondary"
              rounded
              size="lg"
              :disable="quizStatus.status !== 'active'"
              @click="joinQuiz"
              class="col-12 col-sm-5 shadow-4 text-weight-medium"
              :loading="joiningQuiz"
              no-caps
              unelevated
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading && !foundQuiz" class="q-pa-xl">
      <div class="row justify-center">
        <div class="col-12 col-md-6">
          <div class="bg-white rounded-borders q-pa-xl text-center shadow-4">
            <q-spinner-dots size="3rem" color="secondary" class="q-mb-md" />
            <p class="text-body1 text-secondary">Recherche du quiz en cours...</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import QuizService from 'src/services/QuizService'
import QuizObject from 'src/components/QuizObject.vue'

const router = useRouter()
const $q = useQuasar()

// État réactif
const joinCode = ref('')
const loading = ref(false)
const joiningQuiz = ref(false)
const error = ref('')
const foundQuiz = ref(null)

// Code valide si 6 caractères hexadécimaux
const isValidCode = computed(() => {
  return QuizService.validateJoinCode(joinCode.value)
})

// Status du quiz (actif, pas commencé, terminé)
const quizStatus = computed(() => {
  if (!foundQuiz.value) return { status: 'unknown' }
  return QuizService.getQuizTimeStatus(foundQuiz.value)
})

// Surveiller les changements du code pour nettoyer les erreurs
watch(joinCode, () => {
  error.value = ''
})

// Formater le code en majuscules en temps réel
const onCodeInput = () => {
  joinCode.value = QuizService.formatJoinCode(joinCode.value)
}

// Rechercher le quiz par code
const searchQuiz = async () => {
  if (!isValidCode.value) {
    error.value = 'Le code doit contenir exactement 6 caractères'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await QuizService.joinQuizByCode(joinCode.value)
    foundQuiz.value = response.data.quiz
  } catch (err) {
    console.error('Erreur recherche quiz:', err)

    if (err.status === 'error' && err.message) {
      error.value = err.message
    } else {
      error.value = 'Quiz non trouvé. Vérifiez le code et réessayez.'
    }

    $q.notify({
      type: 'negative',
      message: error.value,
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

// Rejoindre le quiz (aller vers la salle d'attente)
const joinQuiz = async () => {
  if (!foundQuiz.value || quizStatus.value.status !== 'active') {
    return
  }

  joiningQuiz.value = true

  try {
    // Créer une session et rediriger vers la nouvelle architecture
    const sessionResult = await QuizService.createSession(foundQuiz.value._id, {
      name: `Session ${foundQuiz.value.title} - ${new Date().toLocaleString()}`
    })
    
    const sessionId = sessionResult.data.session._id
    
    // Rejoindre automatiquement la session
    await QuizService.joinSession(sessionId)
    
    // Rediriger vers le lobby de la nouvelle session
    router.push(`/quiz/session/${sessionId}/lobby`)

    $q.notify({
      type: 'positive',
      icon: 'mdi-account-multiple',
      message: "Connexion à la session réussie !",
      position: 'top',
    })
  } catch (err) {
    console.error('Erreur rejoindre quiz:', err)

    $q.notify({
      type: 'negative',
      message: 'Impossible de rejoindre le quiz',
      position: 'top',
    })
  } finally {
    joiningQuiz.value = false
  }
}

// Remettre à zéro la recherche
const resetSearch = () => {
  foundQuiz.value = null
  error.value = ''
  joinCode.value = ''
}

// Formatage des dates
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Formatage du temps restant
const formatTimeRemaining = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`
  if (hours > 0) return `${hours}h ${minutes % 60}min`
  if (minutes > 0) return `${minutes}min ${seconds % 60}s`
  return `${seconds}s`
}
</script>

<style scoped>
.rounded-borders-bottom {
  border-radius: 0 0 2rem 2rem;
}

.rounded-borders {
  border-radius: 1rem;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
