<template>
  <div class="step-progress-container q-mb-lg" role="region" aria-label="Progression des étapes">
    <div
      class="step-progress-bar"
      role="progressbar"
      :aria-valuenow="currentStep + 1"
      :aria-valuemin="1"
      :aria-valuemax="steps.length"
      :aria-valuetext="`Étape ${currentStep + 1} sur ${steps.length}: ${steps[currentStep]?.label}`"
    >
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="step-item"
        :class="getStepClass(index)"
        @click="onStepClick(index)"
        @keydown.enter="onStepClick(index)"
        @keydown.space.prevent="onStepClick(index)"
        :tabindex="isStepAccessible(index) ? 0 : -1"
        role="button"
        :aria-label="`Étape ${index + 1}: ${step.label}${isStepCompleted(index) ? ' - Terminée' : index === currentStep ? ' - En cours' : isStepAccessible(index) ? ' - Accessible' : ' - Non accessible'}`"
        :aria-current="index === currentStep ? 'step' : false"
        :aria-disabled="!isStepAccessible(index)"
      >
        <!-- Connector line (except for the last step) -->
        <div
          v-if="index < steps.length - 1"
          class="step-connector"
          :class="getConnectorClass(index)"
          role="presentation"
          aria-hidden="true"
        ></div>

        <!-- Step circle -->
        <div class="step-circle" aria-hidden="true">
          <q-icon v-if="isStepCompleted(index)" name="check" size="18px" class="text-white" />
          <span v-else class="step-number" :class="getNumberClass(index)">
            {{ index + 1 }}
          </span>
        </div>

        <!-- Step label -->
        <div class="step-label" aria-hidden="true">
          <span :class="getLabelClass(index)">{{ step.label }}</span>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div
      class="step-navigation q-mt-xl row q-gutter-md justify-center"
      role="group"
      aria-label="Navigation entre les étapes"
    >
      <q-btn
        v-if="currentStep > 0"
        outline
        rounded
        color="secondary"
        text-color="primary"
        label="Précédent"
        @click="goToPreviousStep"
        class="col-auto q-px-lg"
        icon="chevron_left"
        tabindex="0"
        aria-label="Aller à l'étape précédente"
      />

      <q-btn
        v-if="currentStep < steps.length - 1"
        rounded
        color="secondary"
        text-color="primary"
        label="Suivant"
        @click="goToNextStep"
        :disable="!isCurrentStepValid"
        class="col-auto q-px-lg"
        icon-right="chevron_right"
        tabindex="0"
        aria-label="Aller à l'étape suivante"
        :aria-describedby="!isCurrentStepValid ? 'step-validation-message' : null"
      >
        <q-tooltip v-if="!isCurrentStepValid" class="bg-secondary" id="step-validation-message">
          {{ validationMessage }}
        </q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  steps: {
    type: Array,
    required: true,
  },
  currentStep: {
    type: Number,
    default: 0,
  },
  isCurrentStepValid: {
    type: Boolean,
    default: false,
  },
  validationMessage: {
    type: String,
    default: 'Veuillez compléter cette étape avant de continuer',
  },
})

const emit = defineEmits(['update:currentStep', 'step-change', 'next-step', 'previous-step'])

const isStepCompleted = (stepIndex) => {
  return stepIndex < props.currentStep
}

const isStepAccessible = (stepIndex) => {
  return stepIndex <= props.currentStep
}

const getStepClass = (index) => {
  const isCompleted = isStepCompleted(index)
  const isCurrent = index === props.currentStep
  const isAccessible = isStepAccessible(index)
  const isClickable = isAccessible

  return {
    'step-completed': isCompleted,
    'step-current': isCurrent,
    'step-accessible': isAccessible && !isCurrent && !isCompleted,
    'step-pending': !isAccessible,
    'step-clickable': isClickable,
  }
}

