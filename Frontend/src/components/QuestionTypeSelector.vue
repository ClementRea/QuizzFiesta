<template>
  <div class="question-type-selector" role="form" aria-label="Configuration de la question">
    <!-- Question type selector -->
    <q-select
      v-model="localQuestion.type"
      :options="questionTypeOptions"
      option-value="value"
      option-label="label"
      emit-value
      map-options
      label="Type de question"
      outlined
      class="custom-border q-mb-md"
      @update:model-value="onTypeChange"
      aria-label="Choisir le type de question"
      aria-describedby="question-type-help"
    />

    <!-- Question content -->
    <q-input
      v-model="localQuestion.content"
      label="Texte de la question *"
      outlined
      class="custom-border q-mb-md"
      aria-label="Texte de la question"
      aria-required="true"
    />

    <div
      class="answers-section"
      role="group"
      :aria-label="`Configuration des réponses pour ${getQuestionTypeLabel(localQuestion.type)}`"
    >
      <!-- CLASSIC -->
      <div
        v-if="localQuestion.type === 'CLASSIC'"
        class="classic-answers"
        role="group"
        aria-label="Réponse unique"
      >
        <div class="text-subtitle2 text-dark90 text-bold" id="classic-help">
          Saisissez la réponse de la question
        </div>

        <q-input
          v-model="localQuestion.answer[0].text"
          label="Réponse *"
          outlined
          class="custom-border"
          aria-label="Réponse à la question"
          aria-required="true"
          aria-describedby="classic-help"
        />
      </div>

      <!-- MULTIPLE_CHOICE -->
      <div
        v-if="localQuestion.type === 'MULTIPLE_CHOICE'"
        class="multiple-choice-answers"
        role="group"
        aria-label="Choix multiples"
      >
        <div class="row items-center justify-between">
          <h6 class="text-dark80 q-ma-none">Choix de réponses</h6>
        </div>
        <div class="text-subtitle2 text-dark90 text-bold q-mb-lg" id="multiple-choice-help">
          Cochez la ou les bonnes réponses. Au moins une réponse doit être correcte.
        </div>

        <div
          v-for="(answer, index) in localQuestion.answer"
          :key="index"
          class="row items-center q-mb-sm"
          role="group"
          :aria-label="`Choix ${index + 1}`"
        >
          <q-checkbox
            v-model="answer.isCorrect"
            class="q-mr-sm"
            color="dark80"
            :label="`Correct`"
            :aria-label="`Marquer le choix ${index + 1} comme correct`"
            tabindex="0"
          />
          <q-input
            v-model="answer.text"
            :label="`Choix ${index + 1} *`"
            outlined
            class="custom-border col"
            :aria-label="`Texte du choix ${index + 1}`"
            aria-required="true"
            aria-describedby="multiple-choice-help"
          />
          <q-btn
            v-if="localQuestion.answer.length > 2"
            flat
            dense
            round
            icon="delete"
            color="negative"
            @click="removeAnswer(index)"
            class="q-ml-sm"
            :title="`Supprimer le choix ${index + 1}`"
            :aria-label="`Supprimer le choix ${index + 1}`"
            tabindex="0"
          />
        </div>
        <div class="row justify-center q-mt-lg">
          <q-btn
            icon="add"
            class="bg-normal40 text-bold"
            rounded
            text-color="dark80"
            label="Ajouter un choix"
            @click="addAnswer"
            size="sm"
            :disable="localQuestion.answer.length >= 6"
            tabindex="0"
            aria-label="Ajouter un nouveau choix de réponse"
            :aria-describedby="localQuestion.answer.length >= 6 ? 'max-choices-reached' : null"
          />
          <div v-if="localQuestion.answer.length >= 6" id="max-choices-reached" class="sr-only">
            Nombre maximum de choix atteint (6)
          </div>
        </div>
      </div>

      <!-- ORDER -->
      <div v-if="localQuestion.type === 'ORDER'" class="order-answers">
        <div class="row items-center justify-between q-mb-sm">
          <h6 class="text-dark80 q-ma-none">Éléments à ordonner</h6>
        </div>
        <div class="text-subtitle2 text-dark90 text-bold q-mb-lg">
          Saisissez les éléments dans le bon ordre (du 1er au dernier). Les joueurs devront les
          remettre dans le bon ordre.
        </div>

        <div
          v-for="(answer, index) in localQuestion.answer"
          :key="index"
          class="row items-center q-mb-sm"
        >
          <div
            class="flex flex-center bg-dark80 text-white rounded-borders q-mr-sm"
            style="min-width: 32px; height: 32px; font-size: 14px; font-weight: bold"
          >
            {{ index + 1 }}
          </div>
          <q-input
            v-model="answer.text"
            :label="`Position ${index + 1} *`"
            outlined
            class="custom-border col"
          />
          <q-btn
            v-if="localQuestion.answer.length > 2"
            flat
            dense
            round
            icon="delete"
            color="negative"
            @click="removeAnswer(index)"
            class="q-ml-sm"
            :title="`Supprimer l'élément ${index + 1}`"
          />
        </div>
        <div class="row justify-center q-mt-lg">
          <q-btn
            class="bg-normal40 text-bold"
            rounded
            text-color="dark80"
            icon="add"
            label="Ajouter élément"
            @click="addAnswer"
            size="sm"
            :disable="localQuestion.answer.length >= 8"
          />
        </div>
      </div>

      <!-- ASSOCIATION -->
      <div v-if="localQuestion.type === 'ASSOCIATION'" class="association-answers">
        <div class="row items-center justify-between q-mb-sm">
          <h6 class="text-dark80 q-ma-none">Paires à associer</h6>
        </div>
        <div class="text-subtitle2 text-dark90 text-bold q-mb-lg">
          Créez des paires d'éléments que les joueurs devront associer correctement.
        </div>

        <div
          v-for="(pair, index) in associationPairs"
          :key="index"
          class="q-mb-md q-pa-md bg-light10 rounded-borders q-gutter-sm"
        >
          <div class="row items-center q-mb-sm">
            <span class="text-weight-medium">Paire {{ index + 1 }}</span>
            <q-space />
            <q-btn
              v-if="associationPairs.length > 2"
              flat
              dense
              round
              icon="delete"
              color="negative"
              @click="removeAssociationPair(index)"
              size="sm"
              :title="`Supprimer la paire ${index + 1}`"
            />
          </div>
          <div class="row q-col-gutter-sm items-center">
            <div class="col-5">
              <q-input v-model="pair.left" :label="`Élément A *`" outlined class="custom-border" />
            </div>
            <div class="col-2 flex flex-center">
              <q-icon name="link" size="24px" color="dark80" />
            </div>
            <div class="col-5">
              <q-input v-model="pair.right" :label="`Élément B *`" outlined class="custom-border" />
            </div>
          </div>
        </div>
        <div class="row justify-center q-mt-lg">
          <q-btn
            class="bg-normal40 text-bold"
            rounded
            text-color="dark80"
            icon="add"
            label="Ajouter paire"
            @click="addAssociationPair"
            size="sm"
            :disable="associationPairs.length >= 6"
          />
        </div>
      </div>

      <!-- BLIND_TEST -->
      <div v-if="localQuestion.type === 'BLIND_TEST'" class="blind-test-answers">
        <h6 class="text-dark80 q-mb-sm">Configuration du blind test</h6>
        <div class="text-subtitle2 text-dark90 text-bold q-mb-lg">
          Importer ici un audio ou une image, les joueurs devront deviner ce qu'ils entendent /
          écoutent.
        </div>

        <q-input
          v-model="localQuestion.answer[0].text"
          label="Réponse *"
          outlined
          class="custom-border q-mb-md"
          hint="Ex: 'Beethoven - 9ème Symphonie' ou 'Kangourou'"
        />

        <div
          class="q-pa-md bg-grey-1 rounded-borders flex flex-center column items-center q-mt-md"
          style="border: 2px dashed var(--q-color-grey-4); min-height: 120px"
        >
          <q-icon name="cloud_upload" size="48px" class="text-grey-5 q-mb-sm" />
          <p class="text-grey-6 q-ma-none">Upload de fichiers média (à implémenter)</p>
          <p class="text-caption text-grey-5">Formats supportés: MP3, WAV, JPG, PNG</p>
        </div>
      </div>

      <!-- FIND_INTRUDER -->
      <div v-if="localQuestion.type === 'FIND_INTRUDER'" class="find-intruder-answers">
        <div class="row items-center justify-between q-mb-sm">
          <h6 class="text-dark80 q-ma-none">Éléments proposés</h6>
          <q-btn
            flat
            dense
            icon="add"
            label="Ajouter élément"
            @click="addAnswer"
            size="sm"
            :disable="localQuestion.answer.length >= 6"
          />
        </div>
        <div class="text-subtitle2 text-dark90 text-bold q-mb-lg">
          Créez une liste avec un seul l'intrus. Les joueurs devront L'identifier.
        </div>

        <div
          v-for="(answer, index) in localQuestion.answer"
          :key="index"
          class="row items-center q-mb-sm"
        >
          <q-radio
            v-model="intruderIndex"
            :val="index"
            class="q-mr-sm"
            color="negative"
            @update:model-value="updateIntruder"
            :label="'Intrus'"
          />
          <q-input
            v-model="answer.text"
            :label="`Élément ${index + 1} *`"
            outlined
            class="custom-border col"
            :style="{
              '--q-color-negative': answer.isCorrect ? 'var(--q-color-negative)' : 'initial',
              border: answer.isCorrect ? '1px solid var(--q-color-negative)' : 'initial',
            }"
          />
          <q-btn
            v-if="localQuestion.answer.length > 3"
            flat
            dense
            round
            icon="delete"
            color="negative"
            @click="removeAnswer(index)"
            class="q-ml-sm"
            :title="`Supprimer l'élément ${index + 1}`"
          />
        </div>

        <div
          v-if="!localQuestion.answer.some((a) => a.isCorrect)"
          class="text-negative text-caption"
        >
          ⚠️ Vous devez sélectionner quel élément est l'intrus
        </div>
      </div>
      <!-- Points and time configuration -->
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-6">
          <q-input
            v-model.number="localQuestion.points"
            label="Points"
            type="number"
            outlined
            class="custom-border"
            min="1"
          />
        </div>
        <div class="col-6">
          <q-input
            v-model.number="localQuestion.timeGiven"
            label="Temps (secondes)"
            type="number"
            outlined
            class="custom-border"
            min="5"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, watchEffect } from 'vue'

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  showValidation: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:question'])

