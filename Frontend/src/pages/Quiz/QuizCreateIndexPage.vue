<template>
  <div class="full-width">
    <FormLayout
      title="Créer un nouveau quiz"
      :show-actions="true"
      :actionButtons="actionButtons"
      :disabledSubmit="!isFormValid"
      @action="handleAction"
    >
      <template v-slot:content>
        <!-- Progress Bar - Utilisation ultra-simple -->
        <StepProgressBar
          :steps="quizSteps"
          v-model:current-step="currentStep"
          :is-current-step-valid="isCurrentStepValid"
          :validation-message="validationMessage"
          @step-change="onStepChange"
        />

        <!-- Contenu dynamique selon l'étape -->
        <div class="step-content q-mt-lg">
          <!-- Étape 1: Informations générales -->
          <div v-if="currentStep === 0" class="general-info-step">
            <h5 class="text-dark80 q-mb-md">Informations générales</h5>

            <q-input
              v-model="quizData.title"
              label="Titre du quiz *"
              outlined
              class="custom-border q-mb-md"
              :error="!quizData.title && showValidation"
              error-message="Le titre est obligatoire"
            />

            <q-input
              v-model="quizData.description"
              label="Description *"
              type="textarea"
              rows="3"
              outlined
              class="custom-border q-mb-md"
              :error="!quizData.description && showValidation"
              error-message="La description est obligatoire"
            />

            <q-select
              v-model="quizData.category"
              :options="categoryOptions"
              label="Catégorie *"
              outlined
              class="custom-border q-mb-md"
              :error="!quizData.category && showValidation"
              error-message="Veuillez sélectionner une catégorie"
            />

            <q-input
              v-model.number="quizData.timeLimit"
              label="Temps limite (secondes)"
              type="number"
              outlined
              class="custom-border"
              min="1"
              max="180"
            />
          </div>

          <!-- Étape 2: Création des questions -->
          <div v-if="currentStep === 1" class="questions-step">
            <div class="row items-center justify-between q-mb-md">
              <h5 class="text-dark80 q-ma-none">Création des questions</h5>
              <q-btn
                rounded
                color="dark80"
                label="Ajouter une question"
                icon="add"
                @click="addQuestion"
                size="sm"
              />
            </div>

            <div v-if="quizData.questions.length === 0" class="text-center q-pa-xl">
              <q-icon name="quiz" size="48px" class="text-normal60 q-mb-md" />
              <p class="text-normal60">
                Aucune question créée. Commencez par ajouter votre première question.
              </p>
            </div>

            <div v-else>
              <div
                v-for="(question, index) in quizData.questions"
                :key="index"
                class="question-card q-mb-md q-pa-md bg-light20 rounded-borders"
              >
                <div class="row items-center justify-between q-mb-sm">
                  <span class="text-weight-bold">Question {{ index + 1 }}</span>
                  <q-btn
                    flat
                    round
                    color="negative"
                    icon="delete"
                    size="sm"
                    @click="removeQuestion(index)"
                  />
                </div>

                <q-input
                  v-model="question.text"
                  label="Texte de la question"
                  outlined
                  class="custom-border q-mb-sm"
                />

                <div class="row q-col-gutter-sm">
                  <div v-for="(answer, ansIndex) in question.answers" :key="ansIndex" class="col-6">
                    <q-input
                      v-model="answer.text"
                      :label="`Réponse ${ansIndex + 1}`"
                      outlined
                      class="custom-border"
                    >
                      <template v-slot:prepend>
                        <q-radio v-model="question.correctAnswer" :val="ansIndex" color="dark80" />
                      </template>
                    </q-input>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Étape 3: Récapitulatif -->
          <div v-if="currentStep === 2" class="summary-step">
            <h5 class="text-dark80 q-mb-md">Récapitulatif</h5>

            <div class="summary-card q-pa-md bg-light20 rounded-borders">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <h6 class="text-dark80 q-mb-sm">Informations générales</h6>
                  <p><strong>Titre :</strong> {{ quizData.title }}</p>
                  <p><strong>Description :</strong> {{ quizData.description }}</p>
                  <p><strong>Catégorie :</strong> {{ quizData.category }}</p>
                  <p>
                    <strong>Temps limite :</strong> {{ quizData.timeLimit || 'Aucun' }}
                    {{ quizData.timeLimit ? 'minutes' : '' }}
                  </p>
                </div>

                <div class="col-12 col-md-6">
                  <h6 class="text-dark80 q-mb-sm">Questions</h6>
                  <p><strong>Nombre de questions :</strong> {{ quizData.questions.length }}</p>
                  <div v-if="quizData.questions.length > 0">
                    <p class="q-mb-xs"><strong>Aperçu :</strong></p>
                    <ul class="q-ma-none">
                      <li v-for="(question, index) in quizData.questions.slice(0, 3)" :key="index">
                        {{ question.text?.substring(0, 50)
                        }}{{ question.text?.length > 50 ? '...' : '' }}
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import FormLayout from 'src/layouts/FormLayout.vue'
import StepProgressBar from 'src/components/StepProgressBar.vue'

