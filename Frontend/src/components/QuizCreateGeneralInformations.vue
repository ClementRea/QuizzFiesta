<template>
  <div class="general-info-step">
    <div class="row items-center q-mb-lg">
      <q-icon name="info" size="28px" class="text-secondary q-mr-sm" />
      <h2 class="text-h5 text-weight-medium q-ma-none text-grey-8">Informations générales</h2>
    </div>

    <!-- Enhanced Logo Upload Section -->
    <q-card class="logo-upload-section q-mb-lg" flat bordered>
      <q-card-section class="q-pa-md">
        <div class="text-subtitle2 text-grey-7 q-mb-md flex items-center">
          <q-icon name="image" class="q-mr-xs" />
          Logo du quiz (optionnel)
        </div>

        <div v-if="logoPreviewUrl" class="flex flex-start q-mb-md">
          <div class="logo-preview-enhanced relative-position">
            <q-img
              :src="logoPreviewUrl"
              class="rounded-borders shadow-2"
              style="height: 120px; width: 120px"
              fit="cover"
            >
              <div
                class="absolute-full bg-black logo-overlay"
                style="opacity: 0; transition: opacity 0.3s"
                @mouseenter="$event.target.style.opacity = '0.5'"
                @mouseleave="$event.target.style.opacity = '0'"
              >
                <div class="absolute-center">
                  <q-btn
                    round
                    icon="close"
                    color="red"
                    size="sm"
                    @click="removeLogo"
                    class="shadow-3 delete-logo-btn"
                    :aria-label="'Supprimer le logo'"
                  />
                </div>
              </div>
            </q-img>
          </div>
        </div>

        <div class="flex flex-start">
          <q-btn
            outline
            :unelevated="logoFile"
            icon="add_photo_alternate"
            :label="logoFile ? 'Changer le logo' : 'Choisir un logo'"
            @click="uploadFilesDialog = true"
            class="q-px-lg"
            :aria-label="logoFile ? 'Changer le logo du quiz' : 'Choisir un logo pour le quiz'"
          />
        </div>
      </q-card-section>
    </q-card>

    <UploadFiles v-model="uploadFilesDialog" title="Logo du quiz" @selected="onLogoSelected" />

    <!-- Enhanced Form Fields -->
    <div class="form-fields-section">
      <q-input
        v-model="title"
        label="Titre du quiz"
        outlined
        bg-color="white"
        color="secondary"
        class="q-mb-lg enhanced-input"
        :error="!quizData.title && showValidation"
        error-message="Le titre est obligatoire"
        aria-label="Titre du quiz"
        aria-required="true"
        counter
        maxlength="100"
        hint="Donnez un titre accrocheur à votre quiz"
        tabindex="0"
      />

      <q-input
        v-model="description"
        label="Description"
        type="textarea"
        rows="4"
        outlined
        bg-color="white"
        color="secondary"
        class="q-mb-lg enhanced-input"
        :error="!quizData.description && showValidation"
        error-message="La description est obligatoire"
        aria-label="Description du quiz"
        aria-required="true"
        counter
        maxlength="500"
        hint="Décrivez le contenu et l'objectif de votre quiz"
        tabindex="0"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import UploadFiles from 'src/components/UploadFiles.vue'

const props = defineProps({
  quizData: {
    type: Object,
    required: true,
  },
  showValidation: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:quizData', 'logoSelected', 'logoRemoved'])

const uploadFilesDialog = ref(false)
const logoFile = ref(null)
const logoPreviewUrl = ref(null)

const onLogoSelected = (file) => {
  logoFile.value = file

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreviewUrl.value = e.target.result
    }
    reader.readAsDataURL(file)
  }

  emit('logoSelected', file)
}

const removeLogo = () => {
  logoFile.value = null
  logoPreviewUrl.value = null
  emit('logoRemoved')
}

// Computed properties avec getter/setter pour éviter la mutation directe des props
const title = computed({
  get: () => props.quizData.title,
  set: (value) => {
    emit('update:quizData', { ...props.quizData, title: value })
  },
})

const description = computed({
  get: () => props.quizData.description,
  set: (value) => {
    emit('update:quizData', { ...props.quizData, description: value })
  },
})
</script>

<style lang="scss" scoped>
.general-info-step {
  .logo-upload-section {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.9);
    }
  }

  .logo-preview-enhanced {
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }

    .delete-logo-btn {
      opacity: 1 !important;
    }
  }
}

.enhanced-input {
  .q-field__control {
    border-radius: 12px;
  }

  .q-field__marginal {
    color: var(--q-primary);
  }
}
</style>
