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

    <!-- Loading spinner while fetching quiz data -->
    <q-dialog v-model="loading" persistent>
      <q-card class="q-pa-lg text-center" style="min-width: 300px">
        <q-spinner-dots size="40px" color="secondary" />
        <div class="q-mt-md text-body1">Chargement du quiz...</div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import FormLayout from 'src/layouts/FormLayout.vue'
import StepProgressBar from 'src/components/common/StepProgressBar.vue'
import QuizCreateGeneralInformations from 'src/components/quiz/components/QuizCreateGeneralInformations.vue'
import QuizCreateQuestions from 'src/components/quiz/components/QuizCreateQuestions.vue'
import QuizCreateRecap from 'src/components/quiz/components/QuizCreateRecap.vue'
import QuizService from 'src/services/QuizService'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const quizSteps = [
  { id: 'general', label: 'Informations générales' },
  { id: 'questions', label: 'Modification des questions' },
  { id: 'summary', label: 'Récapitulatif' },
]

const currentStep = ref(0)
const showValidation = ref(false)
const logoFile = ref(null)
const logoPreviewUrl = ref(null)
const loading = ref(true)

const quizData = ref({
  title: '',
  description: '',
  isPublic: true,
  questions: [],
})

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
    ariaLabel: 'Annuler la modification du quiz',
    outline: true,
    title: 'Revenir sans sauvegarder',
  },
  {
    action: 'save',
    label: 'Mettre à jour le quiz',
    color: 'secondary',
    class: 'text-primary q-pa-sm col-5',
    ariaLabel: 'Mettre à jour le quiz',
    title: 'Finaliser la modification du quiz',
    disabled: !isFormValid.value,
    disabledTooltip: 'Complétez toutes les étapes pour mettre à jour le quiz',
  },
])

const loadQuizData = async () => {
  try {
    loading.value = true
    const quizId = route.params.id

    if (!quizId) {
      throw new Error('ID du quiz manquant')
    }

    const response = await QuizService.getQuizById(quizId)
    const quiz = response.data.quiz

    // Préremplir les données du formulaire
    quizData.value = {
      title: quiz.title || '',
      description: quiz.description || '',
      isPublic: quiz.isPublic !== undefined ? quiz.isPublic : true,
      questions: quiz.questions || [],
    }

    // Si le quiz a un logo, définir l'URL de prévisualisation
    if (quiz.logo) {
      logoPreviewUrl.value = `${process.env.VUE_APP_API_URL || 'http://localhost:3000'}/api/uploads/logos/${quiz.logo}`
    }
  } catch (error) {
    console.error('Erreur lors du chargement du quiz:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement du quiz',
      position: 'top',
    })
    router.push('/accueil')
  } finally {
    loading.value = false
  }
}

const handleAction = async (action) => {
  if (action === 'cancel') {
    router.push('/accueil')
    return
  }

  if (action === 'save' && isFormValid.value) {
    try {
      const quizId = route.params.id

      const payload = {
        title: quizData.value.title,
        description: quizData.value.description,
        isPublic: quizData.value.isPublic,
        questions: quizData.value.questions.map((question) => ({
          content: question.content,
          type: question.type,
          answer: question.answer,
          points: question.points,
          timeGiven: question.timeGiven,
        })),
      }

      if (logoFile.value) {
        payload.logo = logoFile.value
      }

      await QuizService.updateQuiz(quizId, payload)

      $q.notify({
        type: 'positive',
        message: 'Quiz mis à jour avec succès !',
        position: 'top',
      })
      router.push('/accueil')
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la mise à jour du quiz',
        position: 'top',
      })
      console.error(error)
    }
  }
}

onMounted(() => {
  loadQuizData()
})
</script>

<style lang="scss" scoped>
.step-content-card {
  min-height: 500px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  transition: all 0.3s ease;
}
</style>
