<template>
  <div class="bg-primary full-width" style="border-radius: 20px 20px 0px 0px">
    <div class="column flex flex-center q-gutter-y-md">
      <div style="width: 100%" class="flex justify-center">
        <div>
          <Avatar
            :avatarUrl="user?.avatar"
            style="width: 100%"
            :size="$q.screen.xs ? 'md' : 'xl'"
          />
        </div>
      </div>
      <span class="text-secondary text-h5">{{ user?.userName }}</span>
      <q-btn
        class="q-mb-lg"
        color="secondary"
        text-color="primary"
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
import UserService from 'src/services/UserService'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthService from 'src/services/AuthService'
import { useQuasar } from 'quasar'
import AccountToggle from '../../components/user/AccountToggle.vue'
import Avatar from 'src/components/user/GetAvatar.vue'

const user = ref(null)
const loading = ref(true)
const error = ref(null)
const router = useRouter()
const $q = useQuasar()

//Get the user
const getUser = async () => {
  loading.value = true
  error.value = null

  try {
    if (!AuthService.isAuthenticated()) {
      loading.value = true
      error.value = null
    }
    const userData = await UserService.getMe()
    user.value = userData.data.user
  } catch (error) {
    console.error(error)
    error.value = error
  } finally {
    loading.value = false
  }
}

onMounted(getUser)
</script>