// Méthode utilitaire pour l'accessibilité
const getQuestionTypeLabel = (type) => {
  const typeMap = {
    CLASSIC: 'Question classique',
    MULTIPLE_CHOICE: 'Choix multiple',
    ORDER: 'Mise en ordre',
    ASSOCIATION: 'Association',
    BLIND_TEST: 'Blind test',
    FIND_INTRUDER: "Trouver l'intrus",
  }
  return typeMap[type] || type
}

// Available question types
const questionTypeOptions = [
  { label: 'Question classique', value: 'CLASSIC' },
  { label: 'Choix multiple', value: 'MULTIPLE_CHOICE' },
  { label: 'Mise en ordre', value: 'ORDER' },
  { label: 'Association', value: 'ASSOCIATION' },
  { label: 'Blind test', value: 'BLIND_TEST' },
  { label: "Trouver l'intrus", value: 'FIND_INTRUDER' },
]

// Local question
const defaultQuestion = () => ({
  content: '',
  type: 'CLASSIC',
  answer: [{ text: '', isCorrect: true }],
  points: 1,
  timeGiven: 45,
})

const localQuestion = ref({ ...defaultQuestion(), ...props.question })

// For association type
const associationPairs = ref([
  { left: '', right: '' },
  { left: '', right: '' },
])

