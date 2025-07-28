<template>
  <div
    class="quiz-question bg-white rounded-borders q-pa-xl shadow-8"
    :class="{ 'disabled-question': disabled }"
  >
    <!-- En-tête de la question -->
    <div class="question-header text-center q-mb-xl">
      <div class="question-number text-h6 text-secondary q-mb-sm">
        Question {{ questionNumber }} / {{ totalQuestions }}
      </div>

      <h2 class="question-title text-h4 text-secondary text-weight-bold q-mb-md">
        {{ question.title }}
      </h2>

      <div v-if="question.description" class="question-description text-body1 text-grey-7 q-mb-lg">
        {{ question.description }}
      </div>

      <!-- Points de la question -->
      <q-chip color="accent" text-color="secondary" icon="star" class="text-weight-medium">
        {{ question.points || 100 }} points
      </q-chip>
    </div>

    <!-- Image de la question (si présente) -->
    <div v-if="question.image" class="question-image text-center q-mb-xl">
      <q-img
        :src="question.image"
        :alt="question.title"
        style="max-height: 300px; max-width: 100%"
        class="rounded-borders shadow-2"
        spinner-color="secondary"
      />
    </div>

    <!-- Réponses selon le type de question -->
    <div class="question-content">
      <!-- Questions à choix multiples -->
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
                  <!-- Indicateur de sélection -->
                  <div class="col-auto">
                    <q-icon
                      :name="
                        allowMultipleAnswers
                          ? selectedAnswers.includes(index)
                            ? 'check_box'
                            : 'check_box_outline_blank'
                          : selectedAnswers.includes(index)
                            ? 'radio_button_checked'
                            : 'radio_button_unchecked'
                      "
                      :color="selectedAnswers.includes(index) ? 'primary' : 'grey-6'"
                      size="lg"
                    />
                  </div>

                  <!-- Lettre de la réponse -->
                  <div class="col-auto">
                    <q-badge
                      :color="selectedAnswers.includes(index) ? 'primary' : 'secondary'"
                      :text-color="selectedAnswers.includes(index) ? 'secondary' : 'primary'"
                      class="answer-letter text-weight-bold"
                    >
                      {{ getAnswerLetter(index) }}
                    </q-badge>
                  </div>

                  <!-- Texte de la réponse -->
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

      <!-- Questions de type vrai/faux -->
      <div v-else-if="question.type === 'TRUE_FALSE'" class="true-false-answers">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          Cette affirmation est-elle vraie ou fausse ?
        </div>

        <div class="row q-gutter-lg justify-center">
          <div class="col-12 col-sm-5">
            <q-card
              flat
              bordered
              class="answer-card transition-all text-center"
              :class="{
                selected: selectedTrueFalse === true,
                'bg-positive text-white': selectedTrueFalse === true,
                'bg-grey-1 hover-shadow': selectedTrueFalse !== true && !disabled,
                'cursor-pointer': !disabled,
                'cursor-not-allowed opacity-60': disabled,
              }"
              @click="selectTrueFalse(true)"
            >
              <q-card-section class="q-pa-xl">
                <q-icon name="check_circle" size="3rem" class="q-mb-md" />
                <div class="text-h5 text-weight-bold">VRAI</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-5">
            <q-card
              flat
              bordered
              class="answer-card transition-all text-center"
              :class="{
                selected: selectedTrueFalse === false,
                'bg-negative text-white': selectedTrueFalse === false,
                'bg-grey-1 hover-shadow': selectedTrueFalse !== false && !disabled,
                'cursor-pointer': !disabled,
                'cursor-not-allowed opacity-60': disabled,
              }"
              @click="selectTrueFalse(false)"
            >
              <q-card-section class="q-pa-xl">
                <q-icon name="cancel" size="3rem" class="q-mb-md" />
                <div class="text-h5 text-weight-bold">FAUX</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Questions de remise en ordre -->
      <div v-else-if="question.type === 'ORDER'" class="order-answers">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          Glissez les éléments pour les remettre dans le bon ordre :
        </div>

        <!-- Composant draggable pour réorganiser les éléments -->
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
                    class="drag-handle flex flex-center bg-secondary text-white rounded-borders"
                    style="min-width: 32px; height: 32px"
                    :class="{
                      'cursor-grab': !disabled,
                      'cursor-not-allowed': disabled,
                    }"
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

        <!-- Instructions -->
        <div class="text-center q-mt-md">
          <q-chip dense color="info" text-color="white" icon="info" class="text-body2">
            {{ disabled ? 'Ordre soumis' : 'Glissez pour réorganiser' }}
          </q-chip>
        </div>
      </div>

      <!-- Questions d'association -->
      <div v-else-if="question.type === 'ASSOCIATION'" class="association-answers">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          Associez les éléments de gauche avec ceux de droite :
        </div>

        <div class="row q-col-gutter-lg">
          <!-- Colonne gauche -->
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

          <!-- Colonne du milieu avec les connexions -->
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
                  :color="pair.leftIndex !== null && pair.rightIndex !== null ? 'positive' : 'grey-4'"
                />
              </div>
            </div>
          </div>

          <!-- Colonne droite -->
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

        <!-- Instructions -->
        <div class="text-center q-mt-lg">
          <q-chip dense color="info" text-color="white" icon="info" class="text-body2">
            {{ disabled ? 'Associations soumises' : 'Cliquez pour associer les éléments' }}
          </q-chip>
        </div>
      </div>

      <!-- Questions pour trouver l'intrus -->
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
                  <!-- Indicateur de sélection -->
                  <div class="col-auto">
                    <q-icon
                      :name="selectedIntruder === index ? 'radio_button_checked' : 'radio_button_unchecked'"
                      :color="selectedIntruder === index ? 'white' : 'grey-6'"
                      size="lg"
                    />
                  </div>

                  <!-- Icône d'intrus si sélectionné -->
                  <div class="col-auto" v-if="selectedIntruder === index">
                    <q-icon name="search" color="white" size="lg" />
                  </div>

                  <!-- Texte de la réponse -->
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

      <!-- Questions de texte libre / Classique -->
      <div v-else-if="question.type === 'CLASSIC'" class="text-answer">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">Saisissez votre réponse :</div>

        <q-input
          v-model="textAnswer"
          outlined
          type="textarea"
          :rows="4"
          placeholder="Tapez votre réponse ici..."
          bg-color="grey-1"
          class="text-answer-input"
          :maxlength="question.maxLength || 500"
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
    default: () => ({
      title: '',
      type: 'multiple_choice',
      answers: [],
      points: 100,
    }),
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

