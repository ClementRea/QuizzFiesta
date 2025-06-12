<template>
  <div class="full-width">
    <FormLayout
      title="Créer une organisation"
      :show-actions="true"
      :actionButtons="actionButtons"
      :disabledSubmit="!isFormValid"
      @action="handleAction"
    >
      <template v-slot:content>
        <div
          class="q-pa-xl bg-light20 rounded-borders q-mt-lg items-center justify-center column"
          style="max-width: 500px; margin: auto"
        >
          <div class="q-mb-md cursor-pointer" @click="EditAvatarDialog = true">
            <OrganisationAvatar :logoUrl="form.logoUrl" :previewUrl="logoPreviewUrl" />
          </div>

          <q-btn
            no-caps
            unelevated
            label="Ajouter un logo"
            color="dark80"
            outline
            rounded
            class="q-mb-md"
            @click="uploadFilesDialog = true"
          />

          <UploadFiles
            v-model="uploadFilesDialog"
            title="Logo de l'organisation"
            v-if="uploadFilesDialog"
            @selected="onLogoSelected"
          />

          <div>
            <q-input v-model="form.name" label="Nom de l'organisation *" outlined class="q-mb-md" />
            <q-input
              v-model="form.description"
              label="Description"
              type="textarea"
              rows="3"
              outlined
              class="q-mb-md"
            />
          </div>
        </div>
      </template>
    </FormLayout>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import FormLayout from 'src/layouts/FormLayout.vue'
import UploadFiles from 'src/components/UploadFiles.vue'
import OrganisationAvatar from 'src/components/GetOrganisationAvatar.vue'

const router = useRouter()
const $q = useQuasar()

const form = ref({
  name: '',
  description: '',
  logoUrl: '',
})
const showValidation = ref(false)
const uploadFilesDialog = ref(false)
const logoPreviewUrl = ref(null)

const isFormValid = computed(() => form.value.name.trim() !== '')

const actionButtons = [
  {
    action: 'cancel',
    label: 'Annuler',
    color: 'white',
    class: 'text-dark80 q-pa-sm col-5',
    ariaLabel: "Annuler la création de l'organisation",
    title: 'Revenir sans sauvegarder',
  },
  {
    action: 'save',
    label: "Créer l'organisation",
    color: 'dark80',
    class: 'text-light20 q-pa-sm col-5',
    ariaLabel: "Créer l'organisation",
    title: "Finaliser la création de l'organisation",
    disabled: !isFormValid.value,
    disabledTooltip: "Le nom de l'organisation est obligatoire",
  },
]

const handleAction = async (action) => {
  if (action === 'cancel') {
    router.push('/accueil')
    return
  }
  if (action === 'save' && isFormValid.value) {
    try {
      const payload = {
        name: form.value.name,
        description: form.value.description,
        logoUrl: form.value.logoUrl || undefined,
      }
      await axios.post('http://localhost:3000/api/organisation', payload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      })
      $q.notify({ type: 'positive', message: 'Organisation créée avec succès !', position: 'top' })
      router.push('/accueil')
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Erreur lors de la création', position: 'top' })
      console.error(error)
    }
  } else {
    showValidation.value = true
  }
}
</script>
