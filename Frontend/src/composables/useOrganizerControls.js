import { ref } from 'vue'
import { useQuasar } from 'quasar'
import SessionService from 'src/services/SessionService'
import SocketService from 'src/services/SocketService'

/**
 * Composable pour gérer les contrôles organisateur
 * Extrait de SessionPlayPage.vue pour réutilisabilité
 */
export function useOrganizerControls(sessionId, isOrganizer, socketConnected) {
  const $q = useQuasar()

  // État des contrôles organisateur
  const showOrganizerPanel = ref(false)
  const loadingNext = ref(false)
  const ending = ref(false)

  // Méthodes de contrôle
  const nextQuestion = async () => {
    if (!isOrganizer.value) return

    try {
      loadingNext.value = true

      // Utiliser WebSocket pour passer à la question suivante
      if (socketConnected.value) {
        SocketService.nextQuestion(sessionId.value)
        // La réponse sera gérée via les événements WebSocket
      } else {
        // Fallback HTTP
        await SessionService.nextSessionQuestion(sessionId.value)
      }
    } catch (error) {
      console.error('Erreur question suivante:', error)
      $q.notify({
        type: 'negative',
        position: 'top',
        message: 'Erreur lors du passage à la question suivante',
      })
    } finally {
      loadingNext.value = false
    }
  }

  const endSession = async () => {
    if (!isOrganizer.value) return

    try {
      ending.value = true

      // Utiliser WebSocket pour terminer la session
      if (socketConnected.value) {
        SocketService.endSession(sessionId.value)
        // La fin sera gérée via les événements WebSocket
      } else {
        // Fallback HTTP
        await SessionService.endGameSession(sessionId.value)
      }
    } catch (error) {
      console.error('Erreur fin de session:', error)
      $q.notify({
        type: 'negative',
        position: 'top',
        message: 'Erreur lors de la fin de session',
      })
    } finally {
      ending.value = false
    }
  }

  // Configuration des événements WebSocket pour l'organisateur
  const setupOrganizerSocketListeners = () => {
    // Nouvelle question - réinitialiser l'état de chargement
    SocketService.onGameNewQuestion(() => {
      loadingNext.value = false
    })

    // Session terminée - réinitialiser l'état
    SocketService.onGameSessionEnded(() => {
      ending.value = false
      loadingNext.value = false
    })

    // Optionnel : notification quand un participant répond
    SocketService.onGameParticipantAnswered((data) => {
      if (isOrganizer.value) {
        // Notification discrète pour l'organisateur
        // $q.notify({
        //   type: 'info',
        //   message: `${data.userName} a répondu ${data.isCorrect ? 'correctement' : 'incorrectement'}`,
        //   timeout: 1500,
        //   position: 'bottom-right'
        // })
      }
    })
  }

  return {
    // État
    showOrganizerPanel,
    loadingNext,
    ending,

    // Méthodes
    nextQuestion,
    endSession,
    setupOrganizerSocketListeners,
  }
}
