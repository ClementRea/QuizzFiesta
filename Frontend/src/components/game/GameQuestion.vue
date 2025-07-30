<template>
  <div
    class="quiz-question bg-white rounded-borders q-pa-lg shadow-8"
    :class="{ 'disabled-question': disabled }"
  >
    <div class="question-header text-center q-mb-md">
      <h2 class="question-title text-h4 text-secondary text-weight-bold q-mb-md">
        {{ question.title }}
      </h2>

      <q-chip color="accent" text-color="secondary" icon="star" class="text-weight-medium">
        {{ question.points }} points
      </q-chip>
    </div>

    <div class="question-content">
      <div v-if="question.type === 'MULTIPLE_CHOICE'" class="multiple-choice-answers">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          {{
            allowMultipleAnswers
              ? 'Sélectionnez une ou plusieurs réponses :'
              : 'Sélectionnez une réponse :'
          }}
        </div>

        <div class="q-gutter-md">
          <div
            v-for="(answer, index) in question.answers"
            :key="index"
            class="answer-option"
            @click="selectMultipleChoiceAnswer(index)"
          >
            <q-card
              flat
              bordered
              class="answer-card transition-all"
              :class="{
                selected: selectedAnswers.includes(index),
                'bg-secondary text-primary': selectedAnswers.includes(index),
                'bg-grey-1 hover-shadow': !selectedAnswers.includes(index) && !disabled,
                'cursor-pointer': !disabled,
                'cursor-not-allowed opacity-60': disabled,
              }"
            >
              <q-card-section class="q-pa-lg">
                <div class="row items-center q-gutter-md no-wrap">
                  <div class="col-auto">
                    <q-icon
                      :name="
                        selectedAnswers.includes(index) ? 'check_box' : 'check_box_outline_blank'
                      "
                      :color="selectedAnswers.includes(index) ? 'primary' : 'grey-6'"
                      size="lg"
                    />
                  </div>

                  <div class="col">
                    <div class="answer-text text-h6 text-weight-medium">
                      {{ answer.text }}
                    </div>
                    <div
                      v-if="answer.description"
                      class="answer-description text-body2 text-grey-6 q-mt-xs"
                    >
                      {{ answer.description }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- ORDER-->
      <div v-else-if="question.type === 'ORDER'" class="order-answers">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          Glissez les éléments pour les remettre dans le bon ordre :
        </div>

        <VueDraggable
          v-model="orderItems"
          :disabled="disabled"
          item-key="id"
          handle=".drag-handle"
          animation="300"
          ghost-class="ghost-item"
          @end="onDragEnd"
        >
          <template v-for="(element, index) in orderItems" :key="element.id">
            <div class="order-item q-mb-sm">
              <q-card
                flat
                bordered
                class="order-card q-pa-md transition-all"
                :class="{
                  'bg-grey-1': !disabled,
                  'bg-grey-3 opacity-60': disabled,
                }"
              >
                <div class="row items-center q-gutter-md no-wrap">
                  <div
                    class="drag-handle flex flex-center bg-secondary text-white rounded-borders q-mx-none q-my-none q-pa-none"
                    :class="[
                      !disabled ? 'cursor-grab' : 'cursor-not-allowed',
                      'q-mx-none',
                      'q-my-none',
                      'q-pa-none',
                      'q-size-md',
                    ]"
                  >
                    <q-icon name="mdi-drag" size="20px" :color="disabled ? 'grey-4' : 'white'" />
                  </div>
                  <div class="text-body1 text-weight-medium col">{{ element.text }}</div>
                  <q-badge
                    :color="disabled ? 'grey-4' : 'secondary'"
                    :text-color="disabled ? 'grey-6' : 'primary'"
                  >
                    {{ index + 1 }}
                  </q-badge>
                </div>
              </q-card>
            </div>
          </template>
        </VueDraggable>

        <div class="text-center q-mt-md">
          <q-chip dense color="info" text-color="white" icon="info" class="text-body2">
            {{ disabled ? 'Ordre soumis' : 'Glissez pour réorganiser' }}
          </q-chip>
        </div>
      </div>

      <!-- ASSOCIATION -->
      <div v-else-if="question.type === 'ASSOCIATION'" class="association-answers">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          Associez les éléments de gauche avec ceux de droite :
        </div>

        <div class="row q-col-gutter-lg">
          <div class="col-5">
            <h6 class="text-secondary text-center q-mb-md">Éléments A</h6>
            <div class="q-gutter-sm">
              <div
                v-for="(leftItem, index) in leftItems"
                :key="`left-${index}`"
                class="association-item"
              >
                <q-card
                  flat
                  bordered
                  class="answer-card transition-all text-center q-pa-md"
                  :class="{
                    'cursor-pointer': !disabled,
                    'cursor-not-allowed opacity-60': disabled,
                    'bg-secondary text-primary': selectedLeftIndex === index,
                    'bg-grey-1 hover-shadow': selectedLeftIndex !== index && !disabled,
                  }"
                  @click="selectLeftItem(index)"
                >
                  <div class="text-body1 text-weight-medium">
                    {{ leftItem }}
                  </div>
                </q-card>
              </div>
            </div>
          </div>

          <div class="col-2 flex flex-center">
            <div class="association-connections">
              <div
                v-for="(pair, index) in associationPairs"
                :key="`connection-${index}`"
                class="connection-line q-mb-md text-center"
              >
                <q-icon
                  name="link"
                  size="24px"
                  :color="
                    pair.leftIndex !== null && pair.rightIndex !== null ? 'positive' : 'grey-4'
                  "
                />
              </div>
            </div>
          </div>

          <div class="col-5">
            <h6 class="text-secondary text-center q-mb-md">Éléments B</h6>
            <div class="q-gutter-sm">
              <div
                v-for="(rightItem, index) in rightItems"
                :key="`right-${index}`"
                class="association-item"
              >
                <q-card
                  flat
                  bordered
                  class="answer-card transition-all text-center q-pa-md"
                  :class="{
                    'cursor-pointer': !disabled,
                    'cursor-not-allowed opacity-60': disabled,
                    'bg-secondary text-primary': selectedRightIndex === index,
                    'bg-grey-1 hover-shadow': selectedRightIndex !== index && !disabled,
                  }"
                  @click="selectRightItem(index)"
                >
                  <div class="text-body1 text-weight-medium">
                    {{ rightItem }}
                  </div>
                </q-card>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center q-mt-lg">
          <q-chip dense color="info" text-color="white" icon="info" class="text-body2">
            {{ disabled ? 'Associations soumises' : 'Cliquez pour associer les éléments' }}
          </q-chip>
        </div>
      </div>

      <!-- FIND INTRUDER -->
      <div v-else-if="question.type === 'FIND_INTRUDER'" class="find-intruder-answers">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          Cliquez sur l'élément qui ne fait pas partie du groupe :
        </div>

        <div class="q-gutter-md">
          <div
            v-for="(answer, index) in question.answers"
            :key="index"
            class="answer-option"
            @click="selectIntruder(index)"
          >
            <q-card
              flat
              bordered
              class="answer-card transition-all"
              :class="{
                selected: selectedIntruder === index,
                'bg-negative text-white': selectedIntruder === index,
                'bg-grey-1 hover-shadow': selectedIntruder !== index && !disabled,
                'cursor-pointer': !disabled,
                'cursor-not-allowed opacity-60': disabled,
              }"
            >
              <q-card-section class="q-pa-lg">
                <div class="row items-center q-gutter-md no-wrap">
                  <div class="col-auto">
                    <q-icon
                      :name="
                        selectedIntruder === index
                          ? 'radio_button_checked'
                          : 'radio_button_unchecked'
                      "
                      :color="selectedIntruder === index ? 'white' : 'grey-6'"
                      size="lg"
                    />
                  </div>

                  <div class="col-auto" v-if="selectedIntruder === index">
                    <q-icon name="search" color="white" size="lg" />
                  </div>

                  <div class="col">
                    <div class="answer-text text-h6 text-weight-medium">
                      {{ answer.text }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- CLASSIC -->
      <div v-else-if="question.type === 'CLASSIC'" class="text-answer">
        <q-input
          v-model="textAnswer"
          outlined
          type="textarea"
          :rows="4"
          placeholder="Tapez votre réponse ici..."
          bg-color="white"
          label-color="secondary"
          color="secondary"
          class="text-answer-input"
          :maxlength="150"
          :disable="disabled"
          counter
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  questionNumber: {
    type: Number,
    default: 1,
  },
  totalQuestions: {
    type: Number,
    default: 1,
  },
  allowMultipleAnswers: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['answer-selected', 'answer-changed'])

