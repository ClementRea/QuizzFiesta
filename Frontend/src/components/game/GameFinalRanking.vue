<template>
  <div class="q-mb-lg">
    <div class="text-h5 text-secondary text-weight-bold q-mb-md">🏆 Classement final</div>
    <q-list class="flex column">
      <q-item
        v-for="(participant, index) in leaderboard"
        :key="participant.userId"
        class="q-pa-md"
        :class="index < 3 ? 'bg-amber-1' : ''"
      >
        <q-item-section avatar>
          <div class="row items-center no-wrap">
            <q-avatar
              :color="
                index === 0 ? 'amber' : index === 1 ? 'grey-5' : index === 2 ? 'orange' : 'grey-3'
              "
              text-color="white"
              size="lg"
            >
              <div class="text-h6 text-weight-bold">{{ index + 1 }}</div>
            </q-avatar>
            <div class="flex column">
              <span class="q-ml-md text-h6 text-weight-medium">{{ participant.userName }}</span>
              <span class="text-secondary">{{ participant.correctAnswers }} bonnes réponses</span>
            </div>
          </div>
        </q-item-section>
        <q-item-section class="text-right">
          <div class="text-h5 text-weight-bold text-secondary">
            {{ participant.totalScore }}
          </div>
          <div class="text-caption text-secondary text-weight-medium">points</div>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  leaderboard: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped></style>
