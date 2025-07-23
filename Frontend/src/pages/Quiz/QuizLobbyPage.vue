<template>
  <div class="full-height flex flex-center q-pa-lg bg-grey-1">
    <div class="row justify-center full-width">
      <div class="col-12 col-md-8 col-lg-6">
        <!-- Header avec info du quiz -->
        <q-card class="shadow-3 q-mb-lg">
          <q-card-section class="bg-primary text-white text-center">
            <div class="text-h5 q-mb-sm">
              <q-icon name="mdi-account-group" size="md" class="q-mr-sm" />
              Salle d'attente
            </div>
            <div class="text-subtitle1">{{ quiz?.title || 'Chargement...' }}</div>
            <div v-if="quiz?.description" class="text-caption q-mt-xs">
              {{ quiz.description }}
            </div>
          </q-card-section>

          <!-- Informations du quiz -->
          <q-card-section v-if="quiz">
            <div class="row q-gutter-sm text-center">
              <div class="col">
                <q-icon name="mdi-help-circle" size="sm" color="grey-6" />
                <div class="text-caption text-grey-7">Questions</div>
                <div class="text-h6">{{ quiz.questions?.length || 0 }}</div>
              </div>
              <div class="col">
                <q-icon name="mdi-account-multiple" size="sm" color="primary" />
                <div class="text-caption text-grey-7">Participants</div>
                <div class="text-h6 text-primary">{{ participants.length }}</div>
              </div>
              <div class="col">
                <q-icon name="mdi-clock" size="sm" color="grey-6" />
                <div class="text-caption text-grey-7">Statut</div>
                <div class="text-body2">
                  <q-chip
                    :color="connectionStatus === 'connected' ? 'green' : 'orange'"
                    text-color="white"
                    dense
                  >
                    {{ connectionStatus === 'connected' ? 'Connecté' : 'Connexion...' }}
                  </q-chip>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Liste des participants -->
        <q-card class="shadow-2 q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md flex items-center">
              <q-icon name="mdi-account-group" class="q-mr-sm" />
              Participants ({{ participants.length }})
              <q-space />
              <q-btn
                round
                dense
                flat
                icon="refresh"
                @click="refreshParticipants"
                :loading="loadingParticipants"
                color="primary"
                text-color="secondary"
              >
                <q-tooltip>Actualiser</q-tooltip>
              </q-btn>
            </div>

            <!-- Loading participants -->
            <div
              v-if="loadingParticipants && participants.length === 0"
              class="text-center q-pa-lg"
            >
              <q-spinner color="primary" size="40px" />
              <div class="text-body2 text-grey-7 q-mt-sm">Chargement des participants...</div>
            </div>

            <!-- Liste vide -->
            <div v-else-if="participants.length === 0" class="text-center q-pa-lg">
              <q-icon name="mdi-account-off" size="xl" color="grey-5" />
              <div class="text-body1 text-grey-7 q-mt-sm">Aucun participant pour le moment</div>
              <div class="text-caption text-grey-6">En attente d'autres joueurs...</div>
            </div>

            <!-- Liste des participants -->
            <div v-else class="q-gutter-sm">
              <q-list separator>
                <q-item v-for="participant in participants" :key="participant.id" class="q-pa-md">
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white" size="md">
                      <img v-if="participant.avatar" :src="getAvatarUrl(participant.avatar)" />
                      <span v-else>{{ getInitials(participant.userName) }}</span>
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ participant.userName }}
                      <q-chip
                        v-if="participant.isOrganizer"
                        dense
                        color="orange"
                        text-color="white"
                        class="q-ml-sm"
                      >
                        Organisateur
                      </q-chip>
                    </q-item-label>
                    <q-item-label caption>
                      <q-icon
                        :name="participant.isReady ? 'mdi-check-circle' : 'mdi-clock-outline'"
                        :color="participant.isReady ? 'green' : 'orange'"
                        size="sm"
                        class="q-mr-xs"
                      />
                      {{ participant.isReady ? 'Prêt' : 'En attente' }}
                      <span class="q-ml-sm text-grey-6">
                        Connecté {{ formatJoinTime(participant.joinedAt) }}
                      </span>
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div class="row q-gutter-xs">
                      <q-icon
                        :name="getConnectionIcon(participant.connectionStatus)"
                        :color="getConnectionColor(participant.connectionStatus)"
                        size="sm"
                      >
                        <q-tooltip>{{
                          getConnectionLabel(participant.connectionStatus)
                        }}</q-tooltip>
                      </q-icon>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>

        <!-- Messages en temps réel -->
        <q-card v-if="messages.length > 0" class="shadow-2 q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="mdi-message" class="q-mr-sm" />
              Messages
            </div>
            <div class="q-gutter-xs" style="max-height: 200px; overflow-y: auto">
              <div
                v-for="message in messages"
                :key="message.id"
                class="q-pa-sm rounded-borders"
                :class="message.type === 'system' ? 'bg-secondary' : 'bg-grey-2'"
              >
                <div class="text-caption text-grey-7">{{ formatTime(message.timestamp) }}</div>
                <div class="text-body2">{{ message.content }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Actions -->
        <q-card class="shadow-2">
          <q-card-section>
            <div class="row q-gutter-md">
              <!-- Bouton Quitter -->
              <q-btn
                outline
                color="negative"
                icon="mdi-exit-to-app"
                label="Quitter"
                @click="confirmLeaveQuiz"
                class="col-12 col-sm"
                :disable="starting"
              />

              <!-- Bouton Prêt/Pas prêt -->
              <q-btn
                :color="isReady ? 'orange' : 'green'"
                :icon="isReady ? 'mdi-clock-outline' : 'mdi-check'"
                :label="isReady ? 'Pas prêt' : 'Prêt'"
                @click="toggleReady"
                class="col-12 col-sm"
                :loading="updatingReady"
                :disable="starting"
              />

              <!-- Bouton Démarrer (organisateur seulement) -->
              <q-btn
                v-if="isOrganizer"
                unelevated
                color="primary"
                text-color="secondary"
                icon="mdi-play"
                label="Démarrer le quiz"
                @click="startQuiz"
                :loading="starting"
                :disable="!canStart"
                class="col-12 col-sm"
              >
                <q-tooltip v-if="!canStart">
                  {{ startDisabledReason }}
                </q-tooltip>
              </q-btn>
            </div>

            <!-- Info pour démarrer -->
            <div v-if="isOrganizer && !canStart" class="q-mt-md">
              <q-banner dense class="bg-orange-1 text-orange-8">
                <template #avatar>
                  <q-icon name="mdi-information" />
                </template>
                {{ startDisabledReason }}
              </q-banner>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog de confirmation pour quitter -->
    <q-dialog v-model="showLeaveDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="mdi-help" color="orange" text-color="white" />
          <span class="q-ml-sm">Êtes-vous sûr de vouloir quitter la salle d'attente ?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" text-color="secondary" v-close-popup />
          <q-btn flat label="Quitter" color="negative" @click="leaveQuiz" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import QuizService from 'src/services/QuizService'
import AuthService from 'src/services/AuthService'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

// REF
const quiz = ref(null)
const participants = ref([])
const messages = ref([])
const currentUser = ref(null)
const isReady = ref(false)
const loading = ref(true)
const loadingParticipants = ref(false)
const updatingReady = ref(false)
const starting = ref(false)
const showLeaveDialog = ref(false)
const connectionStatus = ref('connecting')

// WebSocket and EventSource
const eventSource = ref(null)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5

// Computed
const quizId = computed(() => route.params.id)
const isOrganizer = computed(() => {
  return currentUser.value && quiz.value && currentUser.value.id === quiz.value.createdBy?._id
})

const canStart = computed(() => {
  if (!isOrganizer.value) return false
  if (participants.value.length < 1) return false
  return participants.value.every((p) => p.isReady)
})

const startDisabledReason = computed(() => {
  if (!isOrganizer.value) return "Seul l'organisateur peut démarrer"
  if (participants.value.length < 1) return 'Il faut au moins 1 participant'
  if (!participants.value.every((p) => p.isReady)) return 'Tous les participants doivent être prêts'
  return ''
})

const getInitials = (name) => {
  return name ? name.substring(0, 2).toUpperCase() : '??'
}

const getAvatarUrl = (avatar) => {
  if (!avatar) return null
  if (avatar.startsWith('http')) return avatar

  const backendPort = window.location.hostname === 'localhost' ? ':3000' : ''
  const protocol = window.location.protocol
  const hostname = window.location.hostname

  return `${protocol}//${hostname}${backendPort}/avatars/${avatar}`
}

const formatJoinTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return "à l'instant"
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const getConnectionIcon = (status) => {
  const icons = {
    connected: 'mdi-wifi',
    connecting: 'mdi-wifi-strength-1',
    disconnected: 'mdi-wifi-off',
  }
  return icons[status] || 'mdi-wifi-strength-1'
}

const getConnectionColor = (status) => {
  const colors = {
    connected: 'green',
    connecting: 'orange',
    disconnected: 'red',
  }
  return colors[status] || 'grey'
}

const getConnectionLabel = (status) => {
  const labels = {
    connected: 'Connecté',
    connecting: 'Connexion...',
    disconnected: 'Déconnecté',
  }
  return labels[status] || 'Inconnu'
}

const joinLobby = async () => {
  const response = await QuizService.joinLobby(quizId.value)
  participants.value = response.data.participants || []

  addMessage({
    type: 'system',
    content: "Vous avez rejoint la salle d'attente",
    timestamp: new Date(),
  })
}

// Initialize lobby
const initializeLobby = async () => {
  try {
    loading.value = true

    // User infos
    const userResponse = await AuthService.getMe()
    currentUser.value = userResponse.data.user

    // Join lobby
    await joinLobby()

    // Get quiz info
    const quizResponse = await QuizService.getQuizById(quizId.value)
    quiz.value = quizResponse.data.quiz

    // real time connection
    setupRealtimeConnection()
  } catch (error) {
    console.error('Erreur initialisation lobby:', error)
    $q.notify({
      type: 'negative',
      message: "Erreur lors du chargement de la salle d'attente",
      position: 'top',
    })
    router.push('/quiz/join')
  } finally {
    loading.value = false
  }
}

/**
 * Setup SSE real time play
 */
const setupRealtimeConnection = () => {
  // Get auth token for SSE connection
  const token = AuthService.getAccessToken()

  // SSE endpoint URL
  const url = `${getApiBaseUrl()}/quiz/${quizId.value}/lobby/events?token=${token}`

  // EventSource connection
  eventSource.value = new EventSource(url)

  // Success connection
  eventSource.value.onopen = () => {
    connectionStatus.value = 'connected'
    reconnectAttempts.value = 0
    console.log('Real-time connection established / Connexion temps réel établie')
  }

  eventSource.value.onmessage = (event) => {
    handleRealtimeMessage(JSON.parse(event.data))
  }

  eventSource.value.onerror = (error) => {
    console.error('Real-time connection error / Erreur connexion temps réel:', error)
    connectionStatus.value = 'connecting'

    if (reconnectAttempts.value < maxReconnectAttempts) {
      setTimeout(() => {
        reconnectAttempts.value++
        setupRealtimeConnection()
      }, 2000 * reconnectAttempts.value)
    }
  }
}

/**
 * Message SSE
 */
const handleRealtimeMessage = (data) => {
  switch (data.type) {
    // new player joins
    case 'participant_joined':
      participants.value.push(data.participant)
      addMessage({
        type: 'system',
        content: `${data.participant.userName} a rejoint la salle`,
        timestamp: new Date(),
      })
      break

    // player leaves the lobby
    case 'participant_left':
      participants.value = participants.value.filter((p) => p.id !== data.participantId)
      addMessage({
        type: 'system',
        content: `${data.userName} a quitté la salle`,
        timestamp: new Date(),
      })
      break

    // When a player changes ready status
    case 'participant_ready_changed': {
      const participant = participants.value.find((p) => p.id === data.participantId)
      if (participant) {
        participant.isReady = data.isReady
        addMessage({
          type: 'system',
          content: `${participant.userName} est ${data.isReady ? 'prêt' : 'pas prêt'}`,
          timestamp: new Date(),
        })
      }
      break
    }

    // When the organizer starts the quiz
    case 'quiz_starting':
      addMessage({
        type: 'system',
        content: 'Le quiz va commencer...',
        timestamp: new Date(),
      })
      // Redirect all participants to the quiz play page after 2 seconds
      setTimeout(() => {
        router.push(`/quiz/play/${quizId.value}`)
      }, 2000)
      break

    // When the organizer cancels the quiz
    case 'quiz_cancelled':
      addMessage({
        type: 'system',
        content: "Le quiz a été annulé par l'organisateur",
        timestamp: new Date(),
      })
      // Redirect participants back to join page after 3 seconds
      setTimeout(() => {
        router.push('/quiz/join')
      }, 3000)
      break

    // Ignore ping messages to keep the connection
    case 'ping':
      break

    case 'connected':
      console.log('SSE connection confirmed / Connexion SSE confirmée')
      break

    default:
      console.warn('Unknown SSE message type / Type de message SSE inconnu:', data.type)
  }
}

const addMessage = (message) => {
  messages.value.push({
    id: Date.now() + Math.random(),
    ...message,
  })

  if (messages.value.length > 50) {
    messages.value = messages.value.slice(-50)
  }
}

const getApiBaseUrl = () => {
  const backendPort = window.location.hostname === 'localhost' ? ':3000' : ''
  const protocol = window.location.protocol
  const hostname = window.location.hostname

  return `${protocol}//${hostname}${backendPort}/api`
}

const refreshParticipants = async () => {
  try {
    loadingParticipants.value = true
    const response = await QuizService.getLobbyParticipants(quizId.value)
    participants.value = response.data.participants || []
  } catch (error) {
    console.error('Erreur refresh participants:', error)
  } finally {
    loadingParticipants.value = false
  }
}

const toggleReady = async () => {
  try {
    updatingReady.value = true
    const newReadyState = !isReady.value

    await QuizService.setLobbyReady(quizId.value, newReadyState)
    isReady.value = newReadyState

    const currentParticipant = participants.value.find((p) => p.id === currentUser.value.id)
    if (currentParticipant) {
      currentParticipant.isReady = newReadyState
    }
  } catch (error) {
    console.error('Erreur changement statut prêt:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du changement de statut',
      position: 'top',
    })
  } finally {
    updatingReady.value = false
  }
}

