<template>
  <div
    class="full-height flex flex-center q-pa-lg"
    :style="{
      background: $q.screen.lt.sm ? 'white' : 'linear-gradient(135deg, #FFF7CC 0%, #FFEF99 100%)',
      minHeight: '100vh',
    }"
  >
    <div class="row justify-center full-width">
      <div class="col-12 col-md-6 col-lg-4">
        <q-card
          class="shadow-3"
          :style="{ borderRadius: $q.screen.lt.sm ? '12px' : '16px', overflow: 'hidden' }"
        >
          <q-card-section class="text-center bg-primary text-white">
            <div class="text-h5 q-mb-sm">
              <q-icon name="mdi-gamepad-variant" size="md" class="q-mr-sm" />
              Rejoindre un Quiz
            </div>
            <div class="text-subtitle2">Entrez le code du quiz pour commencer à jouer</div>
          </q-card-section>

          <q-card-section class="q-pa-lg">
            <!-- Formulaire de saisie du code -->
            <div v-if="!foundQuiz" class="q-gutter-md">
              <div class="text-center q-mb-lg">
                <q-icon name="mdi-key-variant" size="xl" color="grey-6" />
              </div>

              <q-input
                v-model="joinCode"
                label="Code du quiz"
                outlined
                fill-mask
                hint="Code à 6 caractères (ex: ABC123)"
                class="text-center"
                :loading="loading"
                :error="!!error"
                :error-message="error"
                @input="onCodeInput"
                @keyup.enter="searchQuiz"
                autofocus
              >
                <template #prepend>
                  <q-icon name="mdi-pound" />
                </template>
                <template #append>
                  <q-btn
                    round
                    dense
                    flat
                    icon="search"
                    :loading="loading"
                    :disable="!isValidCode"
                    @click="searchQuiz"
                    color="primary"
                    text-color="secondary"
                  />
                </template>
              </q-input>

              <div class="text-center q-mt-lg">
                <q-btn
                  unelevated
                  color="primary"
                  text-color="secondary"
                  size="lg"
                  :loading="loading"
                  :disable="!isValidCode"
                  @click="searchQuiz"
                  class="full-width"
                >
                  <q-icon name="search" class="q-mr-sm" />
                  Rechercher le quiz
                </q-btn>
              </div>
            </div>

            <!-- Quiz trouvé -->
            <div
              v-else
              class="animated fadeIn"
              :style="{
                animation: 'slideIn 0.3s ease-out',
              }"
            >
              <div class="text-center q-mb-lg">
                <q-icon name="mdi-check-circle" size="xl" color="positive" />
                <div class="text-h6 q-mt-sm text-positive">Quiz trouvé !</div>
              </div>

              <q-card flat bordered class="q-mb-lg">
                <q-card-section>
                  <div class="text-h6 text-dark q-mb-sm">{{ foundQuiz.title }}</div>
                  <div v-if="foundQuiz.description" class="text-body2 text-grey-7 q-mb-md">
                    {{ foundQuiz.description }}
                  </div>

                  <div class="row q-gutter-sm text-caption">
                    <q-chip dense color="grey-3" text-color="dark">
                      <q-icon name="mdi-help-circle" class="q-mr-xs" />
                      {{ foundQuiz.questions?.length || 0 }} questions
                    </q-chip>
                    <q-chip dense color="grey-3" text-color="dark">
                      <q-icon name="mdi-account" class="q-mr-xs" />
                      Par {{ foundQuiz.createdBy?.userName || 'Anonyme' }}
                    </q-chip>
                  </div>

                  <!-- Status du quiz -->
                  <div class="q-mt-md">
                    <q-banner
                      v-if="quizStatus.status === 'not_started'"
                      dense
                      class="bg-orange-1 text-orange-8"
                    >
                      <template #avatar>
                        <q-icon name="schedule" />
                      </template>
                      {{ quizStatus.message }}
                      <div class="text-caption">Début : {{ formatDate(foundQuiz.startDate) }}</div>
                    </q-banner>

                    <q-banner
                      v-else-if="quizStatus.status === 'ended'"
                      dense
                      class="bg-red-1 text-red-8"
                    >
                      <template #avatar>
                        <q-icon name="event_busy" />
                      </template>
                      {{ quizStatus.message }}
                    </q-banner>

                    <q-banner v-else dense class="bg-green-1 text-green-8">
                      <template #avatar>
                        <q-icon name="play_circle" />
                      </template>
                      {{ quizStatus.message }}
                      <div v-if="quizStatus.timeRemaining" class="text-caption">
                        Temps restant : {{ formatTimeRemaining(quizStatus.timeRemaining) }}
                      </div>
                    </q-banner>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Actions -->
              <div class="row q-gutter-sm">
                <q-btn flat color="grey-7" @click="resetSearch" class="col">
                  <q-icon name="arrow_back" class="q-mr-sm" />
                  Modifier le code
                </q-btn>
                <q-btn
                  unelevated
                  color="primary"
                  text-color="secondary"
                  :disable="quizStatus.status !== 'active'"
                  @click="joinQuiz"
                  class="col"
                  :loading="joiningQuiz"
                >
                  <q-icon name="login" class="q-mr-sm" />
                  Rejoindre
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Aide -->
        <q-card flat class="q-mt-lg bg-grey-1">
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm">
              <q-icon name="help" class="q-mr-xs" />
              Comment ça marche ?
            </div>
            <div class="text-body2 text-grey-7">
              1. Demandez le code du quiz à l'organisateur<br />
              2. Entrez le code à 6 caractères<br />
              3. Vérifiez les informations du quiz<br />
              4. Cliquez sur "Rejoindre" pour commencer !
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import QuizService from 'src/services/QuizService'

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
    // Rediriger vers la salle d'attente/lobby
    await router.push(`/quiz/lobby/${foundQuiz.value._id}`)

    $q.notify({
      type: 'warning',
      icon: 'mdi-account-multiple',
      message: "Connexion à la salle d'attente...",
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

<style>
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
