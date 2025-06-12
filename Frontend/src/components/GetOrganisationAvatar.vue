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
        :src="processedLogoUrl"
        :ratio="1"
        fit="cover"
        no-spinner
        class="full-width full-height cursor-pointer"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  logoUrl: {
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

const processedLogoUrl = computed(() => {
  if (props.previewUrl) return props.previewUrl

  const logo = props.logoUrl

  if (!logo) return '/src/assets/avatar/logoOrganisation.png'

  return logo.startsWith('http') ? logo : `/api/v1/files/${logo}`
})
</script>