const selectedAnswers = ref([])
const selectedTrueFalse = ref(null)
const orderItems = ref([])
const textAnswer = ref('')
const associationPairs = ref([])
const selectedIntruder = ref(null)
const selectedLeftIndex = ref(null)
const selectedRightIndex = ref(null)

const leftItems = computed(() => {
  if (props.question.type === 'ASSOCIATION' && props.question.answers) {
    return props.question.answers.map((answer) => answer.text.split('|')[0])
  }
  return []
})

const rightItems = computed(() => {
  if (props.question.type === 'ASSOCIATION' && props.question.answers) {
    return props.question.answers.map((answer) => answer.text.split('|')[1])
  }
  return []
})

const hasAnswered = computed(() => {
  switch (props.question.type) {
    case 'MULTIPLE_CHOICE':
      return selectedAnswers.value.length > 0
    case 'TRUE_FALSE':
      return selectedTrueFalse.value !== null
    case 'ORDER':
      return orderItems.value.length > 0
    case 'CLASSIC':
      return textAnswer.value.trim().length > 0
    case 'ASSOCIATION':
      return (
        associationPairs.value.length > 0 &&
        associationPairs.value.every((pair) => pair.leftIndex !== null && pair.rightIndex !== null)
      )
    case 'FIND_INTRUDER':
      return selectedIntruder.value !== null
    default:
      return false
  }
})

