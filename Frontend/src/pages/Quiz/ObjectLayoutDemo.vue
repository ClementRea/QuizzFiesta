<template>
  <div class="object-layout-demo q-pa-lg">
    <!-- Header -->
    <div class="text-center q-mb-xl">
      <div class="text-h4 text-primary q-mb-sm">Démo ObjectLayout</div>
      <div class="text-subtitle1 text-grey-7">
        Composant flexible pour afficher les quiz en différentes tailles
      </div>
    </div>

    <!-- Contrôles -->
    <div class="row justify-center q-mb-xl">
      <q-card flat bordered class="q-pa-md">
        <div class="text-subtitle2 q-mb-md">Taille d'affichage :</div>
        <q-btn-toggle
          v-model="selectedSize"
          toggle-color="primary"
          :options="sizeOptions"
          class="q-mb-md"
        />

        <div class="row q-gutter-md q-mt-md">
          <q-toggle v-model="clickable" label="Cliquable" />
          <q-toggle v-model="flat" label="Flat" />
          <q-toggle v-model="loading" label="Loading" />
        </div>
      </q-card>
    </div>

    <!-- Démonstration par taille -->
    <div class="column q-gutter-xl">
      <!-- Taille XS -->
      <div>
        <div class="text-h6 q-mb-md flex items-center">
          <q-icon name="mdi-size-xs" class="q-mr-sm" />
          Taille XS - Liste compacte mobile
        </div>
        <div class="text-body2 text-grey-7 q-mb-md">
          Parfait pour les listes mobiles, affichage minimal avec titre et actions essentielles
        </div>
        <div class="row q-gutter-sm">
          <ObjectLayout
            v-for="quiz in sampleQuizzes.slice(0, 3)"
            :key="`xs-${quiz._id}`"
            :object="quiz"
            size="xs"
            :clickable="clickable"
            :flat="flat"
            :loading="loading"
            @click="handleQuizClick"
            @view="handleView"
            @edit="handleEdit"
          />
        </div>
      </div>

      <!-- Taille SM -->
      <div>
        <div class="text-h6 q-mb-md flex items-center">
          <q-icon name="mdi-size-s" class="q-mr-sm" />
          Taille SM - Cards de grille
        </div>
        <div class="text-body2 text-grey-7 q-mb-md">
          Idéal pour les grilles de quiz, avec image, titre et métadonnées de base
        </div>
        <div class="row q-gutter-md">
          <ObjectLayout
            v-for="quiz in sampleQuizzes.slice(0, 2)"
            :key="`sm-${quiz._id}`"
            :object="quiz"
            size="sm"
            :clickable="clickable"
            :flat="flat"
            :loading="loading"
            @click="handleQuizClick"
            @view="handleView"
            @edit="handleEdit"
          />
        </div>
      </div>

      <!-- Taille MD -->
      <div>
        <div class="text-h6 q-mb-md flex items-center">
          <q-icon name="mdi-size-m" class="q-mr-sm" />
          Taille MD - Liste standard (recommandée)
        </div>
        <div class="text-body2 text-grey-7 q-mb-md">
          Taille parfaite pour les listes de quiz avec toutes les informations importantes
        </div>
        <div class="column q-gutter-md">
          <ObjectLayout
            v-for="quiz in sampleQuizzes.slice(0, 2)"
            :key="`md-${quiz._id}`"
            :object="quiz"
            size="md"
            :clickable="clickable"
            :flat="flat"
            :loading="loading"
            @click="handleQuizClick"
            @view="handleView"
            @edit="handleEdit"
          >
            <template #quick-actions>
              <q-btn flat dense round icon="share" color="primary" @click.stop="shareQuiz(quiz)">
                <q-tooltip>Partager</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                icon="favorite_border"
                color="red"
                @click.stop="toggleFavorite(quiz)"
              >
                <q-tooltip>Favoris</q-tooltip>
              </q-btn>
            </template>
          </ObjectLayout>
        </div>
      </div>

      <!-- Taille LG -->
      <div>
        <div class="text-h6 q-mb-md flex items-center">
          <q-icon name="mdi-size-l" class="q-mr-sm" />
          Taille LG - Vue détaillée
        </div>
        <div class="text-body2 text-grey-7 q-mb-md">
          Pour afficher plus de détails, avec code de partage visible
        </div>
        <div class="column q-gutter-md">
          <ObjectLayout
            :object="sampleQuizzes[0]"
            size="lg"
            :clickable="clickable"
            :flat="flat"
            :loading="loading"
            @click="handleQuizClick"
            @view="handleView"
            @edit="handleEdit"
          >
            <template #metadata>
              <q-chip dense color="blue" text-color="white" size="md">
                <q-icon name="mdi-fire" class="q-mr-xs" />
                Populaire
              </q-chip>
            </template>

            <template #actions="{ object }">
              <q-btn flat color="primary" @click.stop="playQuiz(object)">
                <q-icon name="play_arrow" class="q-mr-xs" />
                Jouer maintenant
              </q-btn>
              <q-space />
              <q-btn flat color="grey-7" @click.stop="shareQuiz(object)">
                <q-icon name="share" class="q-mr-xs" />
                Partager
              </q-btn>
              <q-btn flat color="grey-7" @click.stop="handleEdit(object)">
                <q-icon name="edit" class="q-mr-xs" />
                Modifier
              </q-btn>
            </template>
          </ObjectLayout>
        </div>
      </div>

      <!-- Taille XL -->
      <div>
        <div class="text-h6 q-mb-md flex items-center">
          <q-icon name="mdi-size-xl" class="q-mr-sm" />
          Taille XL - Vue complète
        </div>
        <div class="text-body2 text-grey-7 q-mb-md">
          Vue la plus complète avec toutes les informations et métadonnées étendues
        </div>
        <ObjectLayout
          :object="sampleQuizzes[1]"
          size="xl"
          :clickable="clickable"
          :flat="flat"
          :loading="loading"
          @click="handleQuizClick"
          @view="handleView"
          @edit="handleEdit"
        >
          <template #extended-info="{ object }">
            <div class="text-subtitle2 text-grey-7 q-mb-xs">Statistiques</div>
            <div class="column q-gutter-xs">
              <div>
                <q-icon name="mdi-account-group" class="q-mr-sm" />
                <span class="text-body2">{{ object.stats?.totalPlayers || 0 }} joueurs</span>
              </div>
              <div>
                <q-icon name="mdi-star" class="q-mr-sm" />
                <span class="text-body2"
                  >{{ object.stats?.averageScore || 0 }}% de réussite moyenne</span
                >
              </div>
              <div>
                <q-icon name="mdi-clock" class="q-mr-sm" />
                <span class="text-body2">{{ object.stats?.averageTime || 0 }} min en moyenne</span>
              </div>
            </div>
          </template>

          <template #actions="{ object }">
            <q-btn unelevated color="primary" @click.stop="playQuiz(object)">
              <q-icon name="play_arrow" class="q-mr-sm" />
              Commencer le quiz
            </q-btn>

            <q-btn flat color="secondary" @click.stop="viewStats(object)">
              <q-icon name="mdi-chart-line" class="q-mr-sm" />
              Voir les statistiques
            </q-btn>

            <q-space />

            <q-btn-dropdown flat color="grey-7" icon="more_vert" auto-close>
              <q-list>
                <q-item clickable @click="handleEdit(object)">
                  <q-item-section avatar>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Modifier</q-item-section>
                </q-item>

                <q-item clickable @click="shareQuiz(object)">
                  <q-item-section avatar>
                    <q-icon name="share" />
                  </q-item-section>
                  <q-item-section>Partager</q-item-section>
                </q-item>

                <q-item clickable @click="duplicateQuiz(object)">
                  <q-item-section avatar>
                    <q-icon name="content_copy" />
                  </q-item-section>
                  <q-item-section>Dupliquer</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable @click="deleteQuiz(object)" class="text-negative">
                  <q-item-section avatar>
                    <q-icon name="delete" color="negative" />
                  </q-item-section>
                  <q-item-section>Supprimer</q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </template>
        </ObjectLayout>
      </div>

      <!-- Taille sélectionnée -->
      <div>
        <div class="text-h6 q-mb-md flex items-center">
          <q-icon name="mdi-eye" class="q-mr-sm" />
          Aperçu - Taille {{ selectedSize.toUpperCase() }}
        </div>
        <div class="text-body2 text-grey-7 q-mb-md">
          Testez les différentes options avec les contrôles ci-dessus
        </div>
        <ObjectLayout
          :object="sampleQuizzes[2]"
          :size="selectedSize"
          :clickable="clickable"
          :flat="flat"
          :loading="loading"
          @click="handleQuizClick"
          @view="handleView"
          @edit="handleEdit"
          @copy-code="handleCopyCode"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import ObjectLayout from 'src/layouts/ObjectLayout.vue'

