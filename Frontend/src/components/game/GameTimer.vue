<template>
  <div class="text-center">
    <div class="timer-container q-mb-md">
      <q-linear-progress
        rounded
        size="25px"
        :value="progressValue"
        :color="currentColor"
        class="q-mt-sm"
      >
        <div class="absolute-full flex flex-center">
          <q-badge :color="badgeColor" :text-color="badgeTextColor" class="text-weight-bold">
            {{ formattedTime }}
          </q-badge>
        </div>
      </q-linear-progress>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  totalTime: {
    type: Number,
    required: true,
  },
  timeLeft: {
    type: Number,
    required: true,
  },
  warningThreshold: {
    type: Number,
    default: 0.3,
  },
  urgentThreshold: {
    type: Number,
    default: 0.1,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['timeUp', 'warning', 'urgent'])

const hasWarningEmitted = ref(false)
const hasUrgentEmitted = ref(false)

const progressValue = computed(() => {
  if (props.totalTime <= 0) return 0
  return Math.max(0, Math.min(1, props.timeLeft / props.totalTime))
})

const currentColor = computed(() => {
  const progress = progressValue.value

  if (progress <= props.urgentThreshold) {
    return 'negative'
  } else if (progress <= props.warningThreshold) {
    return 'warning'
  } else {
    return 'positive'
  }
})

const badgeColor = computed(() => {
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

watch(
  () => props.totalTime,
  (newTotalTime, oldTotalTime) => {
    if (newTotalTime !== oldTotalTime && newTotalTime > 0) {
      hasWarningEmitted.value = false
      hasUrgentEmitted.value = false
    }
  },
)

watch(
  () => props.timeLeft,
  (newTime) => {
    const progress = progressValue.value
    if (
      progress <= props.warningThreshold &&
      progress > props.urgentThreshold &&
      !hasWarningEmitted.value
    ) {
      hasWarningEmitted.value = true
      emit('warning', props.timeLeft)
    }
    if (progress <= props.urgentThreshold && !hasUrgentEmitted.value) {
      hasUrgentEmitted.value = true
      emit('urgent', props.timeLeft)
    }
    if (newTime <= 0) {
      emit('timeUp')
    }
  },
)

const formattedTime = computed(() => {
  const minutes = Math.floor(props.timeLeft / 60)
  const seconds = props.timeLeft % 60

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${seconds}s`
  }
})

const resetFlags = () => {
  hasWarningEmitted.value = false
  hasUrgentEmitted.value = false
}

defineExpose({
  resetFlags,
})

onMounted(() => {
  resetFlags()
})

onUnmounted(() => {})
</script>

<style scoped>
.timer-container {
  width: 100%;
}
</style>
