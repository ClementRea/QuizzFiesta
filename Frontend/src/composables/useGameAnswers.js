import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import SessionService from 'src/services/SessionService'
import SocketService from 'src/services/SocketService'

/**
 * Manager game answers
 */
export function useGameAnswers(sessionId, participantState) {
  const $q = useQuasar()

  const currentAnswer = ref(null)
  const hasAnswered = ref(false)
  const canSubmit = ref(false)
  const submitting = ref(false)
  const lastResult = ref(null)

  const isAnswerReady = computed(() => {
    return currentAnswer.value && canSubmit.value && !hasAnswered.value
  })

  const onAnswerSelected = (answerData) => {
    currentAnswer.value = answerData
    canSubmit.value = answerData.hasAnswered
  }

  const onAnswerChanged = (hasAnswer) => {
    canSubmit.value = hasAnswer
  }

  const resetAnswerState = () => {
    currentAnswer.value = null
    hasAnswered.value = false
    canSubmit.value = false
    lastResult.value = null
  }

  const submitCurrentAnswer = async (currentQuestion, socketConnected) => {
    if (!currentAnswer.value || submitting.value || !currentQuestion) return

    try {
      submitting.value = true

      if (socketConnected.value) {
        SocketService.submitAnswer(
          sessionId.value,
          currentQuestion.value?.id,
          currentAnswer.value.answer,
        )
        hasAnswered.value = true
        canSubmit.value = false
      } else {
        const response = await SessionService.submitSessionAnswer(
          sessionId.value,
          currentQuestion.value?.id,
          currentAnswer.value.answer,
        )

        hasAnswered.value = true
        canSubmit.value = false
        lastResult.value = response.data

        if (participantState.value) {
          participantState.value.totalScore = response.data.totalScore
        }
      }
    } catch (error) {
      console.error('Erreur soumission réponse:', error)
      $q.notify({
        type: 'negative',
        position: 'top',
        message: error.message || "Erreur lors de l'envoi",
      })
    } finally {
      submitting.value = false
    }
  }

  const setupAnswerSocketListeners = () => {
    SocketService.onGameAnswerResult((result) => {
      lastResult.value = result

      if (participantState.value) {
        participantState.value.totalScore = result.totalScore
      }

      if (result.isCorrect) {
        $q.notify({
          type: 'positive',
          position: 'top',
          message: `Bonne réponse ! +${result.points} points`,
          timeout: 2000
        })
      } else {
        $q.notify({
          type: 'info',
          position: 'top',
          message: 'Réponse incorrecte',
          timeout: 2000
        })
      }
    })

    SocketService.onGameNewQuestion(() => {
      resetAnswerState()
    })

    SocketService.onGameCurrentQuestion(() => {
      resetAnswerState()
    })
  }

  const formatCorrectAnswer = (answer) => {
    if (Array.isArray(answer)) {
      return answer.join(', ')
    }
    return String(answer)
  }

  return {
    // state
    currentAnswer,
    hasAnswered,
    canSubmit,
    submitting,
    lastResult,

    // Computed
    isAnswerReady,

    // Methods
    onAnswerSelected,
    onAnswerChanged,
    resetAnswerState,
    submitCurrentAnswer,
    setupAnswerSocketListeners,
    formatCorrectAnswer
  }
}