const getConnectorClass = (index) => {
  return {
    'connector-completed': isStepCompleted(index + 1),
    'connector-current': index === props.currentStep - 1 && props.currentStep > 0,
    'connector-pending': index >= props.currentStep,
  }
}

const getNumberClass = (index) => {
  const isCompleted = isStepCompleted(index)
  const isCurrent = index === props.currentStep

  return {
    'text-white': isCurrent || isCompleted,
    'text-secondary': !isCurrent && !isCompleted,
  }
}

const getLabelClass = (index) => {
  const isCompleted = isStepCompleted(index)
  const isCurrent = index === props.currentStep

  return {
    'text-secondary text-weight-bold': isCurrent,
    'text-secondary': isCompleted,
    // 'text-secondary': !isCurrent && !isCompleted,
  }
}

const onStepClick = (stepIndex) => {
  if (isStepAccessible(stepIndex)) {
    emit('update:currentStep', stepIndex)
    emit('step-change', stepIndex)
  }
}

const goToNextStep = () => {
  if (props.isCurrentStepValid && props.currentStep < props.steps.length - 1) {
    const nextStep = props.currentStep + 1
    emit('update:currentStep', nextStep)
    emit('next-step', nextStep)
    emit('step-change', nextStep)
  }
}

const goToPreviousStep = () => {
  if (props.currentStep > 0) {
    const previousStep = props.currentStep - 1
    emit('update:currentStep', previousStep)
    emit('previous-step', previousStep)
    emit('step-change', previousStep)
  }
}
</script>

<style lang="scss" scoped>
.step-progress-container {
  width: 100%;
  padding: 20px 0;
}

.step-progress-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;

  &.step-clickable {
    cursor: pointer;

    &:hover .step-circle {
      transform: scale(1.05);
      transition: transform 0.2s ease;
    }

    &:hover .step-label span {
      color: $dark80 !important;
    }
  }

  &:not(.step-clickable) {
    cursor: default;
  }
}

.step-connector {
  position: absolute;
  top: 20px;
  left: calc(50% + 25px);
  right: calc(-50% + 25px);
  height: 3px;
  z-index: 1;
  border-radius: 2px;

  &.connector-completed {
    background-color: $dark80;
  }

  &.connector-current {
    background: linear-gradient(to right, $dark80 50%, $normal60 50%);
  }

  &.connector-pending {
    background-color: $normal60;
  }
}

.step-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  border: 3px solid;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .step-completed & {
    background-color: $dark80;
    border-color: $dark80;
  }

  .step-current & {
    background-color: $dark80;
    border-color: $dark80;
    box-shadow: 0 0 0 4px rgba($dark80, 0.2);
  }

  .step-accessible & {
    background-color: $light20;
    border-color: $dark70;
  }

  .step-pending & {
    background-color: $light30;
    border-color: $normal60;
  }
}

.step-number {
  font-size: 18px;
  font-weight: 700;
}

.step-label {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  max-width: 140px;
  line-height: 1.4;

  span {
    transition: all 0.3s ease;
  }
}

.step-navigation {
  padding: 20px 0;

  .q-btn {
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .step-progress-bar {
    max-width: 100%;
    padding: 0 10px;
  }

  .step-circle {
    width: 40px;
    height: 40px;
    border-width: 2px;
  }

  .step-number {
    font-size: 16px;
  }

  .step-label {
    font-size: 12px;
    max-width: 100px;
    margin-top: 12px;
  }

  .step-connector {
    top: 20px;
    left: calc(50% + 20px);
    right: calc(-50% + 20px);
    height: 2px;
  }

  .step-navigation .q-btn {
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .step-progress-bar {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .step-connector {
    display: none;
  }

  .step-item {
    flex-direction: row;
    gap: 15px;
    width: 100%;
    max-width: 300px;
  }

  .step-label {
    margin-top: 0;
    text-align: left;
    flex: 1;
  }
}
</style>
