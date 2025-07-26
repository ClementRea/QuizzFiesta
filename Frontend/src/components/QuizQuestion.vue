<template>
  <div class="quiz-question bg-white rounded-borders q-pa-xl shadow-8">
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
      <q-chip 
        color="accent" 
        text-color="secondary" 
        icon="star"
        class="text-weight-medium"
      >
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
      <div v-if="question.type === 'multiple_choice'" class="multiple-choice-answers">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          {{ allowMultipleAnswers ? 'Sélectionnez une ou plusieurs réponses :' : 'Sélectionnez une réponse :' }}
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
              class="cursor-pointer answer-card transition-all"
              :class="{
                'selected': selectedAnswers.includes(index),
                'bg-secondary text-primary': selectedAnswers.includes(index),
                'bg-grey-1 hover-shadow': !selectedAnswers.includes(index)
              }"
            >
              <q-card-section class="q-pa-lg">
                <div class="row items-center q-gutter-md no-wrap">
                  <!-- Indicateur de sélection -->
                  <div class="col-auto">
                    <q-icon 
                      :name="allowMultipleAnswers ? 
                        (selectedAnswers.includes(index) ? 'check_box' : 'check_box_outline_blank') :
                        (selectedAnswers.includes(index) ? 'radio_button_checked' : 'radio_button_unchecked')"
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
                    <div v-if="answer.description" class="answer-description text-body2 text-grey-6 q-mt-xs">
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
      <div v-else-if="question.type === 'true_false'" class="true-false-answers">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          Cette affirmation est-elle vraie ou fausse ?
        </div>
        
        <div class="row q-gutter-lg justify-center">
          <div class="col-12 col-sm-5">
            <q-card 
              flat 
              bordered 
              class="cursor-pointer answer-card transition-all text-center"
              :class="{
                'selected': selectedTrueFalse === true,
                'bg-positive text-white': selectedTrueFalse === true,
                'bg-grey-1 hover-shadow': selectedTrueFalse !== true
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
              class="cursor-pointer answer-card transition-all text-center"
              :class="{
                'selected': selectedTrueFalse === false,
                'bg-negative text-white': selectedTrueFalse === false,
                'bg-grey-1 hover-shadow': selectedTrueFalse !== false
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

      <!-- Questions de remise en ordre (placeholder) -->
      <div v-else-if="question.type === 'order'" class="order-answers">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          Glissez les éléments pour les remettre dans le bon ordre :
        </div>
        
        <!-- Le composant draggable sera ajouté plus tard -->
        <div class="order-container q-gutter-sm">
          <div 
            v-for="(item, index) in orderItems" 
            :key="index"
            class="order-item"
          >
            <q-card flat bordered class="cursor-move order-card q-pa-md bg-grey-1">
              <div class="row items-center q-gutter-md no-wrap">
                <q-icon name="drag_indicator" color="grey-6" size="md" />
                <div class="text-body1 text-weight-medium">{{ item.text }}</div>
                <q-space />
                <q-badge color="secondary" text-color="primary">
                  {{ index + 1 }}
                </q-badge>
              </div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Questions de texte libre -->
      <div v-else-if="question.type === 'text'" class="text-answer">
        <div class="text-body1 text-grey-7 text-center q-mb-lg">
          Saisissez votre réponse :
        </div>
        
        <q-input
          v-model="textAnswer"
          outlined
          type="textarea"
          :rows="4"
          placeholder="Tapez votre réponse ici..."
          bg-color="grey-1"
          class="text-answer-input"
          :maxlength="question.maxLength || 500"
          counter
        />
      </div>
    </div>

    <!-- Informations supplémentaires -->
    <div v-if="showHint || question.hint" class="question-hint q-mt-xl">
      <q-banner class="bg-info text-white rounded-borders">
        <template #avatar>
          <q-icon name="lightbulb" />
        </template>
        <div class="text-weight-medium">Indice :</div>
        <div>{{ question.hint }}</div>
      </q-banner>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  question: {
    type: Object,
    required: true,
    default: () => ({
      title: '',
      type: 'multiple_choice',
      answers: [],
      points: 100
    })
  },
  questionNumber: {
    type: Number,
    default: 1
  },
  totalQuestions: {
    type: Number,
    default: 1
  },
  allowMultipleAnswers: {
    type: Boolean,
    default: false
  },
  showHint: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['answer-selected', 'answer-changed'])

// État des réponses
const selectedAnswers = ref([])
const selectedTrueFalse = ref(null)
const orderItems = ref([])
const textAnswer = ref('')

// Computed
const hasAnswered = computed(() => {
  switch (props.question.type) {
    case 'multiple_choice':
      return selectedAnswers.value.length > 0
    case 'true_false':
      return selectedTrueFalse.value !== null
    case 'order':
      return orderItems.value.length > 0
    case 'text':
      return textAnswer.value.trim().length > 0
    default:
      return false
  }
})

// Méthodes
const getAnswerLetter = (index) => {
  return String.fromCharCode(65 + index) // A, B, C, D...
}

const selectMultipleChoiceAnswer = (index) => {
  if (props.disabled) return
  
  if (props.allowMultipleAnswers) {
    // Permettre plusieurs réponses
    const currentIndex = selectedAnswers.value.indexOf(index)
    if (currentIndex > -1) {
      selectedAnswers.value.splice(currentIndex, 1)
    } else {
      selectedAnswers.value.push(index)
    }
  } else {
    // Une seule réponse
    selectedAnswers.value = [index]
  }
  
  emitAnswer()
}

const selectTrueFalse = (value) => {
  if (props.disabled) return
  selectedTrueFalse.value = value
  emitAnswer()
}

const emitAnswer = () => {
  let answer = null
  
  switch (props.question.type) {
    case 'multiple_choice':
      answer = props.allowMultipleAnswers ? selectedAnswers.value : selectedAnswers.value[0]
      break
    case 'true_false':
      answer = selectedTrueFalse.value
      break
    case 'order':
      answer = orderItems.value.map(item => item.id || item.text)
      break
    case 'text':
      answer = textAnswer.value.trim()
      break
  }
  
  emit('answer-selected', {
    questionId: props.question.id,
    answer,
    hasAnswered: hasAnswered.value
  })
}

// Initialiser les éléments d'ordre si nécessaire
const initializeOrderItems = () => {
  if (props.question.type === 'order' && props.question.items) {
    // Mélanger les éléments
    orderItems.value = [...props.question.items].sort(() => Math.random() - 0.5)
  }
}

// Réinitialiser les réponses quand la question change
const resetAnswers = () => {
  selectedAnswers.value = []
  selectedTrueFalse.value = null
  textAnswer.value = ''
  initializeOrderItems()
}

// Watchers
watch(() => props.question, () => {
  resetAnswers()
}, { immediate: true })

watch([selectedAnswers, selectedTrueFalse, textAnswer], () => {
  emit('answer-changed', hasAnswered.value)
}, { deep: true })

// Exposer les méthodes et états
defineExpose({
  resetAnswers,
  hasAnswered,
  getSelectedAnswer: () => {
    switch (props.question.type) {
      case 'multiple_choice':
        return props.allowMultipleAnswers ? selectedAnswers.value : selectedAnswers.value[0]
      case 'true_false':
        return selectedTrueFalse.value
      case 'order':
        return orderItems.value
      case 'text':
        return textAnswer.value.trim()
      default:
        return null
    }
  }
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