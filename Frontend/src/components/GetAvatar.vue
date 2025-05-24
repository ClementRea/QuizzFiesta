<!-- GetAvatar.vue -->
<template>
  <div class="q-mb-md">
    <div
      class="bg-normal50 rounded-borders overflow-hidden"
      :style="{
        width: sizeMap[size] || '96px',
        height: sizeMap[size] || '96px',
        border: '1px solid black',
        borderRadius: '16px',
      }"
    >
      <q-img
        :src="processedAvatarUrl"
        :ratio="1"
        fit="cover"
        no-spinner
        class="full-width full-height"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  avatarUrl: {
    type: String,
    default: null,
  },
  previewUrl: {
    type: String,
    default: null,
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value),
  },
})

const sizeMap = {
  xs: '32px',
  sm: '48px',
  md: '96px',
  lg: '128px',
  xl: '160px',
}

const processedAvatarUrl = computed(() => {
  if (props.previewUrl) return props.previewUrl

  const avatar = props.avatarUrl

  if (!avatar) return '/src/assets/avatar/default-avatar.png'

  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar

  if (avatar.includes('avatar-')) return `http://localhost:3000/avatars/${avatar}`

  return `/src/assets/avatar/${avatar}`
})
</script>