// For find intruder type
const intruderIndex = ref(0)

// Initialize answers based on question type
function initAnswersByType(type) {
  switch (type) {
    case 'CLASSIC':
    case 'BLIND_TEST':
      return [{ text: '', isCorrect: true }]
    case 'MULTIPLE_CHOICE':
      return [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ]
    case 'ORDER':
      return [
        { text: '', isCorrect: true, correctOrder: 1 },
        { text: '', isCorrect: true, correctOrder: 2 },
        { text: '', isCorrect: true, correctOrder: 3 },
      ]
    case 'ASSOCIATION':
      associationPairs.value = [
        { left: '', right: '' },
        { left: '', right: '' },
      ]
      return associationPairs.value.map((pair) => ({
        text: `${pair.left}|${pair.right}`,
        isCorrect: true,
      }))
    case 'FIND_INTRUDER':
      intruderIndex.value = 3
      return [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: true },
      ]
    default:
      return [{ text: '', isCorrect: true }]
  }
}

// Initialization based on type and props
// Unique initialization
localQuestion.value = { ...defaultQuestion(), ...props.question }

// Watch on question prop: only update localQuestion if content changed (avoid infinite loop)
watch(
  () => props.question,
  (newQuestion) => {
    if (JSON.stringify(localQuestion.value) !== JSON.stringify(newQuestion)) {
      localQuestion.value = { ...defaultQuestion(), ...newQuestion }
    }
  },
  { deep: true },
)

