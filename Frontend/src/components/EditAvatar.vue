<template>
  <UploadFiles v-model="EditAvatarDialog" @selected="handleAvatarSelected" />
</template>

<script setup>
import axios from 'axios'
import { ref } from 'vue'
import AuthService from 'src/services/AuthService'
import UploadFiles from './UploadFiles.vue'

const EditAvatarDialog = ref(false)

const handleAvatarSelected = async (file) => {
  console.log('Selected file:', file)
  await axios.put('http://localhost:3000/api/user/updateMe', {
    headers: {
      Authorization: `Bearer ${AuthService.getToken()}`,
    },
  })
}
</script>
