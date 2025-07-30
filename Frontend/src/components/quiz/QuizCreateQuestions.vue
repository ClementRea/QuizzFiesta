<template>
  <div class="questions-step">
    <div class="row items-center q-mb-lg">
      <q-icon name="quiz" size="28px" class="text-secondary q-mr-sm" />
      <h2 class="text-h5 text-weight-medium q-ma-none">Création des questions</h2>
      <q-space />
      <q-chip
        v-if="questions.length > 0"
        :label="`${questions.length} question${questions.length > 1 ? 's' : ''}`"
        color="secondary"
        text-color="primary"
        icon="quiz"
        class="text-weight-medium"
      />
    </div>

    <div
      v-if="questions.length === 0"
      class="empty-state-enhanced"
      role="status"
      aria-live="polite"
    >
      <q-card class="empty-state-card text-center q-pa-xl" flat>
        <q-icon name="quiz" size="64px" class="text-grey-5 q-mb-md" aria-hidden="true" />
        <div class="text-h6 text-grey-7 q-mb-sm">Aucune question créée</div>
        <p class="text-body2 text-grey-6 q-mb-lg q-px-md">
          Commencez par créer votre première question. Vous pourrez choisir parmi différents types
          de questions pour rendre votre quiz plus interactif.
        </p>
        <q-btn
          color="secondary"
          unelevated
          icon="add"
          label="Créer ma première question"
          @click="addQuestionAndScroll"
          tabindex="0"
          aria-label="Ajouter la première question du quiz"
          class="q-px-xl q-py-sm"
        />
      </q-card>
    </div>

    <div v-else class="questions-list" role="list" aria-label="Liste des questions du quiz">
      <q-timeline color="secondary" class="q-mb-lg">
        <q-timeline-entry
          v-for="(question, index) in questions"
          :key="index"
          :icon="getQuestionIcon(question.type)"
          class="question-timeline-entry"
          role="listitem"
          :aria-label="`Question ${index + 1}`"
          :ref="(el) => setQuestionRef(el, index)"
        >
          <template v-slot:subtitle>
            <div class="text-secondary text-bold text-caption">
              {{ getQuestionTypeLabel(question.type) }}
            </div>
          </template>

          <!-- Card question create  -->
          <q-card class="question-card" flat bordered>
            <q-expansion-item
              v-model="expandedQuestions[index]"
              :label="`Question ${index + 1}`"
              :caption="
                question.content
                  ? question.content.substring(0, 50) + (question.content.length > 50 ? '...' : '')
                  : 'Question non renseignée'
              "
              class="q-mb-none"
              :default-opened="index === questions.length - 1"
              header-class="text-weight-medium"
            >
              <template v-slot:header>
                <div class="row items-center full-width">
                  <div class="col">
                    <div class="text-weight-medium text-grey-8">Question {{ index + 1 }}</div>
                    <div class="text-caption text-grey-6 q-mt-xs" v-if="question.content">
                      {{ question.content.substring(0, 50) }}
                      <span v-if="question.content.length > 50">...</span>
                    </div>
                    <div class="text-caption text-orange" v-else>Question non renseignée</div>
                  </div>
                  <div class="question-actions q-ml-sm">
                    <q-btn
                      flat
                      round
                      color="grey-6"
                      icon="content_copy"
                      size="sm"
                      @click.stop="duplicateQuestion(index)"
                      :title="'Dupliquer la question ' + (index + 1)"
                      class="q-mr-xs"
                    />
                    <q-btn
                      flat
                      round
                      color="negative"
                      icon="delete"
                      size="sm"
                      @click.stop="confirmDeleteQuestion(index)"
                      :title="'Supprimer la question ' + (index + 1)"
                    />
                  </div>
                </div>
              </template>

              <q-separator />

              <q-card-section class="q-pa-md">
                <QuestionTypeSelector
                  :question="question"
                  :show-validation="showValidation"
                  @update:question="updateQuestion(index, $event)"
                />
              </q-card-section>
            </q-expansion-item>
          </q-card>
        </q-timeline-entry>
      </q-timeline>

      <div class="text-center q-mt-xl">
        <q-btn
          color="secondary"
          outline
          icon="add"
          label="Ajouter une question"
          @click="addQuestionAndScroll"
          class="q-px-xl"
          :aria-label="'Ajouter une question ' + (questions.length + 1)"
        />
      </div>
    </div>

    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Êtes-vous sûr de vouloir supprimer cette question ?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" @click="showDeleteDialog = false" />
          <q-btn flat label="Supprimer" color="negative" @click="deleteQuestion" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import QuestionTypeSelector from 'src/components/quiz/QuestionTypeSelector.vue'

