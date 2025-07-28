<template>
  <div class="daily-quiz-section">
    <div v-if="dailyQuiz" class="q-mb-xl">
      <div class="text-center q-mb-lg">
        <h2 class="text-h4 text-secondary text-weight-bold q-mb-sm">⭐ Quiz du Jour</h2>
        <p class="text-body1 text-secondary">Le quiz le plus populaire aujourd'hui</p>
        <q-separator class="q-mt-md" color="secondary" size="2px" />
      </div>

      <div>
        <QuizObject :quiz="dailyQuiz" size="md" />
      </div>
    </div>

    <!-- Quiz Publics Populaires -->
    <div v-if="publicQuizzes.length > 0">
      <div class="text-center q-mb-lg">
        <h2 class="text-h4 text-secondary text-weight-bold q-mb-sm">🔥 Quiz Populaires</h2>
        <p class="text-body1 text-secondary">Découvrez les quiz les plus appréciés</p>
        <q-separator class="q-mt-md" color="secondary" size="2px" />
      </div>

      <div>
        <QuizObject :quiz="publicQuizzes[0]" size="md" />
      </div>

      <!-- Load More Button -->
      <div v-if="publicQuizzes.length > displayLimit" class="text-center q-mt-xl">
        <q-btn
          :label="showingAll ? 'Voir Moins' : 'Voir Plus'"
          color="secondary"
          outline
          rounded
          size="md"
          @click="$emit('toggle-show-all')"
          no-caps
          class="shadow-2"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && publicQuizzes.length === 0 && !dailyQuiz" class="text-center q-pa-xl">
      <q-card class="q-pa-xl" flat>
        <q-icon name="quiz" size="4rem" color="grey-5" class="q-mb-lg" />
        <h3 class="text-h5 text-secondary text-weight-bold q-mb-md">
          Aucun quiz public disponible
        </h3>
        <p class="text-body1 text-grey-6 q-mb-xl">Soyez le premier à créer un quiz public !</p>
        <q-btn
          label="Créer mon premier Quiz"
          color="secondary"
          rounded
          size="lg"
          @click="router.push('/quiz/create')"
          no-caps
          class="shadow-2"
        />
      </q-card>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-card class="q-pa-xl" flat>
        <q-spinner-dots size="3rem" color="secondary" class="q-mb-md" />
        <p class="text-body1 text-secondary">Chargement des quiz...</p>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import QuizObject from './QuizObject.vue'

const props = defineProps({
  dailyQuiz: {
    type: Object,
    default: null,
  },
  publicQuizzes: {
    type: Array,
    default: () => [],
  },
  displayLimit: {
    type: Number,
    default: 6,
  },
  showingAll: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['play-quiz', 'view-quiz', 'share-quiz', 'toggle-show-all'])

const router = useRouter()

const displayedQuizzes = computed(() => {
  const limit = props.showingAll ? props.publicQuizzes.length : props.displayLimit
  return props.publicQuizzes.slice(0, limit)
})

const calculateTotalTime = (questions) => {
  if (!questions || questions.length === 0) return 0
  const totalSeconds = questions.reduce((total, question) => {
    return total + (question.timeGiven || 45)
  }, 0)
  return Math.ceil(totalSeconds / 60)
}
</script>

<style lang="scss" scoped>
.daily-quiz-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
}

.quiz-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }
}

.quiz-logo {
  border-radius: 12px 12px 0 0;
}

.quiz-logo-placeholder {
  height: 120px;
  border-radius: 12px 12px 0 0;
}

.quiz-logo-container {
  position: relative;
  overflow: hidden;
}
</style>
