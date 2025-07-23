<template>
  <div class="full-width">
    <FormLayout
      :show-actions="true"
      :actionButtons="actionButtons"
      :disabledSubmit="!isFormValid"
      @action="handleAction"
    >
      <template v-slot:content>
        <StepProgressBar
          :steps="quizSteps"
          v-model:current-step="currentStep"
          :is-current-step-valid="isCurrentStepValid"
          :validation-message="validationMessage"
          @step-change="onStepChange"
        />

        <div
          class="step-content q-pa-xl bg-primary rounded-borders q-mt-lg"
          style="min-height: 400px"
          role="region"
          :aria-label="`Étape ${currentStep + 1}: ${quizSteps[currentStep]?.label}`"
        >
          <div v-if="currentStep === 0" class="flex column">
            <h2 class="text-secondary q-mb-md q-ma-none">Informations générales</h2>

            <div class="q-mb-md">
              <div v-if="logoPreviewUrl" class="flex flex-center q-mb-md">
                <div class="logo-preview relative-position">
                  <q-img
                    :src="logoPreviewUrl"
                    style="height: 100px; width: 100px; border-radius: 12px"
                    fit="cover"
                  />
                  <q-btn
                    round
                    dense
                    icon="close"
                    size="sm"
                    color="negative"
                    class="absolute-top-right"
                    style="margin: -8px"
                    @click="removeLogo"
                  />
                </div>
              </div>

              <div class="flex flex-center">
                <q-btn
                  color="primary"
                  text-color="secondary"
                  outline
                  icon="add_photo_alternate"
                  :label="logoFile ? 'Changer le logo' : 'Choisir un logo'"
                  @click="uploadFilesDialog = true"
                />
              </div>
            </div>

            <UploadFiles
              v-model="uploadFilesDialog"
              title="Logo du quiz"
              @selected="onLogoSelected"
            />

            <q-input
              v-model="quizData.title"
              label="Titre du quiz *"
              outlined
              bg-color="white"
              label-color="secondary"
              color="secondary"
              class="q-mb-md custom-border"
              :error="!quizData.title && showValidation"
              error-message="Le titre est obligatoire"
              aria-label="Titre du quiz"
              aria-required="true"
              tabindex="0"
            />

            <q-input
              v-model="quizData.description"
              label="Description *"
              type="textarea"
              rows="3"
              outlined
              class="q-mb-md custom-border"
              bg-color="white"
              label-color="secondary"
              color="secondary"
              :error="!quizData.description && showValidation"
              error-message="La description est obligatoire"
              aria-label="Description du quiz"
              aria-required="true"
              tabindex="0"
            />
          </div>

          <!-- Create questions -->
          <div v-if="currentStep === 1" class="questions-step">
            <div class="row items-center justify-between q-mb-md">
              <h2 class="text-secondary q-ma-none">Création des questions</h2>
            </div>

            <div
              v-if="quizData.questions.length === 0"
              class="column flex-center q-pa-xl"
              role="status"
              aria-live="polite"
            >
              <q-icon name="quiz" size="48px" class="text-secondary q-mb-md" aria-hidden="true" />
              <p class="text-secondary q-mb-md">
                Aucune question créée. Commencez par ajouter votre première question.
              </p>
              <q-btn
                color="primary"
                text-color="secondary"
                icon="add"
                label="Ajouter une question"
                @click="addQuestionAndScroll"
                tabindex="0"
                aria-label="Ajouter la première question du quiz"
              />
            </div>

            <div v-else role="list" aria-label="Liste des questions du quiz">
              <div
                v-for="(question, index) in quizData.questions"
                :key="index"
                role="listitem"
                :aria-label="`Question ${index + 1}`"
                class="q-mb-md bg-primary rounded-borders q-pa-sm"
                style="border: 1px solid #bdbdbd"
                :ref="(el) => setQuestionRef(el, index)"
              >
                <q-expansion-item
                  v-model="expandedQuestions[index]"
                  switch-toggle-side
                  :label="
                    'Question ' +
                    (index + 1) +
                    (question.content ? ' : ' + question.content.substring(0, 30) : '')
                  "
                  class="q-mb-none"
                  :default-opened="index === quizData.questions.length - 1"
                >
                  <template #header>
                    <div class="row items-center full-width">
                      <div class="col text-weight-bold text-secondary">
                        Question {{ index + 1
                        }}<span v-if="question.content">
                          : {{ question.content.substring(0, 30)
                          }}<span v-if="question.content.length > 30">...</span></span
                        >
                      </div>
                      <q-btn
                        flat
                        round
                        color="negative"
                        icon="delete"
                        size="13px"
                        @click.stop="removeQuestion(index)"
                        class="q-ml-sm"
                        :title="'Supprimer la question ' + (index + 1)"
                      />
                    </div>
                  </template>
                  <QuestionTypeSelector
                    :question="question"
                    :show-validation="showValidation"
                    @update:question="updateQuestion(index, $event)"
                  />
                </q-expansion-item>
              </div>
              <div class="row justify-center q-mt-lg">
                <q-btn
                  color="primary"
                  text-color="secondary"
                  icon="add"
                  label="Ajouter une question"
                  @click="addQuestionAndScroll"
                />
              </div>
            </div>
          </div>

          <!-- Recap -->
          <div v-if="currentStep === 2" class="summary-step">
            <h5 class="text-secondary q-mb-md">Récapitulatif</h5>

            <div
              class="summary-card q-pa-md bg-grey-2 rounded-borders"
              style="border: 1px solid #bdbdbd"
            >
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <h6 class="text-secondary q-mb-sm q-ma-none">Informations générales</h6>
                  <p><strong>Titre :</strong> {{ quizData.title }}</p>
                  <p><strong>Description :</strong> {{ quizData.description }}</p>
                </div>

                <div class="col-12 col-md-6">
                  <h6 class="text-secondary q-mb-sm q-ma-none">Questions</h6>
                  <p><strong>Nombre de questions :</strong> {{ quizData.questions.length }}</p>
                  <div v-if="quizData.questions.length > 0">
                    <p class="q-mb-xs"><strong>Aperçu :</strong></p>
                    <ul class="q-ma-none">
                      <li v-for="(question, index) in quizData.questions.slice(0, 3)" :key="index">
                        <strong>{{ getQuestionTypeLabel(question.type) }}:</strong>
                        {{ question.content?.substring(0, 50)
                        }}{{ question.content?.length > 50 ? '...' : '' }}
                      </li>
                      <li v-if="quizData.questions.length > 3">
                        ... et {{ quizData.questions.length - 3 }} autres questions
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </FormLayout>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import FormLayout from 'src/layouts/FormLayout.vue'
import StepProgressBar from 'src/components/StepProgressBar.vue'
import QuestionTypeSelector from 'src/components/QuestionTypeSelector.vue'
import UploadFiles from 'src/components/UploadFiles.vue'
import QuizService from 'src/services/QuizService'

