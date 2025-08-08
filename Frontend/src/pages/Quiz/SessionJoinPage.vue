<template>
  <main class="full-width bg-gradient-primary" aria-label="Rejoindre une session de quiz">
    <section class="q-pa-lg rounded-borders-bottom">
      <div class="row justify-center">
        <div class="col-12 col-md-8 text-center">
          <div class="q-mb-lg">
            <h1 class="text-h3 text-secondary text-weight-bold q-mb-md">Rejoindre une Session</h1>
            <p class="text-h6 text-secondary q-mt-none q-mb-xl">
              Entrez le code de la session pour commencer à jouer
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Search code-->
    <section v-if="!foundSession" class="q-pa-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-6 col-lg-4">
          <div class="bg-white rounded-borders q-pa-xl text-center shadow-8">
            <div class="q-mb-xl">
              <q-icon name="mdi-key-variant" size="5rem" color="secondary" />
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
              class="text-center q-mb-xl"
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
              label="Rechercher la session"
              color="secondary"
              rounded
              size="lg"
              class="text-primary text-weight-bold q-px-xl q-py-sm q-mb-md full-width"
              :loading="loading"
              @click="searchSession"
              aria-label="Rechercher la session avec le code saisi"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Session found -->
    <section v-else class="q-pa-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="bg-white rounded-borders q-pa-xl shadow-8">
            <div class="q-mb-lg">
              <QuizObject :quiz="foundSession.quiz" size="md" />
            </div>

            <!-- organiser -->
            <div class="flex column text-center items-center q-mb-lg">
              <div class="text-h5 text-secondary q-mb-sm">Organisateur</div>
              <div class="flex items-center justify-center q-gutter-sm">
                <Avatar :avatarUrl="foundSession.organizer?.avatar" size="sm" />
                <span class="text-secondary text-weight-medium">{{
                  foundSession.organizer?.userName
                }}</span>
              </div>
            </div>

            <!-- session status -->
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
import SessionService from 'src/services/SessionService'
import QuizObject from 'src/components/quiz/QuizObject.vue'
import Avatar from 'src/components/user/GetAvatar.vue'

const router = useRouter()
const $q = useQuasar()

const sessionCode = ref('')
const foundSession = ref(null)
const loading = ref(false)
const joining = ref(false)
const error = ref('')

const canSearch = computed(() => {
  return sessionCode.value.length === 6
})

const canJoinSession = computed(() => {
  if (!foundSession.value) return false

  const status = foundSession.value.status
  return status === 'lobby' || (status === 'playing' && foundSession.value.settings?.allowLateJoin)
})

const onCodeInput = (value) => {
  sessionCode.value = QuizService.formatSessionCode(value)
  error.value = ''

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

    const response = await SessionService.joinSessionByCode(sessionCode.value)
    foundSession.value = response.data.session

    $q.notify({
      type: 'positive',
      position: 'top',
      message: 'Session trouvée !',
    })
  } catch (err) {
    console.error('Erreur recherche session:', err)
    error.value = err.message || 'Session non trouvée'
    foundSession.value = null

    $q.notify({
      type: 'negative',
      message: 'Session non trouvée avec ce code',
    })
  } finally {
    loading.value = false
  }
}

const joinSession = async () => {
  if (!foundSession.value || joining.value) return

  try {
    joining.value = true

    const sessionId = foundSession.value.id || foundSession.value._id

    if (foundSession.value.status === 'lobby') {
      router.push(`/quiz/session/${sessionId}/lobby`)
    } else if (
      foundSession.value.status === 'playing' &&
      foundSession.value.settings?.allowLateJoin
    ) {
      await SessionService.joinSessionLobby(sessionId)
      router.push(`/quiz/session/${sessionId}/play`)
    }
  } catch (error) {
    console.error('Erreur rejoindre session:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Impossible de rejoindre la session',
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

const getStatusColor = (status) => {
  switch (status) {
    case 'lobby':
      return 'info'
    case 'playing':
      return 'positive'
    case 'finished':
      return 'grey'
    case 'cancelled':
      return 'negative'
    default:
      return 'grey'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'lobby':
      return 'mdi-account-group'
    case 'playing':
      return 'mdi-play-circle'
    case 'finished':
      return 'mdi-flag-checkered'
    case 'cancelled':
      return 'mdi-cancel'
    default:
      return 'mdi-help-circle'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'lobby':
      return 'En attente'
    case 'playing':
      return 'En cours'
    case 'finished':
      return 'Terminée'
    case 'cancelled':
      return 'Annulée'
    default:
      return 'Inconnu'
  }
}
</script>
