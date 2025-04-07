<template>
  <AcountHeader />
  <div class="bg-light10 full-width" style="border-radius: 20px 20px 0px 0px">
    <div class="column flex flex-center q-gutter-y-md">
      <div style="width: 100%" class="flex justify-center">
        <div style="width: 20%; border: 1px solid black; border-radius: 16px" class="bg-normal40">
          <q-img :src="getAvatarName(user?.avatar)" :ratio="1" />
        </div>
      </div>
      <span class="text-dark90 text-h5">{{ user?.userName }}</span>
      <q-btn
        class="q-mb-lg"
        color="dark90"
        text-color="light20"
        label="Editer le profil"
        no-caps
        unelevated
        @click="() => router.push(`/account/edit`)"
      />

      <AccountToggle />
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthService from 'src/services/AuthService'
import AccountToggle from '../../components/AccountToggle.vue'
import AcountHeader from '../../components/AccountHeader.vue'

const user = ref(null)
const loading = ref(true)
const error = ref(null)
const avatarPreview = ref(null)
const router = useRouter()

//Get the user
const getUser = async () => {
  loading.value = true
  error.value = null

  try {
    if (!AuthService.isAuthenticated()) {
      loading.value = true
      error.value = null
    }
    const userData = await axios.get('http://localhost:3000/api/user/getMe')
    user.value = userData.data.data.user
  } catch (error) {
    console.error(error)
    error.value = error
  } finally {
    loading.value = false
  }
}

function getAvatarName(avatar) {
  if (avatarPreview.value) {
    return avatarPreview.value
  }

  if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
    return avatar
  }

  if (avatar && avatar.includes('avatar-')) {
    return `http://localhost:3000/avatars/${avatar}`
  }

  if (avatar) {
    return `/src/assets/avatar/${avatar}`
  }
  return `/src/assets/avatar/default-avatar.png`
}
onMounted(getUser)
</script>
