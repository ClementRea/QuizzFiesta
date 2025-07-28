<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card class="leaderboard-card" style="min-width: 400px; max-width: 600px;">
      <!-- En-tête -->
      <q-card-section class="bg-gradient-primary text-center q-pa-xl">
        <q-icon name="leaderboard" size="3rem" color="secondary" class="q-mb-md" />
        <h2 class="text-h5 text-secondary text-weight-bold q-mb-sm">
          🏆 Classement Final
        </h2>
        <div class="text-body1 text-grey-7">
          {{ participants.length }} participant{{ participants.length > 1 ? 's' : '' }}
        </div>
      </q-card-section>

      <!-- Liste des participants -->
      <q-card-section class="q-pa-none">
        <q-list separator>
          <q-item
            v-for="(participant, index) in sortedParticipants"
            :key="participant.userId"
            class="participant-item q-pa-lg"
            :class="{
              'bg-yellow-1': index === 0,
              'bg-grey-2': index === 1,
              'bg-orange-1': index === 2,
              'bg-blue-1': participant.userId === currentUserId
            }"
          >
            <q-item-section avatar>
              <!-- Podium pour les 3 premiers -->
              <q-avatar
                v-if="index < 3"
                :color="getPodiumColor(index)"
                text-color="white"
                size="lg"
                :icon="getPodiumIcon(index)"
              />
              <q-avatar
                v-else
                color="grey-5"
                text-color="white"
                size="lg"
              >
                {{ index + 1 }}
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-h6 text-weight-bold">
                {{ participant.userName }}
                <q-chip 
                  v-if="participant.userId === currentUserId"
                  dense
                  color="primary"
                  text-color="white"
                  class="q-ml-sm"
                >
                  Vous
                </q-chip>
              </q-item-label>
              <q-item-label caption>
                {{ participant.totalScore }} points
                <span v-if="participant.answeredQuestions !== undefined">
                  • {{ participant.answeredQuestions }}/{{ totalQuestions }} réponses
                </span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="text-h6 text-weight-bold text-primary">
                #{{ index + 1 }}
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="center" class="q-pa-lg">
        <q-btn
          label="Rejouer"
          color="secondary"
          text-color="primary"
          rounded
          unelevated
          @click="$emit('play-again')"
          class="q-px-xl"
        />
        <q-btn
          label="Retour à l'accueil"
          color="primary"
          text-color="secondary"
          rounded
          outline
          @click="$emit('go-home')"
          class="q-px-xl"
        />
      </q-card-actions>

      <!-- Bouton de fermeture -->
      <q-btn
        icon="close"
        flat
        round
        dense
        v-close-popup
        class="absolute-top-right q-ma-md"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  participants: {
    type: Array,
    default: () => []
  },
  currentUserId: {
    type: String,
    default: ''
  },
  totalQuestions: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'play-again', 'go-home'])

// État local
const showDialog = ref(props.modelValue)

// Computed properties
const sortedParticipants = computed(() => {
  return [...props.participants].sort((a, b) => {
    // Trier par score décroissant, puis par nombre de réponses
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore
    }
    // En cas d'égalité, celui qui a répondu à plus de questions est mieux classé
    const aAnswers = a.answeredQuestions || 0
    const bAnswers = b.answeredQuestions || 0
    return bAnswers - aAnswers
  })
})

// Méthodes
const getPodiumColor = (index) => {
  const colors = ['amber', 'grey-5', 'orange']
  return colors[index] || 'grey-5'
}

const getPodiumIcon = (index) => {
  const icons = ['emoji_events', 'military_tech', 'workspace_premium']
  return icons[index] || 'person'
}

// Watchers
watch(() => props.modelValue, (newVal) => {
  showDialog.value = newVal
})

watch(showDialog, (newVal) => {
  emit('update:modelValue', newVal)
})
</script>

<style scoped>
.leaderboard-card {
  max-height: 80vh;
  overflow-y: auto;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #f5f2e8 0%, #ece8d2 100%);
}

.participant-item {
  transition: all 0.3s ease;
}

.participant-item:hover {
  transform: translateX(4px);
}

/* Styles pour les positions du podium */
.participant-item.bg-yellow-1 {
  border-left: 4px solid #f9a825;
}

.participant-item.bg-grey-2 {
  border-left: 4px solid #757575;
}

.participant-item.bg-orange-1 {
  border-left: 4px solid #fb8c00;
}

.participant-item.bg-blue-1 {
  border-left: 4px solid var(--q-primary);
  font-weight: bold;
}

/* Responsive */
@media (max-width: 600px) {
  .leaderboard-card {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
  
  .participant-item {
    padding: 1rem;
  }
  
  .q-card-actions {
    flex-direction: column;
  }
  
  .q-card-actions .q-btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>