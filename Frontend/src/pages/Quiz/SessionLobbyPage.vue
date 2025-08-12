<template>
  <div class="full-height flex flex-center q-pa-lg bg-grey-1">
    <div class="row justify-center full-width">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card class="shadow-3 q-mb-lg">
          <q-card-section class="bg-primary text-white text-center">
            <div class="text-h5 q-mb-sm">
              <q-icon name="mdi-account-group text-secondary" size="md" class="q-mr-sm" />
              <span class="text-secondary q-mr-md">Salle d'attente</span>
              <span class="text-secondary">
                <q-btn
                  color="secondary"
                  icon="mdi-content-copy"
                  flat
                  :label="session?.sessionCode || '...'"
                  @click="copyCode"
                  :disable="!session || !session.sessionCode"
                />
              </span>
            </div>
            <div class="text-subtitle1 text-secondary">
              {{ session?.quiz?.title || 'Chargement...' }}
            </div>
            <div v-if="session?.quiz?.description" class="text-caption text-secondary q-mt-xs">
              {{ session.quiz.description }}
            </div>
          </q-card-section>

          <q-card-section v-if="session">
            <div class="row q-gutter-sm text-center">
              <div class="col">
                <q-icon name="mdi-help-circle" size="sm" color="grey-6" />
                <div class="text-caption text-grey-7">Questions</div>
                <div class="text-h6">{{ session.gameState?.totalQuestions || 0 }}</div>
              </div>
              <div class="col">
                <q-icon name="mdi-account-multiple" size="sm" color="grey-6" />
                <div class="text-caption text-grey-7">Participants</div>
                <div class="text-h6">{{ participants.length }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="shadow-2 q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md flex items-center">
              <q-icon name="mdi-account-group" class="q-mr-sm" />
              Participants
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

            <div
              v-if="loadingParticipants && participants.length === 0"
              class="text-center q-pa-lg"
            >
              <q-spinner color="primary" size="40px" />
              <div class="text-body2 text-grey-7 q-mt-sm">Chargement des participants...</div>
            </div>

            <div v-else-if="participants.length === 0" class="text-center q-pa-lg">
              <q-icon name="mdi-account-off" size="xl" color="grey-5" />
              <div class="text-body1 text-grey-7 q-mt-sm">Aucun participant pour le moment</div>
              <div class="text-caption text-grey-6">En attente d'autres joueurs...</div>
            </div>

            <div v-else class="q-gutter-sm">
              <q-list separator>
                <q-item
                  v-for="participant in participants"
                  :key="participant.userId"
                  class="q-pa-md"
                >
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white" size="xl">
                      <Avatar v-if="participant.avatar" :avatarUrl="participant.avatar" size="sm" />
                      <span v-else>{{ participant.userName?.[0]?.toUpperCase() || '?' }}</span>
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ participant.userName }}
                      <q-chip
                        v-if="participant.isOrganizer"
                        dense
                        color="primary"
                        text-color="white"
                        class="q-ml-sm"
                        size="sm"
                      >
                        <q-icon name="mdi-crown" size="xs" class="q-mr-xs" />
                        Organisateur
                      </q-chip>
                    </q-item-label>
                    <q-item-label caption>
                      {{ getConnectionStatusText(participant.connectionStatus) }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div class="row items-center q-gutter-xs">
                      <q-chip
                        :color="participant.isReady ? 'positive' : 'grey-4'"
                        :text-color="participant.isReady ? 'white' : 'grey-7'"
                        dense
                        size="md"
                      >
                        <q-icon
                          :name="participant.isReady ? 'mdi-check' : 'mdi-clock-outline'"
                          size="xs"
                          class="q-mr-xs"
                        />
                        {{ participant.isReady ? 'Prêt' : 'En attente' }}
                      </q-chip>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="shadow-2">
          <q-card-section>
            <div class="row q-gutter-md">
              <q-btn
                color="negative"
                icon-left="mdi-exit-to-app"
                label="Quitter"
                @click="showLeaveDialog = true"
                outline
                class="col-12 col-sm"
              />

              <q-btn
                color="secondary"
                :icon-left="isReady ? 'mdi-close' : 'mdi-check'"
                :label="isReady ? 'Annuler' : 'Prêt !'"
                @click="toggleReady"
                :loading="updatingReady"
                class="col-12 col-sm"
              />

              <q-btn
                v-if="isOrganizer"
                color="positive"
                icon-left="mdi-play"
                label="Démarrer la session"
                @click="startSession"
                :loading="starting"
                :disable="!canStart"
                class="col-12 col-sm"
              >
                <q-tooltip v-if="!canStart">
                  {{ startDisabledReason }}
                </q-tooltip>
              </q-btn>
            </div>

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

    <q-dialog v-model="showLeaveDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="mdi-help" color="orange" text-color="white" />
          <span class="q-ml-sm">Êtes-vous sûr de vouloir quitter la salle d'attente ?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" text-color="secondary" v-close-popup />
          <q-btn flat label="Quitter" color="negative" @click="leaveSession" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import SessionService from 'src/services/SessionService'
import UserService from 'src/services/UserService'
import SocketService from 'src/services/SocketService'
import Avatar from 'src/components/user/GetAvatar.vue'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const sessionId = computed(() => route.params.sessionId)
const sessionCodeFromRoute = computed(() => route.params.sessionCode)

const session = ref(null)
const participants = ref([])
const currentUser = ref(null)
const isReady = ref(false)
const loading = ref(true)
const loadingParticipants = ref(false)
const updatingReady = ref(false)
const starting = ref(false)
const showLeaveDialog = ref(false)
const connectionStatus = ref('connecting')

// WebSocket connection status
const socketConnected = ref(false)

const isOrganizer = computed(() => {
  if (!currentUser.value || !session.value) return false
  return (
    currentUser.value._id === session.value.organizerId ||
    participants.value.find((p) => p.userId === currentUser.value._id)?.isOrganizer
  )
})

const canStart = computed(() => {
  if (!isOrganizer.value) return false
  if (participants.value.length < 1) return false

  // Au moins un participant doit être prêt
  const nonOrganizerParticipants = participants.value.filter((p) => !p.isOrganizer)
  if (nonOrganizerParticipants.length === 0) {
    return true
  }

  return nonOrganizerParticipants.every((p) => p.isReady)
})

const startDisabledReason = computed(() => {
  if (!isOrganizer.value) return "Seul l'organisateur peut démarrer"
  if (participants.value.length < 1) return 'Il faut au moins 1 participant'

  const nonOrganizerParticipants = participants.value.filter((p) => !p.isOrganizer)
  if (nonOrganizerParticipants.length > 0 && !nonOrganizerParticipants.every((p) => p.isReady)) {
    return 'Tous les participants doivent être prêts'
  }

  return ''
})

const loadSession = async () => {
  try {
    loading.value = true
    let sessionData

    if (sessionId.value) {
      const response = await SessionService.getSessionState(sessionId.value)
      sessionData = response.data.session
    } else if (sessionCodeFromRoute.value) {
      const response = await SessionService.joinSessionByCode(sessionCodeFromRoute.value)
      sessionData = response.data.session
    } else {
      throw new Error('Aucun identifiant de session fourni')
    }

    session.value = sessionData

    if (sessionData.status === 'lobby') {
      await initializeSocketConnection()
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      position: 'top',
      message: error.message || 'Erreur lors du chargement de la session',
    })
    router.push('/accueil')
  } finally {
    loading.value = false
  }
}

