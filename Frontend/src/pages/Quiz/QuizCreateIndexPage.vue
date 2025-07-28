<template>
  <div class="full-width">
    <FormLayout
      :show-actions="true"
      :actionButtons="actionButtons"
      :disabledSubmit="!isFormValid"
      @action="handleAction"
    >
      <template v-slot:content>
        <div class="q-mb-lg">
          <StepProgressBar
            :steps="quizSteps"
            v-model:current-step="currentStep"
            :is-current-step-valid="isCurrentStepValid"
            :validation-message="validationMessage"
            @step-change="onStepChange"
          />
        </div>

        <q-card
          class="step-content-card q-pa-lg"
          flat
          bordered
          role="region"
          :aria-label="`Étape ${currentStep + 1}: ${quizSteps[currentStep]?.label}`"
        >
          <q-card-section class="q-pa-none">
            <!-- Step 1: General Information -->
            <QuizCreateGeneralInformations
              v-if="currentStep === 0"
              :quiz-data="quizData"
              :show-validation="showValidation"
              @update:quiz-data="quizData = $event"
              @logo-selected="onLogoSelected"
              @logo-removed="removeLogo"
            />

            <!-- Step 2: Questions Creation -->
            <QuizCreateQuestions
              v-if="currentStep === 1"
              :questions="quizData.questions"
              :show-validation="showValidation"
              @update:questions="quizData.questions = $event"
            />

            <!-- Step 3: Summary -->
            <QuizCreateRecap
              v-if="currentStep === 2"
              :quiz-data="quizData"
              :logo-preview-url="logoPreviewUrl"
              :is-form-valid="isFormValid"
            />
          </q-card-section>
        </q-card>
      </template>
    </FormLayout>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import FormLayout from 'src/layouts/FormLayout.vue'
import StepProgressBar from 'src/components/StepProgressBar.vue'
import QuizCreateGeneralInformations from 'src/components/QuizCreateGeneralInformations.vue'
import QuizCreateQuestions from 'src/components/QuizCreateQuestions.vue'
import QuizCreateRecap from 'src/components/QuizCreateRecap.vue'
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
  isPublic: true,
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
    outline: true,
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
        isPublic: quizData.value.isPublic,
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
        message: 'Quiz crée avec succès !',
        position: 'top',
      })
      router.push('/accueil')
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la création du quiz',
        position: 'top',
      })
      console.error(error)
    }
  }
}
</script>

<style lang="scss" scoped>
.step-content-card {
  min-height: 500px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .step-content-card {
    margin: 0 -16px;
    border-radius: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
