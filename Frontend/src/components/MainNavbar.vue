<template>
  <q-header
    class="bg-white q-py-sm shadow-1"
    style="border-bottom: 1px solid #f5f4f0; position: relative"
    role="banner"
  >
    <q-toolbar class="q-px-lg" role="navigation" aria-label="Navigation principale">
      <BackArrow v-if="$route.meta && $route.meta.showBackArrow" />
      <div class="row items-center q-gutter-md text-dark">
        <q-img
          class="q-mr-md cursor-pointer"
          :style="
            $q.screen.xs ? { width: '40px', height: '40px' } : { width: '116px', height: '116px' }
          "
          :src="logo"
          alt="Quiz Fiesta Logo - Retour à l'accueil"
          fit="contain"
          tabindex="0"
          role="button"
          @click="router.push('/accueil')"
          @keydown.enter="router.push('/accueil')"
          @keydown.space.prevent="router.push('/accueil')"
        />
      </div>

      <q-space />

      <nav
        class="row items-center q-gutter-lg gt-sm q-mr-lg"
        role="navigation"
        aria-label="Menu principal"
      >
        <q-btn
          flat
          no-caps
          :class="[
            'text-weight-medium',
            isActive('/accueil') ? 'bg-secondary q-btn-active' : 'text-dark',
          ]"
          style="transition: background 0.2s; border-radius: 8px"
          @click="router.push('/accueil')"
          tabindex="0"
          :aria-current="isActive('/accueil') ? 'page' : false"
          aria-label="Aller à l'accueil"
        >
          Accueil
        </q-btn>
        <q-btn
          flat
          no-caps
          :class="[
            'text-weight-medium',
            isActive('/scores') ? 'bg-secondary q-btn-active' : 'text-dark',
          ]"
          style="transition: background 0.2s; border-radius: 8px"
          @click="router.push('/scores')"
          tabindex="0"
          :aria-current="isActive('/scores') ? 'page' : false"
          aria-label="Aller au classement"
        >
          Classement
        </q-btn>
      </nav>

      <div class="row items-center q-gutter-lg" role="toolbar" aria-label="Actions utilisateur">
        <q-btn
          flat
          round
          class="bg-grey-2 text-dark shadow-1"
          size="md"
          icon="mdi-bell-outline"
          tabindex="0"
          aria-label="Notifications"
          :aria-describedby="notificationCount > 0 ? 'notification-count' : null"
        >
          <q-badge
            v-if="notificationCount > 0"
            color="red"
            floating
            rounded
            :id="notificationCount > 0 ? 'notification-count' : null"
            :aria-label="`${notificationCount} nouvelle${notificationCount > 1 ? 's' : ''} notification${notificationCount > 1 ? 's' : ''}`"
            >{{ notificationCount }}</q-badge
          >
        </q-btn>

        <q-menu
          v-model="showNotifications"
          anchor="bottom right"
          self="top right"
          :offset="[0, 8]"
          class="q-pa-none"
          style="min-width: 300px; z-index: 9999"
          role="menu"
          aria-label="Menu des notifications"
        >
          <q-card role="region" aria-label="Liste des notifications">
            <q-card-section class="q-pa-md">
              <div class="text-h6 q-mb-md">Notifications</div>
              <q-list v-if="notifications.length > 0" separator role="list">
                <q-item
                  v-for="notification in notifications"
                  :key="notification.id"
                  clickable
                  role="listitem"
                  tabindex="0"
                  :aria-label="`Notification: ${notification.title}. ${notification.message}`"
                >
                  <q-item-section>
                    <q-item-label>{{ notification.title }}</q-item-label>
                    <q-item-label caption>{{ notification.message }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label caption>{{ notification.time }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="text-center text-grey-6 q-py-md" role="status" aria-live="polite">
                Aucune notification
              </div>
            </q-card-section>
          </q-card>
        </q-menu>

        <div
          class="cursor-pointer flex items-center"
          tabindex="0"
          role="button"
          aria-label="Menu utilisateur"
        >
          <Avatar :avatarUrl="userAvatar" size="sm" />

          <q-menu
            v-model="showUserMenu"
            anchor="bottom right"
            self="top right"
            :offset="[0, 8]"
            role="menu"
            aria-label="Menu de l'utilisateur"
          >
            <q-list style="min-width: 150px" role="list">
              <q-item
                clickable
                @click="router.push('/account')"
                role="menuitem"
                tabindex="0"
                aria-label="Aller à mon profil"
              >
                <q-item-section avatar>
                  <q-icon name="mdi-account" class="text-secondary" />
                </q-item-section>
                <q-item-section class="text-secondary">Mon profil</q-item-section>
              </q-item>
              <q-item
                clickable
                @click="router.push('/settings')"
                role="menuitem"
                tabindex="0"
                aria-label="Aller aux paramètres"
              >
                <q-item-section avatar>
                  <q-icon name="mdi-cog" class="text-secondary" />
                </q-item-section>
                <q-item-section class="text-secondary">Paramètres</q-item-section>
              </q-item>
              <q-separator role="separator" />

              <q-item
                clickable
                @click="logout"
                role="menuitem"
                tabindex="0"
                aria-label="Se déconnecter"
              >
                <q-item-section avatar>
                  <q-icon name="mdi-logout" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative">Déconnexion</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>
      </div>

      <q-btn
        flat
        round
        dense
        icon="menu"
        class="lt-md text-dark q-ml-sm shadow-1"
        size="md"
        @click="mobileMenuOpen = !mobileMenuOpen"
        style="min-width: 40px; min-height: 40px"
        tabindex="0"
        aria-label="Ouvrir le menu mobile"
        :aria-expanded="mobileMenuOpen"
        aria-controls="mobile-menu"
      />
    </q-toolbar>

    <!-- Menu mobile -->
    <q-slide-transition>
      <div
        v-if="mobileMenuOpen"
        class="lt-md bg-white q-pa-md shadow-1"
        id="mobile-menu"
        role="navigation"
        aria-label="Menu de navigation mobile"
      >
        <q-list role="list">
          <q-item
            clickable
            @click="router.push('/accueil')"
            role="listitem"
            tabindex="0"
            aria-label="Aller à l'accueil"
          >
            <q-item-section avatar>
              <q-icon name="mdi-home" color="secondary" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-secondary">Accueil</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="router.push('/quiz')"
            role="listitem"
            tabindex="0"
            aria-label="Aller aux quiz"
          >
            <q-item-section avatar>
              <q-icon name="mdi-help-circle" color="secondary" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-secondary">Quiz</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="router.push('/scores')"
            role="listitem"
            tabindex="0"
            aria-label="Aller au classement"
          >
            <q-item-section avatar>
              <q-icon name="mdi-trophy" color="secondary" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-secondary">Classement</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-slide-transition>
  </q-header>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import Avatar from 'src/components/GetAvatar.vue'
import BackArrow from 'src/components/BackArrow.vue'
import logo from '../assets/logo_quiz_fiesta.svg'
import AuthService from 'src/services/AuthService'
import UserService from 'src/services/UserService'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

// États réactifs
const userAvatar = ref(null)
const mobileMenuOpen = ref(false)
const showNotifications = ref(false)
const showUserMenu = ref(false)

// Données de notifications (exemple)
const notifications = ref([
  {
    id: 1,
    title: 'Nouveau quiz disponible',
    message: 'Un nouveau quiz sur Vue.js a été ajouté',
    time: 'Il y a 2h',
  },
  {
    id: 2,
    title: 'Nouveau badge obtenu',
    message: 'Vous avez obtenu le badge "Expert Échecs"',
    time: 'Il y a 5h',
  },
  {
    id: 3,
    title: 'Invitation à rejoindre',
    message: 'Vous avez été invité à rejoindre l\'organisation "DevTeam"',
    time: 'Il y a 1 jour',
  },
])

// Nombre de notifications
const notificationCount = computed(() => notifications.value.length)

// Vérifier sur quelle page on est
const isActive = (path) => {
  return route.path.startsWith(path)
}

// Déconnexion
const logout = async () => {
  try {
    await AuthService.logout()
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    router.push('/login')
  }
}

// Récupérer l'avatar de l'utilisateur
const getUserData = async () => {
  try {
    if (AuthService.isAuthenticated()) {
      const response = await UserService.getMe()
      userAvatar.value = response.data.user.avatar
    }
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error)
  }
}

onMounted(() => {
  getUserData()
})
</script>
