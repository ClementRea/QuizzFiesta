<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 400px; max-width: 600px">
      <q-card-section class="bg-secondary text-primary">
        <div class="text-h6 flex items-center">
          <q-icon name="mdi-gamepad-variant" class="q-mr-sm" />
          Créer une session de jeu
        </div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <!-- Info du quiz -->
        <div class="q-mb-lg">
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Quiz sélectionné :</div>
          <q-chip color="grey-2" text-color="secondary" size="lg" class="full-width">
            <q-icon name="quiz" class="q-mr-sm" />
            {{ quiz?.title }}
          </q-chip>
        </div>

        <!-- Configuration de la session -->
        <div class="q-mb-lg">
          <div class="text-subtitle1 text-weight-medium q-mb-md">Configuration de la session</div>

          <!-- Nombre max de participants -->
          <q-input
            v-model.number="settings.maxParticipants"
            type="number"
            label="Nombre maximum de participants"
            outlined
            class="q-mb-md"
            :min="1"
            :max="100"
            hint="Entre 1 et 100 participants"
          >
            <template v-slot:prepend>
              <q-icon name="mdi-account-multiple" />
            </template>
          </q-input>

          <!-- Temps par question -->
          <q-input
            v-model.number="settings.timePerQuestion"
            type="number"
            label="Temps par question (secondes)"
            outlined
            class="q-mb-md"
            :min="5"
            :max="300"
            hint="Entre 5 et 300 secondes"
          >
            <template v-slot:prepend>
              <q-icon name="mdi-timer" />
            </template>
          </q-input>

          <!-- Options avancées -->
          <q-expansion-item icon="mdi-cog" label="Options avancées" class="q-mb-md">
            <div class="q-pa-md bg-grey-1 rounded-borders">
              <!-- Afficher les bonnes réponses -->
              <q-toggle
                v-model="settings.showCorrectAnswers"
                label="Afficher les bonnes réponses après chaque question"
                color="secondary"
                class="q-mb-md"
              />

              <!-- Permettre l'entrée en cours de partie -->
              <q-toggle
                v-model="settings.allowLateJoin"
                label="Permettre de rejoindre en cours de partie"
                color="secondary"
              />
            </div>
          </q-expansion-item>
        </div>

        <!-- Récapitulatif -->
        <div class="bg-grey-1 rounded-borders q-pa-md">
          <div class="text-subtitle2 text-weight-medium q-mb-sm">Récapitulatif :</div>
          <div class="text-body2 text-grey-7">
            • {{ quiz?.questions?.length || 0 }} questions<br />
            • {{ settings.maxParticipants }} participants maximum<br />
            • {{ settings.timePerQuestion }}s par question<br />
            • Réponses {{ settings.showCorrectAnswers ? 'affichées' : 'cachées' }}<br />
            • Entrée tardive {{ settings.allowLateJoin ? 'autorisée' : 'interdite' }}
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-lg">
        <q-btn flat label="Annuler" color="grey-6" @click="cancel" />
        <q-btn
          label="Créer la session"
          color="secondary"
          icon="mdi-plus"
          @click="createSession"
          :loading="creating"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  quiz: {
    type: Object,
    required: true,
  },
})

// Emits
const emit = defineEmits(['update:modelValue', 'session-created'])

// State
const showDialog = ref(props.modelValue)
const creating = ref(false)

// Configuration par défaut
const settings = ref({
  maxParticipants: 20,
  timePerQuestion: 30,
  showCorrectAnswers: true,
  allowLateJoin: false,
})

// Watch pour la prop modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    showDialog.value = newVal
  },
)

watch(showDialog, (newVal) => {
  emit('update:modelValue', newVal)
})

// Methods
const createSession = async () => {
  try {
    creating.value = true

    // Ici vous pouvez appeler l'API pour créer la session
    emit('session-created', {
      quizId: props.quiz._id,
      settings: settings.value,
    })

    showDialog.value = false
  } catch (error) {
    console.error('Erreur création session:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la création de la session',
    })
  } finally {
    creating.value = false
  }
}

const cancel = () => {
  showDialog.value = false
}
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
