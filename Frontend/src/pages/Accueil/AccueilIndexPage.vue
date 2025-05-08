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
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'
import Avatar from 'src/components/GetAvatar.vue'

const $q = useQuasar()

const loading = ref(true)
const error = ref(null)

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
