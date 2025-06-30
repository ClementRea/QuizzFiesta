<template>
  <q-header
    class="bg-white q-py-sm shadow-1"
    style="border-bottom: 1px solid #f5f4f0; position: relative"
  >
    <q-toolbar class="q-px-lg">
      <BackArrow v-if="$route.meta && $route.meta.showBackArrow" />
      <div class="row items-center q-gutter-md text-dark">
        <q-img
          class="q-mr-md"
          :style="
            $q.screen.xs ? { width: '40px', height: '40px' } : { width: '116px', height: '116px' }
          "
          :src="logo"
          alt="Quiz Fiesta Logo"
          fit="contain"
        />
      </div>

      <q-space />

      <div class="row items-center q-gutter-lg gt-sm q-mr-lg">
        <q-btn
          flat
          no-caps
          :class="{ 'text-primary': isActive('/accueil'), 'text-dark': !isActive('/accueil') }"
          class="text-weight-medium"
          @click="router.push('/accueil')"
        >
          Accueil
        </q-btn>
        <q-btn
          flat
          no-caps
          :class="{ 'text-primary': isActive('/quiz'), 'text-dark': !isActive('/quiz') }"
          class="text-weight-medium"
          @click="router.push('/quiz')"
        >
          Quiz
        </q-btn>
        <q-btn
          flat
          no-caps
          :class="{ 'text-primary': isActive('/scores'), 'text-dark': !isActive('/scores') }"
          class="text-weight-medium"
          @click="router.push('/scores')"
        >
          Classement
        </q-btn>
      </div>

      <div class="row items-center q-gutter-lg">
        <q-btn flat round class="bg-grey-2 text-dark shadow-1" size="md" icon="mdi-bell-outline">
          <q-badge v-if="notificationCount > 0" color="red" floating rounded>{{
            notificationCount
          }}</q-badge>
        </q-btn>

        <q-menu
          v-model="showNotifications"
          anchor="bottom right"
          self="top right"
          :offset="[0, 8]"
          class="q-pa-none"
          style="min-width: 300px; z-index: 9999"
        >
          <q-card>
            <q-card-section class="q-pa-md">
              <div class="text-h6 q-mb-md">Notifications</div>
              <q-list v-if="notifications.length > 0" separator>
                <q-item v-for="notification in notifications" :key="notification.id" clickable>
                  <q-item-section>
                    <q-item-label>{{ notification.title }}</q-item-label>
                    <q-item-label caption>{{ notification.message }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label caption>{{ notification.time }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="text-center text-grey-6 q-py-md">Aucune notification</div>
            </q-card-section>
          </q-card>
        </q-menu>

        <div class="cursor-pointer flex items-center">
          <Avatar :avatarUrl="userAvatar" size="sm" />

          <q-menu v-model="showUserMenu" anchor="bottom right" self="top right" :offset="[0, 8]">
            <q-list style="min-width: 150px">
              <q-item clickable @click="router.push('/account')">
                <q-item-section avatar>
                  <q-icon name="mdi-account" class="text-dark90" />
                </q-item-section>
                <q-item-section class="text-dark90">Mon profil</q-item-section>
              </q-item>
              <q-item clickable @click="router.push('/settings')">
                <q-item-section avatar>
                  <q-icon name="mdi-cog" class="text-dark90" />
                </q-item-section>
                <q-item-section class="text-dark90">Paramètres</q-item-section>
              </q-item>
              <q-separator />

              <q-item clickable @click="logout">
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
      />
    </q-toolbar>

    <!-- Menu mobile -->
    <q-slide-transition>
      <div v-if="mobileMenuOpen" class="lt-md bg-white q-pa-md shadow-1">
        <q-list>
          <q-item clickable @click="router.push('/accueil')">
            <q-item-section avatar>
              <q-icon name="mdi-home" color="dark80" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-dark80">Accueil</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable @click="router.push('/quiz')">
            <q-item-section avatar>
              <q-icon name="mdi-help-circle" color="dark80" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-dark80">Quiz</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable @click="router.push('/scores')">
            <q-item-section avatar>
              <q-icon name="mdi-trophy" color="dark80" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-dark80">Classement</q-item-label>
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
import axios from 'axios'

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
    await axios.post('http://localhost:3000/api/auth/logout')
    AuthService.clearTokens()
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}

// Récupérer l'avatar de l'utilisateur
const getUserData = async () => {
  try {
    if (AuthService.isAuthenticated()) {
      const response = await axios.get('http://localhost:3000/api/user/getMe', {
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
        },
      })
      userAvatar.value = response.data.data.user.avatar
    }
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error)
  }
}

onMounted(() => {
  getUserData()
})
</script>