const selectMultipleChoiceAnswer = (index) => {
  if (props.disabled) return

  const currentIndex = selectedAnswers.value.indexOf(index)
  if (currentIndex > -1) {
    selectedAnswers.value.splice(currentIndex, 1)
  } else {
    selectedAnswers.value.push(index)
  }

  emitAnswer()
}

const selectLeftItem = (index) => {
  if (props.disabled) return
  selectedLeftIndex.value = index
  tryCreateAssociation()
}

const selectRightItem = (index) => {
  if (props.disabled) return
  selectedRightIndex.value = index
  tryCreateAssociation()
}

const tryCreateAssociation = () => {
  if (selectedLeftIndex.value !== null && selectedRightIndex.value !== null) {
    const newPair = {
      leftIndex: selectedLeftIndex.value,
      rightIndex: selectedRightIndex.value,
    }

    const existingPairIndex = associationPairs.value.findIndex(
      (pair) => pair.leftIndex === newPair.leftIndex && pair.rightIndex === newPair.rightIndex,
    )

    if (existingPairIndex === -1) {
      associationPairs.value = associationPairs.value.filter(
        (pair) => pair.leftIndex !== newPair.leftIndex && pair.rightIndex !== newPair.rightIndex,
      )

      associationPairs.value.push(newPair)
    }

    selectedLeftIndex.value = null
    selectedRightIndex.value = null

    emitAnswer()
  }
}

// FIND_INTRUDER
const selectIntruder = (index) => {
  if (props.disabled) return
  selectedIntruder.value = index
  emitAnswer()
}

const emitAnswer = () => {
  let answer = null

  switch (props.question.type) {
    case 'MULTIPLE_CHOICE':
      answer = props.allowMultipleAnswers ? selectedAnswers.value : selectedAnswers.value[0]
      break
    case 'TRUE_FALSE':
      answer = selectedTrueFalse.value
      break
    case 'ORDER':
      answer = orderItems.value.map((item) => item.text)
      break
    case 'CLASSIC':
      answer = textAnswer.value.trim()
      break
    case 'ASSOCIATION':
      answer = associationPairs.value.map((pair) => ({
        leftIndex: pair.leftIndex,
        rightIndex: pair.rightIndex,
      }))
      break
    case 'FIND_INTRUDER':
      answer = selectedIntruder.value
      break
  }

  emit('answer-selected', {
    questionId: props.question.id,
    answer,
    hasAnswered: hasAnswered.value,
  })
}

const onDragEnd = () => {
  emitAnswer()
}

const initializeOrderItems = () => {
  if (props.question.type === 'ORDER' && props.question.items) {
    orderItems.value = [...props.question.items]
      .map((item, index) => ({
        ...item,
        id: item.id || `item-${index}-${Date.now()}`,
      }))
      .sort(() => Math.random() - 0.5)
  }
}

const resetAnswers = () => {
  selectedAnswers.value = []
  selectedTrueFalse.value = null
  textAnswer.value = ''
  associationPairs.value = []
  selectedIntruder.value = null
  selectedLeftIndex.value = null
  selectedRightIndex.value = null
  initializeOrderItems()
}

watch(
  () => props.question,
  () => {
    resetAnswers()
  },
  { immediate: true },
)

watch(
  [selectedAnswers, selectedTrueFalse, textAnswer, associationPairs, selectedIntruder],
  () => {
    emit('answer-changed', hasAnswered.value)
    if (props.question.type === 'CLASSIC' && textAnswer.value.trim().length > 0) {
      emitAnswer()
    }
  },
  { deep: true },
)

defineExpose({
  resetAnswers,
  hasAnswered,
  getSelectedAnswer: () => {
    switch (props.question.type) {
      case 'MULTIPLE_CHOICE':
        return props.allowMultipleAnswers ? selectedAnswers.value : selectedAnswers.value[0]
      case 'TRUE_FALSE':
        return selectedTrueFalse.value
      case 'ORDER':
        return orderItems.value.map((item) => item.text)
      case 'CLASSIC':
        return textAnswer.value.trim()
      case 'ASSOCIATION':
        return associationPairs.value.map((pair) => ({
          leftIndex: pair.leftIndex,
          rightIndex: pair.rightIndex,
        }))
      case 'FIND_INTRUDER':
        return selectedIntruder.value
      default:
        return null
    }
  },
})
</script>

<!-- <style scoped>
.quiz-question {
  max-width: 100%;
}

.question-title {
  line-height: 1.3;
}

.answer-card {
  border: 2px solid transparent;
}

.answer-card.selected {
  border-color: var(--q-primary);
}

.answer-letter {
  font-size: 1.1rem;
  min-width: 2rem;
  min-height: 2rem;
}

.text-answer-input {
  font-size: 1.1rem;
}

.disabled-question {
  pointer-events: none;
}

.drag-handle {
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.order-container {
  min-height: 200px;
  padding: 1rem;
  border: 2px dashed transparent;
  border-radius: 0.5rem;
}
</style> -->
