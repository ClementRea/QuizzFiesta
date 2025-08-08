<template>
  <div class="daily-quiz-section">
    <div v-if="dailyQuiz" class="q-mb-xl">
      <div class="text-start q-mb-lg">
        <div class="flex row items-center q-mb-sm">
          <q-icon name="mdi-calendar-today" color="secondary" size="md" class="q-mr-sm" />
          <h2 class="text-h4 text-secondary text-weight-bold q-ma-none">Quiz du Jour</h2>
        </div>
        <p class="text-body1 text-secondary">Le quiz le plus populaire aujourd'hui</p>
        <q-separator class="q-mt-md" color="secondary" size="2px" />
      </div>

      <div>
        <QuizObject :quiz="dailyQuiz" size="md" />
      </div>
    </div>

    <div v-if="publicQuizzes.length > 0">
      <div class="text-start q-mb-lg">
        <div class="flex row items-center q-mb-sm">
          <q-icon name="mdi-star" color="yellow" size="lg" class="q-mr-sm" />
          <h2 class="text-h4 text-secondary text-weight-bold q-ma-none">Quiz populaires</h2>
        </div>
        <p class="text-body1 text-secondary">Découvrez les quiz les plus appréciés</p>
        <q-separator class="q-mt-md" color="secondary" size="2px" />
      </div>

      <div>
        <QuizObject :quiz="publicQuizzes[0]" size="md" />
      </div>

      <div v-if="publicQuizzes.length > displayLimit" class="text-center q-mt-xl">
        <q-btn
          :label="showingAll ? 'Voir Moins' : 'Voir Plus'"
          color="secondary"
          outline
          rounded
          size="md"
          no-caps
          class="shadow-2"
        />
      </div>
    </div>

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

    <div v-if="loading" class="text-center q-pa-xl">
      <q-card class="q-pa-xl" flat>
        <q-spinner-dots size="3rem" color="secondary" class="q-mb-md" />
        <p class="text-body1 text-secondary">Chargement des quiz...</p>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import QuizObject from '../quiz/QuizObject.vue'

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

const router = useRouter()
</script>