const $q = useQuasar()

// État réactif
const selectedSize = ref('md')
const clickable = ref(true)
const flat = ref(false)
const loading = ref(false)

// Options de taille
const sizeOptions = [
  { label: 'XS', value: 'xs' },
  { label: 'SM', value: 'sm' },
  { label: 'MD', value: 'md' },
  { label: 'LG', value: 'lg' },
  { label: 'XL', value: 'xl' },
]

// Données d'exemple
const sampleQuizzes = ref([
  {
    _id: '1',
    title: 'Culture Générale Française',
    subtitle: 'Testez vos connaissances sur la France',
    description:
      'Un quiz complet sur la culture française : histoire, géographie, littérature, cinéma et traditions. Parfait pour découvrir ou redécouvrir les richesses de notre patrimoine culturel.',
    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400',
    questions: 25,
    isPublic: true,
    status: 'active',
    joinCode: 'FR2024',
    startDate: '2024-01-15T10:00:00.000Z',
    createdAt: '2024-01-10T14:30:00.000Z',
    createdBy: {
      userName: 'Marie Dubois',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    stats: {
      totalPlayers: 1247,
      averageScore: 78,
      averageTime: 12,
    },
  },
  {
    _id: '2',
    title: 'Sciences et Technologies',
    subtitle: 'Innovations et découvertes',
    description:
      "Explorez les dernières avancées scientifiques et technologiques. De la physique quantique à l'intelligence artificielle, en passant par la biologie moléculaire.",
    questions: 30,
    isPublic: false,
    status: 'not_started',
    joinCode: 'SCI2024',
    startDate: '2024-02-01T15:00:00.000Z',
    endDate: '2024-02-28T18:00:00.000Z',
    createdAt: '2024-01-20T09:15:00.000Z',
    createdBy: {
      userName: 'Dr. Pierre Martin',
    },
    stats: {
      totalPlayers: 892,
      averageScore: 65,
      averageTime: 18,
    },
  },
  {
    _id: '3',
    title: 'Histoire du Cinéma',
    subtitle: 'Des pionniers aux blockbusters',
    description:
      "Un voyage à travers l'histoire du 7ème art, des frères Lumière aux productions contemporaines.",
    questions: 20,
    isPublic: true,
    status: 'ended',
    startDate: '2023-12-01T20:00:00.000Z',
    endDate: '2023-12-31T23:59:00.000Z',
    createdAt: '2023-11-25T16:45:00.000Z',
    createdBy: {
      userName: 'Cinéphile92',
    },
  },
  {
    _id: '4',
    title: 'Quiz Express',
    description: 'Quiz rapide de 10 questions',
    questions: 10,
    isPublic: true,
    status: 'active',
    startDate: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T12:00:00.000Z',
    createdBy: 'QuizMaster',
  },
])

// Méthodes
const handleQuizClick = (quiz) => {
  $q.notify({
    type: 'info',
    message: `Quiz cliqué: ${quiz.title}`,
    position: 'top',
  })
}

const handleView = (quiz) => {
  $q.notify({
    type: 'positive',
    message: `Voir le quiz: ${quiz.title}`,
    position: 'top',
  })
}

const handleEdit = (quiz) => {
  $q.notify({
    type: 'warning',
    message: `Modifier le quiz: ${quiz.title}`,
    position: 'top',
  })
}

const handleCopyCode = (code) => {
  $q.notify({
    type: 'positive',
    message: `Code ${code} copié!`,
    position: 'top',
  })
}

const playQuiz = (quiz) => {
  $q.notify({
    type: 'positive',
    message: `Démarrage du quiz: ${quiz.title}`,
    position: 'top',
  })
}

const shareQuiz = (quiz) => {
  $q.notify({
    type: 'info',
    message: `Partager: ${quiz.title}`,
    position: 'top',
  })
}

const toggleFavorite = (quiz) => {
  $q.notify({
    type: 'positive',
    message: `Ajouté aux favoris: ${quiz.title}`,
    position: 'top',
  })
}

const viewStats = (quiz) => {
  $q.notify({
    type: 'info',
    message: `Statistiques de: ${quiz.title}`,
    position: 'top',
  })
}

const duplicateQuiz = (quiz) => {
  $q.notify({
    type: 'info',
    message: `Dupliquer: ${quiz.title}`,
    position: 'top',
  })
}

const deleteQuiz = (quiz) => {
  $q.notify({
    type: 'negative',
    message: `Supprimer: ${quiz.title}`,
    position: 'top',
  })
}
</script>

<style scoped>
.object-layout-demo {
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}
</style>