// Computed properties pour ASSOCIATION
const leftItems = computed(() => {
  if (props.question.type === 'ASSOCIATION' && props.question.answers) {
    return props.question.answers.map(answer => answer.text.split('|')[0])
  }
  return []
})

const rightItems = computed(() => {
  if (props.question.type === 'ASSOCIATION' && props.question.answers) {
    return props.question.answers.map(answer => answer.text.split('|')[1])
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
      return associationPairs.value.length > 0 && 
             associationPairs.value.every(pair => pair.leftIndex !== null && pair.rightIndex !== null)
    case 'FIND_INTRUDER':
      return selectedIntruder.value !== null
    default:
      return false
  }
})

const getAnswerLetter = (index) => {
  return String.fromCharCode(65 + index)
}

const selectMultipleChoiceAnswer = (index) => {
  if (props.disabled) return

  if (props.allowMultipleAnswers) {
    const currentIndex = selectedAnswers.value.indexOf(index)
    if (currentIndex > -1) {
      selectedAnswers.value.splice(currentIndex, 1)
    } else {
      selectedAnswers.value.push(index)
    }
  } else {
    selectedAnswers.value = [index]
  }

  emitAnswer()
}

const selectTrueFalse = (value) => {
  if (props.disabled) return
  selectedTrueFalse.value = value
  emitAnswer()
}

// Méthodes pour ASSOCIATION
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
    // Créer une nouvelle association
    const newPair = {
      leftIndex: selectedLeftIndex.value,
      rightIndex: selectedRightIndex.value
    }
    
    // Vérifier si cette association existe déjà
    const existingPairIndex = associationPairs.value.findIndex(
      pair => pair.leftIndex === newPair.leftIndex && pair.rightIndex === newPair.rightIndex
    )
    
    if (existingPairIndex === -1) {
      // Supprimer les anciennes associations impliquant ces éléments
      associationPairs.value = associationPairs.value.filter(
        pair => pair.leftIndex !== newPair.leftIndex && pair.rightIndex !== newPair.rightIndex
      )
      
      // Ajouter la nouvelle association
      associationPairs.value.push(newPair)
    }
    
    // Réinitialiser les sélections
    selectedLeftIndex.value = null
    selectedRightIndex.value = null
    
    emitAnswer()
  }
}

// Méthode pour FIND_INTRUDER
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
      answer = associationPairs.value.map(pair => ({
        leftIndex: pair.leftIndex,
        rightIndex: pair.rightIndex
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

// Drag and drop handlers
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
    // Émettre l'événement answer-selected pour les questions textuelles
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
        return associationPairs.value.map(pair => ({
          leftIndex: pair.leftIndex,
          rightIndex: pair.rightIndex
        }))
      case 'FIND_INTRUDER':
        return selectedIntruder.value
      default:
        return null
    }
  },
})
</script>

<style scoped>
.quiz-question {
  max-width: 100%;
}

.question-title {
  line-height: 1.3;
}

.answer-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.answer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.answer-card.selected {
  border-color: var(--q-primary);
  transform: translateY(-2px);
}

.answer-letter {
  font-size: 1.1rem;
  min-width: 2rem;
  min-height: 2rem;
}

.order-card {
  transition: all 0.3s ease;
}

.order-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.text-answer-input {
  font-size: 1.1rem;
}

.transition-all {
  transition: all 0.3s ease;
}

/* État désactivé */
.disabled-question {
  pointer-events: none;
}

.disabled-question .answer-card:hover {
  transform: none;
  box-shadow: none;
}

/* Drag and drop styles */
.drag-handle {
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.ghost-item {
  opacity: 0.5;
  transform: rotate(2deg);
}

.order-container {
  min-height: 200px;
  padding: 1rem;
  border: 2px dashed transparent;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.order-container:hover {
  border-color: var(--q-primary);
  background-color: rgba(0, 0, 0, 0.02);
}

/* Responsive */
@media (max-width: 600px) {
  .question-title {
    font-size: 1.8rem;
  }

  .answer-text {
    font-size: 1.1rem;
  }

  .q-pa-xl {
    padding: 1rem;
  }

  .q-pa-lg {
    padding: 0.75rem;
  }
}
</style>