// Emit changes
watch(
  localQuestion,
  (newQuestion) => {
    emit('update:question', newQuestion)
  },
  { deep: true },
)

const onTypeChange = (newType) => {
  localQuestion.value.answer = initAnswersByType(newType)
}

const addAnswer = () => {
  if (localQuestion.value.type === 'ORDER') {
    localQuestion.value.answer.push({
      text: '',
      isCorrect: true,
      correctOrder: localQuestion.value.answer.length + 1,
    })
  } else if (
    localQuestion.value.type === 'MULTIPLE_CHOICE' ||
    localQuestion.value.type === 'FIND_INTRUDER'
  ) {
    localQuestion.value.answer.push({
      text: '',
      isCorrect: false,
    })
  }
}

const removeAnswer = (index) => {
  localQuestion.value.answer.splice(index, 1)

  // For ORDER, adjust order numbers
  if (localQuestion.value.type === 'ORDER') {
    localQuestion.value.answer.forEach((answer, i) => {
      answer.correctOrder = i + 1
    })
  }

  // For FIND_INTRUDER, adjust intruder index
  if (localQuestion.value.type === 'FIND_INTRUDER') {
    if (intruderIndex.value === index) {
      intruderIndex.value = 0
      updateIntruder(0)
    } else if (intruderIndex.value > index) {
      intruderIndex.value--
    }
  }
}

const addAssociationPair = () => {
  associationPairs.value.push({ left: '', right: '' })
  updateAssociationAnswers()
}

const removeAssociationPair = (index) => {
  associationPairs.value.splice(index, 1)
  updateAssociationAnswers()
}

const updateAssociationAnswers = () => {
  localQuestion.value.answer = associationPairs.value.map((pair) => ({
    text: `${pair.left}|${pair.right}`,
    isCorrect: true,
  }))
}

const updateIntruder = (newIndex) => {
  localQuestion.value.answer.forEach((answer, index) => {
    answer.isCorrect = index === newIndex
  })
}

// Watch effect for association type
watchEffect(() => {
  if (localQuestion.value.type === 'ASSOCIATION') {
    updateAssociationAnswers()
  }
})
</script>