const router = useRouter()
const $q = useQuasar()

const quizSteps = [
  { id: 'general', label: 'Informations générales' },
  { id: 'questions', label: 'Création des questions' },
  { id: 'summary', label: 'Récapitulatif' },
]

const currentStep = ref(0)
const showValidation = ref(false)
const uploadFilesDialog = ref(false)
const logoFile = ref(null)
const logoPreviewUrl = ref(null)

const onLogoSelected = (file) => {
  logoFile.value = file

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreviewUrl.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeLogo = () => {
  logoFile.value = null
  logoPreviewUrl.value = null
}

const quizData = ref({
  title: '',
  description: '',
  questions: [],
})

const isCurrentStepValid = computed(() => {
  switch (currentStep.value) {
    case 0:
      return quizData.value.title.trim() !== '' && quizData.value.description.trim() !== ''
    case 1:
      return (
        quizData.value.questions.length > 0 &&
        quizData.value.questions.every(
          (q) =>
            q.content?.trim() &&
            q.answer?.length > 0 &&
            q.answer.every((a) => a.text?.trim()) &&
            q.answer.some((a) => a.isCorrect),
        )
      )
    case 2:
      return true
    default:
      return false
  }
})

const validationMessage = computed(() => {
  switch (currentStep.value) {
    case 0:
      return 'Veuillez remplir tous les champs obligatoires'
    case 1:
      return 'Veuillez créer au moins une question complète'
    default:
      return 'Veuillez compléter cette étape'
  }
})

const isFormValid = computed(() => {
  const step0Valid = quizData.value.title.trim() !== '' && quizData.value.description.trim() !== ''
  const step1Valid =
    quizData.value.questions.length > 0 &&
    quizData.value.questions.every(
      (q) =>
        q.content?.trim() &&
        q.answer?.length > 0 &&
        q.answer.every((a) => a.text?.trim()) &&
        q.answer.some((a) => a.isCorrect),
    )
  return currentStep.value === 2 && step0Valid && step1Valid
})

const questionRefs = ref([])
const expandedQuestions = ref([])

const setQuestionRef = (el, idx) => {
  if (el) questionRefs.value[idx] = el
}

const addQuestion = () => {
  quizData.value.questions.push({
    content: '',
    type: 'CLASSIC',
    answer: [{ text: '', isCorrect: true }],
    points: 1,
    timeGiven: 45,
  })
  expandedQuestions.value[quizData.value.questions.length - 1] = true
}

const addQuestionAndScroll = async () => {
  addQuestion()
  await nextTick()
  const lastIdx = quizData.value.questions.length - 1
  const el = questionRefs.value[lastIdx]
  if (el && el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const removeQuestion = (index) => {
  quizData.value.questions.splice(index, 1)
  expandedQuestions.value.splice(index, 1)
  questionRefs.value.splice(index, 1)
}

const updateQuestion = (index, updatedQuestion) => {
  quizData.value.questions[index] = updatedQuestion
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

const onStepChange = () => {
  showValidation.value = true
}

const actionButtons = computed(() => [
  {
    action: 'cancel',
    label: 'Annuler',
    color: 'white',
    class: 'text-secondary q-pa-sm border-secondary col-5',
    ariaLabel: 'Annuler la création du quiz',
    title: 'Revenir sans sauvegarder',
  },
  {
    action: 'save',
    label: 'Créer le quiz',
    color: 'secondary',
    class: 'text-primary q-pa-sm col-5',
    ariaLabel: 'Créer le quiz',
    title: 'Finaliser la création du quiz',
    disabled: !isFormValid.value,
    disabledTooltip: 'Complétez toutes les étapes pour créer le quiz',
  },
])

const handleAction = async (action) => {
  if (action === 'cancel') {
    router.push('/accueil')
    return
  }

  if (action === 'save' && isFormValid.value) {
    try {
      const payload = {
        title: quizData.value.title,
        description: quizData.value.description,
        startDate: new Date(),
        logo: logoFile.value,
        questions: quizData.value.questions.map((question) => ({
          content: question.content,
          type: question.type,
          answer: question.answer,
          points: question.points,
          timeGiven: question.timeGiven,
        })),
      }

      await QuizService.createQuiz(payload)

      $q.notify({
        type: 'positive',
        message: 'Quiz created successfully!',
        position: 'top',
      })
      router.push('/accueil')
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Error while creating the quiz',
        position: 'top',
      })
      console.error(error)
    }
  }
}
</script>
