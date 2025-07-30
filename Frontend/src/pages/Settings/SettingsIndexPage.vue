<template>
  <div class="q-pa-md">
    <div class="flex flex-center q-mt-xl">
      <q-card class="q-pa-lg shadow-2" style="max-width: 400px; width: 100%">
        <div class="text-h6 text-center q-mb-md">Actions rapides</div>
        <div class="column q-gutter-md">
          <q-btn
            color="primary"
            text-color="secondary"
            icon="mdi-plus-box"
            label="Créer un quiz"
            class="q-py-md"
            rounded
            @click="router.push('/quiz/create')"
          />
          <div class="text-caption text-center text-grey-7 q-mb-sm">
            Lance la création d’un nouveau quiz pour la communauté.
          </div>
          <q-btn
            color="secondary"
            icon="mdi-domain-plus"
            label="Créer une organisation"
            class="q-py-md"
            rounded
            @click="router.push('/organisation/create')"
          />
          <div class="text-caption text-center text-grey-7">
            Regroupe des membres et gérez vos quiz ensemble.
          </div>
          <q-separator class="q-my-md" />
          <q-btn color="negative" label="Déconnexion" icon="mdi-logout" rounded @click="logout" />
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { useRouter } from 'vue-router'
import AuthService from 'src/services/AuthService'
import BackArrow from 'src/components/common/BackArrow.vue'

const router = useRouter()

const logout = async () => {
  try {
    await axios.post('http://localhost:3000/api/auth/logout')
    AuthService.clearTokens()
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}
</script>
