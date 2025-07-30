<template>
  <q-dialog v-model="isOpen">
    <q-card class="bg-primary">
      <q-card-section class="row justify-between items-center">
        <span class="text-secondary text-bold text-body1">{{
          title || 'Nouvelle photo de profil'
        }}</span>
        <q-btn class="text-secondary" dense flat icon="close" v-close-popup>
          <q-tooltip v-if="!$q.platform.is.mobile">Fermer</q-tooltip>
        </q-btn>
      </q-card-section>
      <q-card-section>
        <div v-if="imagePreview" class="q-mt-md column items-center">
          <q-img :src="imagePreview" class="profile-image-preview q-mb-sm" fit="cover" />
        </div>
        <q-file
          color="secondary"
          outlined
          label-color="secondary"
          v-model="file"
          label="Sélectionner une image"
          accept=".jpg, .jpeg, .png"
          @update:model-value="onFileSelected"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" color="secondary" />
          </template>
        </q-file>
      </q-card-section>

      <q-card-actions align="center" class="bg-primary q-pa-md">
        <q-btn
          rounded
          color="secondary"
          text-color="primary"
          class="q-pa-sm q-ml-sm"
          style="width: 35%"
          label="Confirmer"
          :disable="!file"
          @click="confirmSelection"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'selected'])

const file = ref(null)
const imagePreview = ref(null)
const isOpen = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal
  },
)

watch(
  () => isOpen.value,
  (newVal) => {
    emit('update:modelValue', newVal)
    if (!newVal) {
      resetPreview()
    }
  },
)

const onFileSelected = () => {
  if (!file.value) {
    imagePreview.value = null
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file.value)
}

const confirmSelection = () => {
  if (file.value) {
    emit('selected', file.value)
    isOpen.value = false
  }
}

const resetPreview = () => {
  file.value = null
  imagePreview.value = null
}

defineExpose({
  resetPreview,
})
</script>

<style scoped>
.profile-image-preview {
  width: 150px;
  height: 150px;
  border-radius: 16%;
  border: 2px solid var(--q-dark80);
}
</style>
