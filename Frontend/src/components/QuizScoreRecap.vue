<template>
  <div class="quiz-score-recap bg-white rounded-borders q-pa-xl shadow-8">
    <!-- En-tête -->
    <div class="recap-header text-center q-mb-xl">
      <q-icon name="emoji_events" size="4rem" color="amber" class="q-mb-md" />
      <h2 class="text-h4 text-secondary text-weight-bold q-mb-md">
        Quiz terminé !
      </h2>
      <div class="text-h5 text-weight-bold q-mb-lg">
        Score final : {{ finalScore }} points
      </div>
    </div>

    <!-- Statistiques personnelles -->
    <div class="personal-stats q-mb-xl">
      <h3 class="text-h6 text-secondary text-weight-bold q-mb-md">
        <q-icon name="person" class="q-mr-sm" />
        Vos statistiques
      </h3>
      
      <div class="row q-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="text-center q-pa-md">
            <q-icon name="quiz" size="2rem" color="primary" class="q-mb-sm" />
            <div class="text-h6 text-weight-bold">{{ totalQuestions }}</div>
            <div class="text-caption text-grey-6">Questions</div>
          </q-card>
        </div>
        
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="text-center q-pa-md">
            <q-icon name="check_circle" size="2rem" color="positive" class="q-mb-sm" />
            <div class="text-h6 text-weight-bold">{{ correctAnswers }}</div>
            <div class="text-caption text-grey-6">Bonnes réponses</div>
          </q-card>
        </div>
        
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="text-center q-pa-md">
            <q-icon name="cancel" size="2rem" color="negative" class="q-mb-sm" />
            <div class="text-h6 text-weight-bold">{{ wrongAnswers }}</div>
            <div class="text-caption text-grey-6">Mauvaises réponses</div>
          </q-card>
        </div>
        
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="text-center q-pa-md">
            <q-icon name="percent" size="2rem" color="info" class="q-mb-sm" />
            <div class="text-h6 text-weight-bold">{{ successRate }}%</div>
            <div class="text-caption text-grey-6">Taux de réussite</div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Détail des réponses -->
    <div v-if="showDetailedResults" class="detailed-results q-mb-xl">
      <h3 class="text-h6 text-secondary text-weight-bold q-mb-md">
        <q-icon name="list" class="q-mr-sm" />
        Détail des réponses
      </h3>
      
      <div class="q-gutter-md">
        <div 
          v-for="(question, index) in questionsResults" 
          :key="index"
          class="question-result"
        >
          <q-card flat bordered class="q-pa-md">
            <div class="row items-start q-gutter-md">
              <!-- Numéro et statut -->
              <div class="col-auto">
                <q-avatar 
                  :color="question.isCorrect ? 'positive' : 'negative'" 
                  text-color="white" 
                  :icon="question.isCorrect ? 'check' : 'close'"
                  size="md"
                />
              </div>
              
              <!-- Contenu de la question -->
              <div class="col">
                <div class="text-body1 text-weight-medium q-mb-sm">
                  Question {{ index + 1 }}: {{ question.title }}
                </div>
                
                <div class="row items-center q-gutter-md">
                  <div class="col-auto">
                    <q-chip 
                      :color="question.isCorrect ? 'positive' : 'negative'"
                      text-color="white"
                      dense
                    >
                      {{ question.isCorrect ? '+' : '0' }}{{ question.points }} pts
                    </q-chip>
                  </div>
                  
                  <div class="col">
                    <div class="text-body2 text-grey-7">
                      Votre réponse: {{ formatAnswer(question.userAnswer, question.type) }}
                    </div>
                    <div v-if="!question.isCorrect" class="text-body2 text-positive">
                      Bonne réponse: {{ formatAnswer(question.correctAnswer, question.type) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="recap-actions text-center q-gutter-md">
      <q-btn
        v-if="!showDetailedResults"
        label="Voir le détail"
        color="secondary"
        text-color="primary"
        rounded
        unelevated
        @click="showDetailedResults = true"
        class="q-px-xl"
      />
      
      <q-btn
        label="Voir le classement"
        color="primary"
        text-color="secondary"
        rounded
        unelevated
        @click="$emit('show-leaderboard')"
        class="q-px-xl"
      />
      
      <q-btn
        label="Retour à l'accueil"
        color="accent"
        text-color="secondary"
        rounded
        outline
        @click="$emit('go-home')"
        class="q-px-xl"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  finalScore: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  questionsResults: {
    type: Array,
    default: () => []
  },
  currentRank: {
    type: Number,
    default: 1
  },
  totalParticipants: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['show-leaderboard', 'go-home'])

// État local
const showDetailedResults = ref(false)

// Computed properties
const correctAnswers = computed(() => {
  return props.questionsResults.filter(q => q.isCorrect).length
})

const wrongAnswers = computed(() => {
  return props.questionsResults.filter(q => !q.isCorrect).length
})

const successRate = computed(() => {
  if (props.totalQuestions === 0) return 0
  return Math.round((correctAnswers.value / props.totalQuestions) * 100)
})

// Méthodes
const formatAnswer = (answer, questionType) => {
  if (answer === null || answer === undefined) {
    return 'Pas de réponse'
  }
  
  switch (questionType) {
    case 'multiple_choice':
      if (Array.isArray(answer)) {
        return answer.map(a => `Réponse ${String.fromCharCode(65 + a)}`).join(', ')
      }
      return `Réponse ${String.fromCharCode(65 + answer)}`
    
    case 'true_false':
      return answer ? 'Vrai' : 'Faux'
    
    case 'order':
      if (Array.isArray(answer)) {
        return answer.join(' → ')
      }
      return answer.toString()
    
    case 'text':
      return answer.toString()
    
    default:
      return answer.toString()
  }
}
</script>

<style scoped>
.quiz-score-recap {
  max-width: 100%;
}

.recap-header {
  background: linear-gradient(135deg, #f5f2e8 0%, #ece8d2 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin: -1rem;
  margin-bottom: 2rem;
}

.personal-stats .q-card {
  transition: all 0.3s ease;
}

.personal-stats .q-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.question-result .q-card {
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.question-result .q-card:hover {
  border-left-color: var(--q-primary);
  transform: translateX(4px);
}

.recap-actions .q-btn {
  min-width: 160px;
}

/* Responsive */
@media (max-width: 600px) {
  .recap-header {
    padding: 1rem;
  }
  
  .recap-actions {
    flex-direction: column;
  }
  
  .recap-actions .q-btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>