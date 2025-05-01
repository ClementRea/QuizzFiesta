<template>
  <div class="column items-center">
    <q-btn color="negative" label="Déconnexion" icon="mdi-logout" rounded @click="logout" />
  </div>
</template>

<script setup>
import axios from 'axios'
import { useRouter } from 'vue-router'
import AuthService from 'src/services/AuthService'

const router = useRouter()

const logout = async () => {
  try {
    await axios.post('http://localhost:3000/api/auth/logout')

    AuthService.clearToken()

    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}
</script>