const initializeSocketConnection = async () => {
  try {
    // Connecter le socket et attendre la connexion
    const socket = await SocketService.connect()
    if (!socket) {
      throw new Error('Impossible de se connecter au serveur')
    }

    // Configurer les événements
    setupSocketEventListeners()

    // Rejoindre le lobby via Socket.IO
    const actualSessionId = session.value.id || session.value._id
    SocketService.joinLobby(actualSessionId)

    socketConnected.value = true
    connectionStatus.value = 'connected'
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: "Impossible de rejoindre la salle d'attente",
    })
    socketConnected.value = false
    connectionStatus.value = 'disconnected'
  }
}

const setupSocketEventListeners = () => {
  // Lobby rejoint avec succès
  SocketService.onLobbyJoined((data) => {
    isReady.value = data.participant.isReady
    loadingParticipants.value = false
  })

  // Mise à jour de la liste des participants
  SocketService.onLobbyParticipantsUpdated((data) => {
    participants.value = data.participants
    if (data.session) {
      session.value.participantCount = data.session.participantCount
      session.value.status = data.session.status
    }

    // Trouver notre statut
    const me = participants.value.find((p) => p.userId === currentUser.value._id)
    if (me) {
      isReady.value = me.isReady
    }
  })

  // Utilisateur a rejoint
  SocketService.onLobbyUserJoined((data) => {
    $q.notify({
      type: 'positive',
      position: 'top',
      message: `${data.user.userName} a rejoint le lobby`,
    })
  })

  // Changement de statut prêt
  SocketService.onLobbyUserReadyChanged((data) => {
    const statusText = data.isReady ? 'est prêt' : "n'est plus prêt"
    $q.notify({
      type: 'info',
      position: 'top',
      message: `${data.userName} ${statusText}`,
      timeout: 1500,
    })
  })

  // Session démarrée
  SocketService.onLobbySessionStarted((data) => {
    const actualSessionId = session.value.id
    router.push(`/quiz/session/${actualSessionId}/play`)
  })

  // Erreurs
  SocketService.onError((error) => {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erreur de connexion',
    })
  })
}

