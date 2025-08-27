import { ref, computed, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import SocketService from 'src/services/SocketService'

/**
 * Manage game timer
 */
export function useGameTimer() {
  const $q = useQuasar()

  // État du timer
  const timeRemaining = ref(30000)
  const timeLimit = ref(30000)
  const timerInterval = ref(null)
  const isTimerStarted = ref(false)

  const timeProgress = computed(() => {
    if (timeLimit.value === 0) return 0
    return Math.max(0, (timeRemaining.value / timeLimit.value) * 100)
  })

  const timeRemainingSeconds = computed(() => {
    return Math.ceil(timeRemaining.value / 1000)
  })

  const isTimeUp = computed(() => {
    if (!isTimerStarted.value) return false
    return timeRemaining.value <= 0
  })

  const startTimer = (duration = timeLimit.value) => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }

    timeLimit.value = duration
    timeRemaining.value = duration
    isTimerStarted.value = true

    timerInterval.value = setInterval(() => {
      timeRemaining.value = Math.max(0, timeRemaining.value - 100)

      if (timeRemaining.value <= 0) {
        stopTimer()
      }
    }, 100)
  }

  const stopTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    isTimerStarted.value = false
  }

  const resetTimer = () => {
    stopTimer()
    timeRemaining.value = timeLimit.value
  }

  const setTimeRemaining = (time) => {
    timeRemaining.value = time
  }

  const setTimeLimit = (limit) => {
    timeLimit.value = limit
  }

  const setupTimerSocketListeners = () => {
    SocketService.onGameCurrentQuestion((data) => {
      const questionTimeLimit = (data.question.timeLimit || data.question.timeGiven || 30) * 1000
      const remainingTime = data.timeRemaining || questionTimeLimit

      setTimeLimit(questionTimeLimit)
      setTimeRemaining(remainingTime)
      startTimer(remainingTime)
    })

    SocketService.onGameTimeUp(() => {
      timeRemaining.value = 0
      stopTimer()

      $q.notify({
        type: 'info',
        position: 'top',
        message: 'Temps écoulé ! Passage automatique à la question suivante...',
      })
    })

    SocketService.onGameNewQuestion(() => {
      stopTimer()
    })

    SocketService.onGameSessionEnded(() => {
      stopTimer()
    })
  }

  onUnmounted(() => {
    stopTimer()
  })

  return {
    // state
    timeRemaining,
    timeLimit,
    isTimerStarted,

    // Computed
    timeProgress,
    timeRemainingSeconds,
    isTimeUp,

    // MMethods
    startTimer,
    stopTimer,
    resetTimer,
    setTimeRemaining,
    setTimeLimit,
    setupTimerSocketListeners,
  }
}
