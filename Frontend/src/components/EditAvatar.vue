<template>
  <UploadFiles v-model="EditAvatarDialog" @selected="handleAvatarSelected" />
</template>

<script setup>
import { ref } from 'vue'
import UploadFiles from './UploadFiles.vue'

const EditAvatarDialog = ref(false)

// Définir les props et émissions
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'selected'])

const handleAvatarSelected = (file) => {
  emit('selected', file)
  emit('update:modelValue', false)
}
</script>
