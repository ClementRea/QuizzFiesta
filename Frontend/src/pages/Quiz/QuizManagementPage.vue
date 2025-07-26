<template>
  <div class="quiz-management-page q-pa-lg bg-primary">
    <div class="row justify-center">
      <div class="col-12 col-lg-10">
        <div class="text-center q-mb-xl">
          <div class="text-h4 text-primary q-mb-sm">
            <q-icon name="mdi-format-list-bulleted" class="q-mr-sm text-secondary" />
            <span class="text-secondary">Mes Quiz</span>
          </div>
          <div class="text-subtitle1 text-secondary">
            Gérez vos quiz et générez des codes de partage
          </div>
          <q-btn
            v-if="!loading && quizzes.length > 0"
            unelevated
            rounded
            color="secondary"
            text-color="primary"
            class="q-mt-lg"
            @click="$router.push('/quiz/create')"
          >
            <q-icon name="add" class="q-mr-sm" />
            Créer un quiz
          </q-btn>
        </div>

        <div v-if="loading" class="text-center q-py-xl">
          <q-spinner color="primary" size="xl" />
          <div class="text-h6 q-mt-md text-grey-6">Chargement de vos quiz...</div>
        </div>

        <div v-else-if="quizzes.length === 0" class="text-center q-py-xl">
          <q-icon name="mdi-quiz" size="xl" color="grey-5" />
          <div class="text-h6 q-mt-md text-grey-6">Aucun quiz trouvé</div>
          <div class="text-body2 text-grey-5 q-mt-sm">
            Créez votre premier quiz pour commencer !
          </div>
          <q-btn
            unelevated
            color="secondary"
            text-color="primary"
            class="q-mt-lg"
            @click="$router.push('/quiz/create')"
          >
            <q-icon name="add" class="q-mr-sm" />
            <span>Créer un quiz</span>
          </q-btn>
        </div>

        <div v-else class="q-gutter-md flex row">
          <QuizObject
            v-for="quiz in quizzes"
            :key="quiz._id"
            :quiz="quiz"
            @updated="handleQuizUpdated"
            @deleted="handleQuizDeleted"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import QuizService from 'src/services/QuizService'
import QuizObject from 'src/components/QuizObject.vue'

const $q = useQuasar()

const loading = ref(false)
const quizzes = ref([])

onMounted(() => {
  loadQuizzes()
})

const loadQuizzes = async () => {
  loading.value = true
  try {
    const response = await QuizService.getMyQuizes()
    quizzes.value = response.data.quizes
  } catch (error) {
    console.error('Erreur chargement quiz:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement des quiz',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

// Gestionnaires d'événements pour QuizObject en mode automatique
const handleQuizUpdated = (updatedQuiz) => {
  const index = quizzes.value.findIndex((q) => q._id === updatedQuiz._id)
  if (index !== -1) {
    quizzes.value[index] = updatedQuiz
  }
}

const handleQuizDeleted = (deletedQuiz) => {
  quizzes.value = quizzes.value.filter((q) => q._id !== deletedQuiz._id)
}
</script>

<style scoped>
.quiz-management-page {
  min-height: 100vh;
}
</style>