const router = useRouter()
const $q = useQuasar()

// Configuration des étapes - Ultra simple !
const quizSteps = [
  { id: 'general', label: 'Informations générales' },
  { id: 'questions', label: 'Création des questions' },
  { id: 'summary', label: 'Récapitulatif' },
]

const currentStep = ref(0)
const showValidation = ref(false)

// Données du quiz
const quizData = ref({
  title: '',
  description: '',
  category: '',
  timeLimit: 45,
  questions: [],
})

const categoryOptions = [
  'Culture générale',
  'Sport',
  'Histoire',
  'Sciences',
  'Arts',
  'Technologie',
  'Autre',
]

// Validation automatique selon l'étape
const isCurrentStepValid = computed(() => {
  switch (currentStep.value) {
    case 0:
      return (
        quizData.value.title.trim() !== '' &&
        quizData.value.description.trim() !== '' &&
        quizData.value.category !== ''
      )

    case 1:
      return (
        quizData.value.questions.length > 0 &&
        quizData.value.questions.every(
          (q) =>
            q.text?.trim() &&
            q.answers?.every((a) => a.text?.trim()) &&
            q.correctAnswer !== undefined,
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
  //Vérif chaque étapes de la progress bar

  // Etape 1 :
  const step0Valid =
    quizData.value.title.trim() !== '' &&
    quizData.value.description.trim() !== '' &&
    quizData.value.category !== ''

  // Etape 2 :
  const step1Valid =
    quizData.value.questions.length > 0 &&
    quizData.value.questions.every(
      (q) =>
        q.text?.trim() && q.answers?.every((a) => a.text?.trim()) && q.correctAnswer !== undefined,
    )

  //Etape 3 = récap donc on valdie le form à l'étape 2
  return currentStep.value === 2 && step0Valid && step1Valid
})

// Gestion des questions
const addQuestion = () => {
  quizData.value.questions.push({
    text: '',
    answers: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
    correctAnswer: 0,
  })
}

const removeQuestion = (index) => {
  quizData.value.questions.splice(index, 1)
}

// Événements de la progress bar
const onStepChange = () => {
  showValidation.value = true
}

// Actions du formulaire
const actionButtons = computed(() => [
  {
    action: 'cancel',
    label: 'Annuler',
    color: 'white',
    class: 'text-dark80 q-pa-sm border-dark80 col-5',
    ariaLabel: 'Annuler la création du quiz',
    title: 'Revenir sans sauvegarder',
  },
  {
    action: 'save',
    label: 'Créer le quiz',
    color: 'dark80',
    class: 'text-light20 q-pa-sm col-5',
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
      // Préparer les données au format JSON (plus adapté à votre backend)
      const payload = {
        title: quizData.value.title,
        description: quizData.value.description,
        isPublic: false,
        startDate: new Date(), // Requis par le modèle Quiz
        questions: quizData.value.questions.map((question) => ({
          content: question.text,
          type: 'MULTIPLE_CHOICE', // Correspond à votre ENUM
          answer: question.answers.map((answer, index) => ({
            text: answer.text,
            isCorrect: index === question.correctAnswer,
          })),
          points: 10,
          timeGiven: quizData.value.timeLimit || 45,
        })),
      }

      await axios.post('http://localhost:3000/api/quiz/create', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      $q.notify({
        type: 'positive',
        message: 'Quiz créé avec succès !',
        position: 'top',
      })
      // router.push('/accueil')
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
.step-content {
  min-height: 400px;
  padding: 24px;
  background-color: $light10;
  border-radius: 12px;
}

.question-card {
  border: 1px solid $normal60;
}

.summary-card {
  border: 1px solid $normal60;
}

h5,
h6 {
  margin: 0;
}
</style>
