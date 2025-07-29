<template>
  <main class="full-width bg-gradient-primary" aria-label="Rejoindre une session de quiz">
    <section class="q-pa-lg rounded-borders-bottom">
      <div class="row justify-center">
        <div class="col-12 col-md-8 text-center">
          <div class="q-mb-lg">
            <h1 class="text-h3 text-secondary text-weight-bold q-mb-md">🎮 Rejoindre une Session</h1>
            <p class="text-h6 text-secondary q-mt-none q-mb-xl">
              Entrez le code de la session pour commencer à jouer
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Formulaire de saisie du code -->
    <section v-if="!foundSession" class="q-pa-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-6 col-lg-4">
          <div class="bg-white rounded-borders q-pa-xl text-center shadow-8">
            <div class="q-mb-xl">
              <q-icon name="mdi-gamepad-variant" size="5rem" color="secondary" />
            </div>

            <q-input
              v-model="sessionCode"
              label="Code de la session"
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
              @keyup.enter="searchSession"
              autofocus
              aria-label="Saisir le code de la session à 6 caractères"
            >
              <template v-slot:prepend>
                <q-icon name="mdi-pound" color="secondary" />
              </template>
            </q-input>

            <q-btn
              label="🔍 Rechercher la session"
              color="secondary"
              rounded
              size="lg"
              class="text-primary text-weight-bold q-px-xl q-py-sm q-mb-md full-width"
              :loading="loading"
              :disable="!canSearch"
              @click="searchSession"
              aria-label="Rechercher la session avec le code saisi"
            />

            <div class="text-caption text-grey-6 q-mt-md">
              Le code vous a été fourni par l'organisateur de la session
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Session trouvée -->
    <section v-else class="q-pa-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="bg-white rounded-borders q-pa-xl shadow-8">
            <!-- Header de la session -->
            <div class="text-center q-mb-lg">
              <div class="text-h4 text-secondary text-weight-bold q-mb-sm">
                {{ foundSession.quiz?.title }}
              </div>
              <q-chip color="secondary" text-color="primary" size="lg" class="q-mb-md">
                <q-icon name="mdi-gamepad-variant" class="q-mr-sm" />
                Session {{ foundSession.sessionCode }}
              </q-chip>
            </div>

            <!-- Informations de la session -->
            <div class="q-mb-lg">
              <div v-if="foundSession.quiz?.description" class="text-body1 text-grey-7 text-center q-mb-md">
                {{ foundSession.quiz.description }}
              </div>

              <div class="row q-gutter-md text-center">
                <div class="col">
                  <q-icon name="mdi-help-circle" size="md" color="grey-6" />
                  <div class="text-caption text-grey-7">Questions</div>
                  <div class="text-h6">{{ foundSession.gameState?.totalQuestions || 0 }}</div>
                </div>
                <div class="col">
                  <q-icon name="mdi-timer" size="md" color="grey-6" />
                  <div class="text-caption text-grey-7">Temps/Q</div>
                  <div class="text-h6">{{ foundSession.settings?.timePerQuestion || 30 }}s</div>
                </div>
                <div class="col">
                  <q-icon name="mdi-account-multiple" size="md" color="grey-6" />
                  <div class="text-caption text-grey-7">Participants</div>
                  <div class="text-h6">{{ foundSession.participantCount || 0 }}</div>
                </div>
              </div>
            </div>

            <!-- Organisateur -->
            <div class="text-center q-mb-lg">
              <div class="text-caption text-grey-6 q-mb-sm">Organisé par</div>
              <q-chip color="primary" text-color="white" size="md">
                <q-avatar size="sm" class="q-mr-sm">
                  <img v-if="foundSession.organizer?.avatar" :src="foundSession.organizer.avatar" alt="Avatar" />
                  <span v-else>{{ foundSession.organizer?.userName?.[0]?.toUpperCase() || '?' }}</span>
                </q-avatar>
                {{ foundSession.organizer?.userName || 'Organisateur' }}
              </q-chip>
            </div>

            <!-- Statut de la session -->
            <div class="text-center q-mb-lg">
              <q-chip
                :color="getStatusColor(foundSession.status)"
                text-color="white"
                size="lg"
                :icon="getStatusIcon(foundSession.status)"
              >
                {{ getStatusText(foundSession.status) }}
              </q-chip>
            </div>

            <!-- Actions -->
            <div class="text-center">
              <div class="row q-gutter-md justify-center">
                <q-btn
                  color="negative"
                  icon="mdi-arrow-left"
                  label="Changer de code"
                  @click="resetSearch"
                  outline
                  class="col-12 col-sm-5"
                />

                <q-btn
                  v-if="canJoinSession"
                  color="positive"
                  icon="mdi-login"
                  label="Rejoindre la session"
                  @click="joinSession"
                  :loading="joining"
                  class="col-12 col-sm-5"
                />

                <q-btn
                  v-else
                  color="grey-5"
                  icon="mdi-lock"
                  :label="joinDisabledReason"
                  disable
                  class="col-12 col-sm-5"
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import QuizService from 'src/services/QuizService'

