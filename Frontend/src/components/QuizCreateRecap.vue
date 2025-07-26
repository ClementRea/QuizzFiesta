<template>
  <div class="summary-step">
    <div class="row items-center q-mb-lg">
      <q-icon name="summarize" size="28px" class="text-primary q-mr-sm" />
      <h2 class="text-h5 text-weight-medium q-ma-none text-grey-8">Récapitulatif</h2>
    </div>

    <!-- Enhanced Summary Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- General Information Card -->
      <div class="col-12 col-md-6">
        <q-card class="summary-info-card" flat bordered>
          <q-card-section class="bg-primary text-white q-pa-sm">
            <div class="text-subtitle1 text-weight-medium flex items-center">
              <q-icon name="info" class="q-mr-xs" />
              Informations générales
            </div>
          </q-card-section>
          <q-card-section class="q-pa-md">
            <div class="summary-item q-mb-md">
              <div class="text-caption text-grey-6 text-uppercase text-weight-medium">
                Titre
              </div>
              <div class="text-body1 text-weight-medium">{{ quizData.title }}</div>
            </div>
            <div class="summary-item q-mb-md">
              <div class="text-caption text-grey-6 text-uppercase text-weight-medium">
                Description
              </div>
              <div class="text-body2">{{ quizData.description }}</div>
            </div>
            <div class="summary-item" v-if="logoPreviewUrl">
              <div
                class="text-caption text-grey-6 text-uppercase text-weight-medium q-mb-sm"
              >
                Logo
              </div>
              <q-img
                :src="logoPreviewUrl"
                class="rounded-borders"
                style="height: 60px; width: 60px"
                fit="cover"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Questions Summary Card -->
      <div class="col-12 col-md-6">
        <q-card class="summary-questions-card" flat bordered>
          <q-card-section class="bg-secondary text-white q-pa-sm">
            <div class="text-subtitle1 text-weight-medium flex items-center">
              <q-icon name="quiz" class="q-mr-xs" />
              Questions
              <q-space />
              <q-chip
                :label="quizData.questions.length"
                color="white"
                text-color="secondary"
                dense
              />
            </div>
          </q-card-section>
          <q-card-section class="q-pa-md">
            <div v-if="quizData.questions.length > 0">
              <div class="question-summary-list">
                <div
                  v-for="(question, index) in quizData.questions.slice(0, 3)"
                  :key="index"
                  class="question-summary-item q-mb-sm q-pa-sm bg-grey-1 rounded-borders"
                >
                  <div class="flex items-center">
                    <q-icon
                      :name="getQuestionIcon(question.type)"
                      class="text-primary q-mr-sm"
                      size="sm"
                    />
                    <div class="col">
                      <div class="text-caption text-weight-medium text-grey-7">
                        {{ getQuestionTypeLabel(question.type) }}
                      </div>
                      <div class="text-body2">
                        {{ question.content?.substring(0, 40) }}
                        {{ question.content?.length > 40 ? '...' : '' }}
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="quizData.questions.length > 3" class="text-center q-mt-sm">
                  <div class="text-caption text-grey-6">
                    ... et {{ quizData.questions.length - 3 }} autres questions
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-grey-6">
              <q-icon name="quiz" size="32px" class="q-mb-sm" />
              <div>Aucune question créée</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Ready to Create Banner -->
    <q-banner class="bg-positive text-white rounded-borders" v-if="isFormValid">
      <template v-slot:avatar>
        <q-icon name="check_circle" size="32px" />
      </template>
      <div class="text-h6">Quiz prêt à être créé !</div>
      <div class="text-body2 q-mt-xs">
        Votre quiz contient {{ quizData.questions.length }} question{{
          quizData.questions.length > 1 ? 's' : ''
        }}
        et est prêt à être publié.
      </div>
    </q-banner>
  </div>
</template>

<script setup>
const props = defineProps({
  quizData: {
    type: Object,
    required: true
  },
  logoPreviewUrl: {
    type: String,
    default: null
  },
  isFormValid: {
    type: Boolean,
    required: true
  }
})

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
.summary-step {
  .summary-info-card,
  .summary-questions-card {
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.95);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }
  }

  .summary-item {
    border-left: 3px solid var(--q-primary);
    padding-left: 12px;
    transition: all 0.3s ease;

    &:hover {
      border-left-color: var(--q-secondary);
      background: rgba(0, 0, 0, 0.02);
    }
  }

  .question-summary-item {
    transition: all 0.3s ease;

    &:hover {
      background: #f0f0f0 !important;
      transform: translateX(4px);
    }
  }
}
</style>