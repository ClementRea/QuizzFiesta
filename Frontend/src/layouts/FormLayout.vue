<template>
  <div class="column q-pa-md q-pt-lg">
    <span v-if="showTitle" class="text-h4 text-dark80 text-bold q-mb-xl">{{ title }}</span>

    <slot name="content"></slot>

    <div v-if="showActions" class="row col items-center q-pa-md q-mt-md q-gutter-x-md">
      <slot name="before-actions"></slot>

      <template v-if="actionButtons.length > 0">
        <q-btn
          v-for="(button, index) in actionButtons"
          :key="index"
          rounded
          :color="button.color"
          :class="button.class"
          :label="button.label"
          type="submit"
          :aria-label="button.ariaLabel"
          :title="button.title"
          @click="onButtonClick(button.action)"
          :disable="isButtonDisabled(button)"
        >
          <q-tooltip v-if="isButtonDisabled(button) && button.disabledTooltip" class="bg-dark90">
            {{ button.disabledTooltip }}
          </q-tooltip>

          <slot :name="`button-${button.action}`"></slot>
        </q-btn>
      </template>

      <template v-else>
        <!-- Bouton secondaire (clair) - utilisé pour l'action alternative -->
        <q-btn
          rounded
          outline
          class="text-dark80 q-pa-sm col-5"
          :label="actionType === 'login' ? 's\'inscrire' : 'se connecter'"
          type="submit"
          :aria-label="
            actionType === 'login' ? 'S\'inscrire sur la plateforme' : 'Se connecter à votre compte'
          "
          @click="onSubmit(actionType === 'login' ? 'register' : 'login')"
          :disable="isButtonDisabled({ action: actionType === 'login' ? 'register' : 'login' })"
        />

        <!-- Bouton principal (foncé) - utilisé pour l'action principale -->
        <q-btn
          rounded
          color="dark80"
          class="text-light20 q-pa-sm col-5"
          :label="actionType === 'login' ? 'se connecter' : 's\'inscrire'"
          type="submit"
          :aria-label="
            actionType === 'login' ? 'Se connecter à votre compte' : 'S\'inscrire sur la plateforme'
          "
          @click="onSubmit(actionType)"
          :disable="isButtonDisabled({ action: actionType })"
        >
          <q-tooltip v-if="isButtonDisabled({ action: actionType })" class="bg-dark90">
            {{ disabledSubmitMessage }}
          </q-tooltip>
        </q-btn>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  showTitle: {
    type: Boolean,
    default: true,
  },
  disabledSubmit: {
    type: Boolean,
    default: false,
  },
  disabledSubmitMessage: {
    type: String,
    default: 'Veuillez remplir correctement tous les champs',
  },
  actionType: {
    type: String,
    default: 'register',
    validator: (value) => ['register', 'login', 'custom'].includes(value),
  },
  showActions: {
    type: Boolean,
    default: true,
  },
  actionButtons: {
    type: Array,
    default: () => [],
    // Structure attendue:
    // [
    //   {
    //     action: 'login',
    //     label: 'Se connecter',
    //     color: 'light20',
    //     class: 'text-dark80 q-pa-sm col-5',
    //     ariaLabel: 'Se connecter à votre compte',
    //     title: 'Accéder à votre compte existant',
    //     disabled: false,
    //     disabledTooltip: 'Message explicatif'
    //   }
    // ]
  },
  disabledActions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['submit', 'action'])

const onSubmit = (type) => {
  emit('submit', type)
}

const onButtonClick = (action) => {
  emit('action', action)
  emit('submit', action)
}

const isButtonDisabled = (button) => {
  if (button.disabled !== undefined) {
    return button.disabled
  }

  // On vérifie si le bouton est dans la liste des actions désactivées
  if (props.disabledActions.includes(button.action)) {
    return true
  }

  return props.disabledSubmit && props.actionType === button.action
}
</script>
