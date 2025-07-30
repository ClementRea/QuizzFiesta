<template>
  <div class="quiz-timer bg-white rounded-borders q-pa-lg shadow-4">
    <div class="text-center">
      <!-- Titre du timer -->
      <div class="text-h6 text-secondary q-mb-md">
        <q-icon name="access_time" class="q-mr-sm" />
        {{ title }}
      </div>

      <!-- Progress bar principale -->
      <div class="timer-container q-mb-md">
        <q-linear-progress
          :value="progressValue"
          :color="currentColor"
          size="25px"
          rounded
          class="timer-progress"
          :class="{ 'pulse-animation': isWarning }"
        >
          <div class="absolute-full flex flex-center">
            <q-badge 
              :color="badgeColor" 
              :text-color="badgeTextColor"
              class="text-weight-bold"
            >
              {{ formattedTime }}
            </q-badge>
          </div>
        </q-linear-progress>
      </div>

      <!-- Affichage du temps en grand -->
      <div 
        class="time-display text-weight-bold q-mb-sm"
        :class="`text-${currentColor}`"
      >
        {{ formattedTime }}
      </div>

      <!-- Message d'état -->
      <div class="text-caption text-grey-6">
        {{ statusMessage }}
      </div>

      <!-- Indicateur sonore/visuel pour les dernières secondes -->
      <div v-if="isUrgent" class="urgent-indicator q-mt-sm">
        <q-icon 
          name="warning" 
          color="negative" 
          size="md" 
          class="animated-warning"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // Temps total en secondes
  totalTime: {
    type: Number,
    required: true,
    default: 30
  },
  // Temps restant en secondes
  timeLeft: {
    type: Number,
    required: true,
    default: 30
  },
  // Titre affiché au-dessus du timer
  title: {
    type: String,
    default: 'Temps restant'
  },
  // Seuils pour les changements de couleur (en pourcentage)
  warningThreshold: {
    type: Number,
    default: 0.3 // 30%
  },
  urgentThreshold: {
    type: Number,
    default: 0.1 // 10%
  },
  // État du timer
  isPaused: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['timeUp', 'warning', 'urgent'])

// État interne
const hasWarningEmitted = ref(false)
const hasUrgentEmitted = ref(false)

// Computed properties
const progressValue = computed(() => {
  if (props.totalTime <= 0) return 0
  return Math.max(0, Math.min(1, props.timeLeft / props.totalTime))
})

const currentColor = computed(() => {
  const progress = progressValue.value
  
  if (progress <= props.urgentThreshold) {
    return 'negative' // Rouge
  } else if (progress <= props.warningThreshold) {
    return 'warning' // Orange
  } else {
    return 'positive' // Vert
  }
})

const badgeColor = computed(() => {
  // Badge avec couleur inversée pour le contraste
  const progress = progressValue.value
  
  if (progress <= props.urgentThreshold) {
    return 'white'
  } else if (progress <= props.warningThreshold) {
    return 'white'
  } else {
    return 'white'
  }
})

const badgeTextColor = computed(() => {
  return currentColor.value
})

const isWarning = computed(() => {
  return progressValue.value <= props.warningThreshold && progressValue.value > props.urgentThreshold
})

const isUrgent = computed(() => {
  return progressValue.value <= props.urgentThreshold
})

const formattedTime = computed(() => {
  const minutes = Math.floor(props.timeLeft / 60)
  const seconds = props.timeLeft % 60
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${seconds}s`
  }
})

const statusMessage = computed(() => {
  if (props.isPaused) {
    return 'Timer en pause'
  }
  
  if (isUrgent.value) {
    return 'Dépêchez-vous !'
  } else if (isWarning.value) {
    return 'Plus que quelques secondes...'
  } else {
    return 'Prenez votre temps'
  }
})

// Watchers pour émettre les événements
watch(() => props.timeLeft, (newTime) => {
  // Temps écoulé
  if (newTime <= 0) {
    emit('timeUp')
    return
  }
  
  const progress = progressValue.value
  
  // Émettre warning une seule fois
  if (progress <= props.warningThreshold && !hasWarningEmitted.value) {
    hasWarningEmitted.value = true
    emit('warning', newTime)
  }
  
  // Émettre urgent une seule fois
  if (progress <= props.urgentThreshold && !hasUrgentEmitted.value) {
    hasUrgentEmitted.value = true
    emit('urgent', newTime)
  }
})

// Reset des flags quand on redémarre le timer
watch(() => props.totalTime, () => {
  hasWarningEmitted.value = false
  hasUrgentEmitted.value = false
})

// Méthodes
const resetFlags = () => {
  hasWarningEmitted.value = false
  hasUrgentEmitted.value = false
}

// Exposer les méthodes pour le parent
defineExpose({
  resetFlags
})

// Lifecycle
onMounted(() => {
  resetFlags()
})
</script>

<style scoped>
.quiz-timer {
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.timer-container {
  position: relative;
}

.timer-progress {
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.time-display {
  font-size: 2.5rem;
  transition: all 0.3s ease;
}

/* Animations */
.pulse-animation {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}

.animated-warning {
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

.urgent-indicator {
  animation: blink 0.5s infinite;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
}

/* Responsive */
@media (max-width: 600px) {
  .time-display {
    font-size: 2rem;
  }
  
  .timer-progress {
    size: 20px;
  }
}
</style>