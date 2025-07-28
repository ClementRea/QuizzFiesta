<template>
  <main class="full-width bg-gradient-primary" aria-label="Accueil QuizFiesta">
    <!-- Hero Section -->
    <section class="q-pa-lg rounded-borders-bottom">
      <div class="row justify-center">
        <div class="col-12 col-md-8 text-center">
          <div class="q-mb-lg">
            <h1 class="text-h3 text-secondary text-weight-bold q-mb-md">
              👋 Bonjour {{ userData.userName }} !
            </h1>
            <p class="text-h6 text-secondary q-mt-none q-mb-xl">
              Découvrez et créez des quiz captivants
            </p>
          </div>

          <!-- Search Bar -->
          <div class="q-mb-xl">
            <q-input
              v-model="searchQuery"
              aria-label="Rechercher un quiz par nom ou catégorie"
              placeholder="🔍 Rechercher un quiz..."
              outlined
              rounded
              bg-color="white"
              label-color="secondary"
              color="secondary"
              @input="handleSearch"
            >
              <template v-slot:prepend>
                <q-icon name="search" color="secondary" />
              </template>
            </q-input>
          </div>

          <!-- Action Buttons -->
          <div class="row q-gutter-md justify-center">
            <q-btn
              label="🎮 Rejoindre un Quiz"
              color="accent"
              text-color="secondary"
              rounded
              size="lg"
              class="col-12 col-sm-5 shadow-4 text-weight-medium"
              no-caps
              @click="router.push('/quiz/join')"
              unelevated
            />
            <q-btn
              label="➕ Créer un Quiz"
              color="secondary"
              text-color="primary"
              rounded
              size="lg"
              class="col-12 col-sm-5 shadow-4 text-weight-medium"
              no-caps
              @click="router.push('/quiz/create')"
              unelevated
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Quiz Section -->
    <section class="q-pa-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-10">
          <DayliQuiz
            :daily-quiz="dailyQuiz"
            :public-quizzes="publicQuizzes"
            :display-limit="displayLimit"
            :showing-all="showingAll"
            :loading="loading"
            @play-quiz="handlePlayQuiz"
            @view-quiz="handleViewQuiz"
            @share-quiz="handleShareQuiz"
            @toggle-show-all="toggleShowAll"
          />
        </div>
      </div>
    </section>

    <!-- Quick Actions Section -->
    <section class="bg-white q-pa-lg q-mt-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-8">
          <div class="text-center q-mb-lg">
            <h2 class="text-h5 text-secondary text-weight-bold">⚙️ Mes Actions</h2>
          </div>

          <div class="row q-gutter-md justify-center">
            <q-btn
              label="📊 Gérer mes Quiz"
              color="secondary"
              rounded
              class="col-12 col-sm-5 shadow-2"
              size="md"
              no-caps
              @click="router.push('/quiz/manage')"
              outline
            />
            <q-btn
              label="📈 Statistiques"
              color="secondary"
              rounded
              class="col-12 col-sm-5 shadow-2"
              size="md"
              no-caps
              outline
              disabled
            />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import UserService from 'src/services/UserService'
import QuizService from 'src/services/QuizService'
import DayliQuiz from 'src/components/DayliQuiz.vue'

const $q = useQuasar()
const router = useRouter()

// Reactive data
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const displayLimit = ref(6)
const showingAll = ref(false)

const userData = ref({
  userName: '',
  avatar: '',
})

const publicQuizzes = ref([])
const dailyQuiz = ref(null)

// Computed properties

// Methods
const getUser = async () => {
  try {
    const response = await UserService.getMe()
    const user = response.data.user

    userData.value = {
      userName: user.userName || 'Utilisateur',
      avatar: user.avatar || '',
    }
  } catch (err) {
    console.error('Error loading user:', err)
    userData.value.userName = 'Utilisateur'
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les informations du compte',
      position: 'top',
    })
  }
}

const getPublicQuizzes = async () => {
  try {
    const response = await QuizService.getAllQuizzes({
      isPublic: true,
    })

    if (response && response.data && response.data.quizes) {
      // Trier par date de création (utiliser startDate ou createdAt)
      publicQuizzes.value = response.data.quizes.sort(
        (a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt),
      )

      // Sélectionner le quiz du jour
      if (publicQuizzes.value.length > 0) {
        dailyQuiz.value = publicQuizzes.value[0]
        publicQuizzes.value = publicQuizzes.value.slice(1)
      }
    }
  } catch (err) {
    console.error('Error loading public quizzes:', err)
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les quiz publics',
      position: 'top',
    })
  }
}

const handleSearch = () => {
  // TODO: Implémenter la logique de recherche
  console.log('Searching for:', searchQuery.value)
}

const toggleShowAll = () => {
  showingAll.value = !showingAll.value
}

const handlePlayQuiz = (quiz) => {
  // TODO: Implémenter la logique pour démarrer un quiz
  router.push(`/quiz/play/${quiz._id}`)
}

const handleViewQuiz = (quiz) => {
  // TODO: Implémenter la logique pour voir les détails d'un quiz
  router.push(`/quiz/view/${quiz._id}`)
}

const handleShareQuiz = (quiz) => {
  // TODO: Implémenter la logique de partage
  if (navigator.share) {
    navigator.share({
      title: quiz.title,
      text: quiz.description,
      url: `${window.location.origin}/quiz/play/${quiz._id}`,
    })
  } else {
    // Fallback pour les navigateurs qui ne supportent pas l'API de partage
    navigator.clipboard.writeText(`${window.location.origin}/quiz/play/${quiz._id}`)
    $q.notify({
      color: 'positive',
      message: 'Lien du quiz copié dans le presse-papier',
      position: 'top',
    })
  }
}

const initializePage = async () => {
  loading.value = true
  error.value = null

  try {
    // Charger les données en parallèle
    await Promise.all([getUser(), getPublicQuizzes()])
  } catch (err) {
    console.error('Error initializing page:', err)
    error.value = 'Erreur lors du chargement de la page'
  } finally {
    loading.value = false
  }
}

onMounted(initializePage)
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #f5f2e8 0%, #ece8d2 100%);
  min-height: 100vh;
}

.rounded-borders-bottom {
  border-radius: 0 0 2rem 2rem;
}

.rounded-borders-top {
  border-radius: 2rem 2rem 0 0;
}
</style>
