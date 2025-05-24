<template>
  <div class="full-width">
    <div class="row justify-between q-pa-md">
      <div class="col column no-wrap">
        <span class="text-h6 text-dark90 text-bold">Bonjour {{ userData.userName }} !</span>
        <span class="text-body1 text-dark90">Trouvez des quiz ici</span>
      </div>

      <Avatar :avatarUrl="userData.avatar" :size="$q.screen.xs ? 'sm' : 'md'" />
    </div>
  </div>
  <div>
    <q-input
      aria-placeholder="Rechercher un quiz"
      placeholder="Rechercher (Management, Jeux...)"
      outlined
      rounded
      bg-color="light20"
      class="q-pa-md custom-input-shadow"
    >
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
    </q-input>
  </div>

  <div class="flex justify-end">
    <q-btn
      label="Créer un quiz"
      color="dark80"
      rounded
      class="q-ma-md"
      text-color="light20"
      size="md"
      icon="mdi-plus"
      @click="router.push('/quiz/create')"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import Avatar from 'src/components/GetAvatar.vue'

const $q = useQuasar()

const loading = ref(true)
const error = ref(null)
const router = useRouter()

const userData = ref({
  userName: '',
  avatar: '',
})

const getUser = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await axios.get('http://localhost:3000/api/user/getMe')
    const user = response.data.data.user

    userData.value = {
      userName: user.userName || '',
      avatar: user.avatar || '',
    }
    console.log('avatar', user.avatar)
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Une erreur est survenue'
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les informations du compte',
    })
  } finally {
    loading.value = false
  }
}

onMounted(getUser)
</script>

<style scoped>
.custom-input-shadow :deep(.q-field__control) {
  box-shadow: inset 0 5px 4px rgba(0, 0, 0, 0.15);
}
</style>