const refreshParticipants = () => {
  // Pas besoin de refresh manuel avec WebSocket, mais on peut reconnecter si nécessaire
  if (!socketConnected.value) {
    initializeSocketConnection()
  }
}

const toggleReady = async () => {
  try {
    updatingReady.value = true
    const actualSessionId = session.value.id

    // Utiliser WebSocket au lieu de HTTP
    if (socketConnected.value) {
      SocketService.setReady(actualSessionId, !isReady.value)
      // Le changement de statut sera mis à jour via l'événement WebSocket
    } else {
      // Fallback HTTP si WebSocket pas disponible
      await SessionService.setSessionReady(actualSessionId, !isReady.value)
      isReady.value = !isReady.value
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la mise à jour du statut',
    })
  } finally {
    updatingReady.value = false
  }
}

const startSession = async () => {
  try {
    starting.value = true
    const actualSessionId = session.value.id || session.value._id

    // Utiliser WebSocket au lieu de HTTP
    if (socketConnected.value) {
      SocketService.startSession(actualSessionId)
      // La redirection se fera via l'événement WebSocket
    } else {
      // Fallback HTTP si WebSocket pas disponible
      await SessionService.startGameSession(actualSessionId)
      $q.notify({
        type: 'positive',
        position: 'top',
        message: 'Session démarrée !',
      })
      router.push(`/quiz/session/${actualSessionId}/play`)
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erreur lors du démarrage',
    })
  } finally {
    starting.value = false
  }
}

const leaveSession = async () => {
  try {
    const actualSessionId = session.value.id || session.value._id

    if (socketConnected.value) {
      SocketService.leaveLobby(actualSessionId)
    }

    await SessionService.leaveSessionLobby(actualSessionId)

    $q.notify({
      type: 'info',
      position: 'top',
      message: "Vous avez quitté la salle d'attente",
    })

    router.push('/accueil')
  } catch (error) {
    router.push('/accueil')
  }
}

const copyCode = () => {
  if (session.value?.sessionCode) {
    navigator.clipboard.writeText(session.value.sessionCode)
    $q.notify({
      type: 'positive',
      position: 'top',
      message: `Code ${session.value.sessionCode} copié !`,
    })
  }
}

const getConnectionStatusText = (status) => {
  switch (status) {
    case 'connected':
      return 'En ligne'
    case 'connecting':
      return 'Connexion...'
    case 'disconnected':
      return 'Déconnecté'
    default:
      return 'Inconnu'
  }
}

const getConnectionIcon = (status) => {
  switch (status) {
    case 'connected':
      return 'mdi-circle'
    case 'connecting':
      return 'mdi-loading'
    case 'disconnected':
      return 'mdi-circle-outline'
    default:
      return 'mdi-help-circle'
  }
}

const getConnectionColor = (status) => {
  switch (status) {
    case 'connected':
      return 'positive'
    case 'connecting':
      return 'orange'
    case 'disconnected':
      return 'negative'
    default:
      return 'grey'
  }
}

// Nettoyage WebSocket
const cleanupSocket = () => {
  if (socketConnected.value) {
    SocketService.removeAllListeners()
    SocketService.disconnect()
    socketConnected.value = false
  }
}

// Lifecycle
onMounted(async () => {
  try {
    const userResponse = await UserService.getMe()
    currentUser.value = userResponse.data.user

    await loadSession()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: "Erreur d'initialisation",
    })
    router.push('/accueil')
  }
})

onUnmounted(() => {
  cleanupSocket()
})

watch(
  () => session.value?.status,
  (newStatus) => {
    if (newStatus === 'playing') {
      $q.notify({
        type: 'info',
        position: 'top',
        message: 'La session a commencé !',
      })
      const actualSessionId = session.value.id || session.value._id
      router.push(`/quiz/session/${actualSessionId}/play`)
    }
  },
)
</script>

<style scoped>
.full-height {
  min-height: 100vh;
}
</style>