const props = defineProps({
  questions: {
    type: Array,
    required: true,
  },
  showValidation: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:questions'])

const questionRefs = ref([])
const expandedQuestions = ref([])
const showDeleteDialog = ref(false)
const questionToDelete = ref(null)

const setQuestionRef = (el, idx) => {
  if (el) questionRefs.value[idx] = el
}

const addQuestion = () => {
  const updatedQuestions = [...props.questions]
  updatedQuestions.push({
    content: '',
    type: 'CLASSIC',
    answer: [{ text: '', isCorrect: true }],
    points: 1,
    timeGiven: 45,
  })
  expandedQuestions.value[updatedQuestions.length - 1] = true
  emit('update:questions', updatedQuestions)
}

const addQuestionAndScroll = async () => {
  addQuestion()
  await nextTick()
  const lastIdx = props.questions.length - 1
  const el = questionRefs.value[lastIdx]
  if (el && el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const removeQuestion = (index) => {
  const updatedQuestions = [...props.questions]
  updatedQuestions.splice(index, 1)
  expandedQuestions.value.splice(index, 1)
  questionRefs.value.splice(index, 1)
  emit('update:questions', updatedQuestions)
}

const updateQuestion = (index, updatedQuestion) => {
  const updatedQuestions = [...props.questions]
  updatedQuestions[index] = updatedQuestion
  emit('update:questions', updatedQuestions)
}

const duplicateQuestion = (index) => {
  const originalQuestion = props.questions[index]
  const duplicatedQuestion = {
    ...originalQuestion,
    content: originalQuestion.content + ' (copie)',
    answer: originalQuestion.answer.map((a) => ({ ...a })),
  }
  const updatedQuestions = [...props.questions]
  updatedQuestions.splice(index + 1, 0, duplicatedQuestion)
  expandedQuestions.value.splice(index + 1, 0, true)
  emit('update:questions', updatedQuestions)
}

const confirmDeleteQuestion = (index) => {
  questionToDelete.value = index
  showDeleteDialog.value = true
}

const deleteQuestion = () => {
  if (questionToDelete.value !== null) {
    removeQuestion(questionToDelete.value)
    showDeleteDialog.value = false
    questionToDelete.value = null
  }
}

const getQuestionIcon = (type) => {
  const iconMap = {
    CLASSIC: 'quiz',
    MULTIPLE_CHOICE: 'radio_button_checked',
    ORDER: 'sort',
    ASSOCIATION: 'compare_arrows',
    BLIND_TEST: 'hearing',
    FIND_INTRUDER: 'search',
  }
  return iconMap[type] || 'quiz'
}

const getQuestionTypeLabel = (type) => {
  const typeMap = {
    CLASSIC: 'Question classique',
    MULTIPLE_CHOICE: 'Choix multiple',
    ORDER: 'Mise en ordre',
    ASSOCIATION: 'Association',
    BLIND_TEST: 'Blind test',
    FIND_INTRUDER: "Trouver l'intrus",
  }
  return typeMap[type] || type
}
</script>

<style lang="scss" scoped>
.questions-step {
  .empty-state-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 2px dashed #e0e0e0;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--q-primary);
      background: rgba(255, 255, 255, 1);
    }
  }

  .question-actions {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .question-card:hover .question-actions {
    opacity: 1;
  }
}

.question-timeline-entry {
  .q-timeline__dot {
    transition: all 0.3s ease;
  }
}
</style>
