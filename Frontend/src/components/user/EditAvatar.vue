<template>
  <UploadFiles v-model="dialogVisible" @selected="handleAvatarSelected" />
</template>

<script setup>
import { computed } from 'vue'
import UploadFiles from './UploadFiles.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'selected'])

const dialogVisible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const handleAvatarSelected = (file) => {
  emit('selected', file)
  emit('update:modelValue', false)
}
</script>