const router = useRouter()
const $q = useQuasar()

// State
const sessionCode = ref('')
const foundSession = ref(null)
const loading = ref(false)
const joining = ref(false)
const error = ref('')

// Computed
const canSearch = computed(() => {
  return sessionCode.value.length === 6 && QuizService.validateSessionCode(sessionCode.value)
})

const canJoinSession = computed(() => {
  if (!foundSession.value) return false
  
  const status = foundSession.value.status
  return status === 'lobby' || (status === 'playing' && foundSession.value.settings?.allowLateJoin)
})

const joinDisabledReason = computed(() => {
  if (!foundSession.value) return 'Session non trouvée'
  
  switch (foundSession.value.status) {
    case 'finished':
      return 'Session terminée'
    case 'cancelled':
      return 'Session annulée'
    case 'playing':
      return foundSession.value.settings?.allowLateJoin 
        ? 'Rejoindre en cours'
        : 'Session en cours'
    default:
      return 'Non disponible'
  }
})

// Methods
const onCodeInput = (value) => {
  // Formatter le code automatiquement
  sessionCode.value = QuizService.formatSessionCode(value)
  error.value = ''
  
  // Auto-recherche si 6 caractères valides
  if (canSearch.value) {
    searchSession()
  }
}

const searchSession = async () => {
  if (!canSearch.value) {
    error.value = 'Le code doit contenir 6 caractères (A-F, 0-9)'
    return
  }

  try {
    loading.value = true
    error.value = ''
    
    const response = await QuizService.joinSessionByCode(sessionCode.value)
    foundSession.value = response.data.session
    
    $q.notify({
      type: 'positive',
      message: 'Session trouvée !',
      timeout: 1000
    })
    
  } catch (err) {
    console.error('Erreur recherche session:', err)
    error.value = err.message || 'Session non trouvée'
    foundSession.value = null
    
    $q.notify({
      type: 'negative',
      message: 'Session non trouvée avec ce code'
    })
  } finally {
    loading.value = false
  }
}

const joinSession = async () => {
  if (!foundSession.value || joining.value) return

  try {
    joining.value = true
    
    // Rejoindre directement le lobby de la session
    const sessionId = foundSession.value.id || foundSession.value._id
    
    if (foundSession.value.status === 'lobby') {
      // Aller au lobby
      router.push(`/quiz/session/${sessionId}/lobby`)
    } else if (foundSession.value.status === 'playing' && foundSession.value.settings?.allowLateJoin) {
      // Rejoindre en cours de partie
      await QuizService.joinSessionLobby(sessionId)
      router.push(`/quiz/session/${sessionId}/play`)
    }
    
  } catch (error) {
    console.error('Erreur rejoindre session:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Impossible de rejoindre la session'
    })
  } finally {
    joining.value = false
  }
}

const resetSearch = () => {
  foundSession.value = null
  sessionCode.value = ''
  error.value = ''
}

// Status helpers
const getStatusColor = (status) => {
  switch (status) {
    case 'lobby': return 'info'
    case 'playing': return 'positive'
    case 'finished': return 'grey'
    case 'cancelled': return 'negative'
    default: return 'grey'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'lobby': return 'mdi-account-group'
    case 'playing': return 'mdi-play-circle'
    case 'finished': return 'mdi-flag-checkered'
    case 'cancelled': return 'mdi-cancel'
    default: return 'mdi-help-circle'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'lobby': return 'En attente'
    case 'playing': return 'En cours'
    case 'finished': return 'Terminée'
    case 'cancelled': return 'Annulée'
    default: return 'Inconnu'
  }
}
</script>

<style scoped>
.full-width {
  width: 100%;
}

.rounded-borders-bottom {
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.quiz-code-input {
  font-size: 1.5rem;
  text-align: center;
}

.quiz-code-input :deep(.q-field__native) {
  text-align: center;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.3em;
}
</style>