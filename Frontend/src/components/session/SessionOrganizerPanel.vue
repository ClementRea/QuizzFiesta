<template>
  <q-drawer v-model="modelValue" side="right" overlay class="bg-white" :width="350">
    <div class="q-pa-md">
      <div class="text-h6 q-mb-md flex items-center">
        <q-icon name="settings" class="q-mr-sm" />
        <span>Contrôles organisateur</span>
        <q-icon
          name="close"
          color="negative"
          size="26px"
          rounded
          class="q-ml-auto cursor-pointer"
          @click="$emit('update:modelValue', false)"
        />
      </div>

      <div class="q-mb-lg">
        <div class="text-subtitle1 q-mb-sm text-weight-medium">Classement</div>
        <q-list dense>
          <q-item v-for="(participant, index) in leaderboard" :key="participant.userId">
            <q-item-section avatar>
              <q-badge :color="index < 3 ? 'amber' : 'grey'" :label="index + 1" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ participant.userName }}</q-item-label>
              <q-item-label caption>{{ participant.totalScore }} pts</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <q-btn
        v-if="session?.status === 'playing' && !isLastQuestion"
        color="secondary"
        icon="skip_next"
        label="Question suivante"
        @click="nextQuestion"
        :loading="loadingNext"
        class="full-width q-mb-md"
      />

      <q-btn
        v-if="session?.status === 'playing'"
        color="negative"
        icon="stop"
        label="Terminer la session"
        @click="endSession"
        :loading="ending"
        outline
        class="full-width q-mb-md"
      />
    </div>
  </q-drawer>
</template>

<script setup>
import { toRefs } from 'vue'
const props = defineProps({
  modelValue: Boolean,
  session: Object,
  isLastQuestion: Boolean,
  leaderboard: Array,
  loadingNext: Boolean,
  ending: Boolean,
})
const emit = defineEmits(['update:modelValue', 'nextQuestion', 'endSession'])

const { modelValue, session, isLastQuestion, leaderboard, loadingNext, ending } = toRefs(props)

function nextQuestion() {
  emit('nextQuestion')
}
function endSession() {
  emit('endSession')
}
</script>
