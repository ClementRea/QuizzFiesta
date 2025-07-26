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

    <!-- Quiz du Jour Section -->
    <section v-if="dailyQuiz" class="q-pa-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-10">
          <div class="text-center q-mb-lg">
            <h2 class="text-h4 text-secondary text-weight-bold q-mb-sm">⭐ Quiz du Jour</h2>
            <p class="text-body1 text-secondary">Le quiz le plus populaire aujourd'hui</p>
            <q-separator class="q-mt-md" color="accent" size="2px" />
          </div>

          <div class="row justify-center">
            <div class="col-12 col-md-8">
              <div class="bg-accent rounded-borders q-pa-md shadow-8">
                <QuizObject
                  :quiz="dailyQuiz"
                  :show-edit-button="false"
                  :show-delete-button="false"
                  :show-view-button="true"
                  :show-share-button="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quiz Publics Populaires -->
    <section v-if="publicQuizzes.length > 0" class="q-pa-lg">
      <div class="row justify-center">
        <div class="col-12 col-md-10">
          <div class="text-center q-mb-lg">
            <h2 class="text-h4 text-secondary text-weight-bold q-mb-sm">🔥 Quiz Populaires</h2>
            <p class="text-body1 text-secondary">Découvrez les quiz les plus appréciés</p>
            <q-separator class="q-mt-md" color="secondary" size="2px" />
          </div>

          <div class="row q-gutter-lg">
            <div v-for="quiz in displayedQuizzes" :key="quiz._id" class="col-12 col-sm-6 col-md-4">
              <div class="bg-white rounded-borders q-pa-md shadow-4 full-height">
                <QuizObject
                  :quiz="quiz"
                  :show-edit-button="false"
                  :show-delete-button="false"
                  :show-view-button="true"
                  :show-share-button="true"
                />
              </div>
            </div>
          </div>

          <!-- Load More Button -->
          <div v-if="publicQuizzes.length > displayLimit" class="text-center q-mt-xl">
            <q-btn
              :label="showingAll ? 'Voir Moins' : 'Voir Plus'"
              color="secondary"
              outline
              rounded
              size="md"
              @click="toggleShowAll"
              no-caps
              class="shadow-2"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Empty State -->
    <section v-if="!loading && publicQuizzes.length === 0" class="q-pa-xl">
      <div class="row justify-center">
        <div class="col-12 col-md-6">
          <div class="bg-white rounded-borders q-pa-xl text-center shadow-4">
            <q-icon name="quiz" size="4rem" color="secondary" class="q-mb-lg" />
            <h3 class="text-h5 text-secondary text-weight-bold q-mb-md">
              Aucun quiz public disponible
            </h3>
            <p class="text-body1 text-secondary q-mb-xl">
              Soyez le premier à créer un quiz public !
            </p>
            <q-btn
              label="Créer mon premier Quiz"
              color="secondary"
              rounded
              size="lg"
              @click="router.push('/quiz/create')"
              no-caps
              class="shadow-2"
            />
          </div>
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

    <!-- Loading State -->
    <div v-if="loading" class="q-pa-xl">
      <div class="row justify-center">
        <div class="col-12 col-md-6">
          <div class="bg-white rounded-borders q-pa-xl text-center shadow-4">
            <q-spinner-dots size="3rem" color="secondary" class="q-mb-md" />
            <p class="text-body1 text-secondary">Chargement des quiz...</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import UserService from 'src/services/UserService'
import QuizService from 'src/services/QuizService'
import QuizObject from 'src/components/QuizObject.vue'

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
const displayedQuizzes = computed(() => {
  const limit = showingAll.value ? publicQuizzes.value.length : displayLimit.value
  return publicQuizzes.value.slice(0, limit)
})

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
      active: true,
    })

    if (response.data && response.data.quizzes) {
      // Trier par popularité (nombre de participants ou date de création)
      publicQuizzes.value = response.data.quizzes.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      )

      // Sélectionner le quiz du jour (le plus récent ou populaire)
      if (publicQuizzes.value.length > 0) {
        dailyQuiz.value = publicQuizzes.value[0]
        // Retirer le quiz du jour de la liste des quiz populaires
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
