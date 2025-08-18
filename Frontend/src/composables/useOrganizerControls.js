import { ref } from 'vue'
import SessionService from 'src/services/SessionService'
import SocketService from 'src/services/SocketService'

/**
 * Composable pour gérer les contrôles organisateur
 * Extrait de SessionPlayPage.vue pour réutilisabilité
 */
export function useOrganizerControls(sessionId, isOrganizer, socketConnected) {
  // État des contrôles organisateur
  const showOrganizerPanel = ref(false)
  const loadingNext = ref(false)
  const ending = ref(false)

  // Méthodes de contrôle
  const nextQuestion = async () => {
    if (!isOrganizer.value) return

    try {
      loadingNext.value = true

      // Privilégier WebSocket
      if (socketConnected.value && SocketService.isSocketConnected()) {
        console.log('🔄 Question suivante via WebSocket')
        const success = SocketService.nextQuestion(sessionId.value)
        if (!success) {
          throw new Error('Échec envoi commande WebSocket')
        }
        // La réponse sera gérée via les événements WebSocket
      } else {
        console.log('🔄 Question suivante via HTTP (fallback)')
        await SessionService.nextSessionQuestion(sessionId.value)
        loadingNext.value = false
      }
    } catch (error) {
      console.error('Erreur question suivante:', error)
      // Erreur gérée automatiquement par l'intercepteur global
      loadingNext.value = false
    }
  }

  const endSession = async () => {
    if (!isOrganizer.value) {
      console.log('❌ Non organisateur - fin de session refusée')
      return
    }

    try {
      ending.value = true
      console.log('🛑 Tentative de fin de session:', sessionId.value)

      // Privilégier WebSocket
      if (socketConnected.value && SocketService.isSocketConnected()) {
        console.log('🔌 Fin de session via WebSocket')
        const success = SocketService.endSession(sessionId.value)
        if (!success) {
          throw new Error("Impossible d'envoyer la commande via WebSocket")
        }
        // La fin sera gérée via les événements WebSocket
      } else {
        console.log('🌐 Fin de session via HTTP (fallback)')
        await SessionService.endGameSession(sessionId.value)
        ending.value = false
        console.log('✅ Fin de session HTTP réussie')
      }
    } catch (error) {
      console.error('Erreur fin de session:', error)
      // Erreur gérée automatiquement par l'intercepteur global
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
        console.log(
          `📝 ${data.userName} a répondu ${data.isCorrect ? 'correctement' : 'incorrectement'}`,
        )
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