const startQuiz = async () => {
  try {
    starting.value = true

    await QuizService.startQuizFromLobby(quizId.value)

    $q.notify({
      type: 'positive',
      message: 'Démarrage du quiz...',
      position: 'top',
    })
  } catch (error) {
    console.error('Erreur démarrage quiz:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du démarrage du quiz',
      position: 'top',
    })
  } finally {
    starting.value = false
  }
}

const confirmLeaveQuiz = () => {
  showLeaveDialog.value = true
}

const leaveQuiz = async () => {
  try {
    await QuizService.leaveLobby(quizId.value)

    $q.notify({
      type: 'info',
      message: "Vous avez quitté la salle d'attente",
      position: 'top',
    })

    router.push('/quiz/join')
  } catch (error) {
    console.error('Erreur quitter lobby:', error)
    router.push('/quiz/join')
  }
}

/**
 * Clean up SSE connection and resources
 */
const cleanup = () => {
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }
}

onMounted(initializeLobby)

onUnmounted(() => {
  cleanup()
  if (quizId.value) {
    QuizService.leaveLobby(quizId.value).catch(() => {})
  }
})

window.addEventListener('beforeunload', cleanup)
</script>

<style scoped>
.q-list .q-item {
  border-radius: 8px;
  margin-bottom: 4px;
}

.q-list .q-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>
