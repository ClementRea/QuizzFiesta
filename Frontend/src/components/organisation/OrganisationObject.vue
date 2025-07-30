<template>
  <ObjectLayout
    :object="organisation"
    :size="size"
    :clickable="clickable"
    :flat="flat"
    :loading="loading"
    :show-actions="showActions"
    :show-edit-action="showEditAction"
    @click="$emit('click', organisation)"
    @view="$emit('view', organisation._id)"
    @edit="$emit('edit', organisation._id)"
    @copy-code="$emit('copy-code', $event)"
  >
    <!-- Quick Actions pour les organisations -->
    <template #quick-actions>
      <q-btn
        v-if="showJoinButton"
        flat
        dense
        round
        icon="mdi-account-plus"
        color="primary"
        text-color="secondary"
        @click.stop="$emit('join', organisation)"
      >
        <q-tooltip>Rejoindre</q-tooltip>
      </q-btn>

      <q-btn
        v-if="showInviteButton"
        flat
        dense
        round
        icon="mdi-account-multiple-plus"
        color="green"
        @click.stop="$emit('invite', organisation)"
      >
        <q-tooltip>Inviter</q-tooltip>
      </q-btn>

      <!-- Slot pour actions personnalisées -->
      <slot name="quick-actions" :organisation="organisation"></slot>
    </template>

    <!-- Actions pour les organisations -->
    <template #actions="{ object }">
      <div class="row q-gutter-sm full-width">
        <!-- Bouton principal selon le contexte -->
        <q-btn
          v-if="showJoinButton && !isMember"
          color="primary"
          text-color="secondary"
          icon="mdi-account-plus"
          label="Rejoindre"
          @click.stop="$emit('join', object)"
          unelevated
          no-caps
          class="col-auto"
        />

        <q-btn
          v-if="showManageButton && isMember"
          color="primary"
          text-color="secondary"
          icon="mdi-cog"
          label="Gérer"
          @click.stop="$emit('manage', object)"
          unelevated
          no-caps
          class="col-auto"
        />

        <q-space />

        <!-- Actions secondaires -->
        <div class="row q-gutter-xs">
          <q-btn
            v-if="showViewButton"
            flat
            color="grey-7"
            icon="visibility"
            @click.stop="$emit('view', object._id)"
            :size="size === 'sm' ? 'sm' : 'md'"
          >
            <q-tooltip>Voir les détails</q-tooltip>
          </q-btn>

          <q-btn
            v-if="showEditButton && canEdit"
            flat
            color="grey-7"
            icon="edit"
            @click.stop="$emit('edit', object._id)"
            :size="size === 'sm' ? 'sm' : 'md'"
          >
            <q-tooltip>Modifier</q-tooltip>
          </q-btn>

          <q-btn
            v-if="showInviteButton && canInvite"
            flat
            color="green"
            icon="mdi-account-multiple-plus"
            @click.stop="$emit('invite', object)"
            :size="size === 'sm' ? 'sm' : 'md'"
          >
            <q-tooltip>Inviter des membres</q-tooltip>
          </q-btn>

          <q-btn
            v-if="showLeaveButton && isMember && !isOwner"
            flat
            color="orange"
            icon="mdi-exit-to-app"
            @click.stop="$emit('leave', object)"
            :size="size === 'sm' ? 'sm' : 'md'"
          >
            <q-tooltip>Quitter</q-tooltip>
          </q-btn>

          <q-btn
            v-if="showDeleteButton && canDelete"
            flat
            color="negative"
            icon="delete"
            @click.stop="$emit('delete', object)"
            :size="size === 'sm' ? 'sm' : 'md'"
          >
            <q-tooltip>Supprimer</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Slot pour actions personnalisées -->
      <slot name="actions" :organisation="object" :size="size"></slot>
    </template>

    <!-- Métadonnées pour les organisations -->
    <template #metadata="{ object, size }">
      <!-- Nombre de membres -->
      <q-chip
        v-if="object.members !== undefined"
        dense
        color="blue-3"
        text-color="dark"
        :size="size === 'sm' ? 'sm' : 'md'"
      >
        <q-icon name="mdi-account-group" class="q-mr-xs" />
        {{ object.members?.length || object.memberCount || 0 }} membre{{
          (object.members?.length || object.memberCount || 0) > 1 ? 's' : ''
        }}
      </q-chip>

      <!-- Nombre de quiz -->
      <q-chip
        v-if="object.quizzes !== undefined"
        dense
        color="purple-3"
        text-color="dark"
        :size="size === 'sm' ? 'sm' : 'md'"
      >
        <q-icon name="mdi-quiz" class="q-mr-xs" />
        {{ object.quizzes?.length || object.quizCount || 0 }} quiz
      </q-chip>

      <!-- Type d'organisation -->
      <q-chip
        v-if="object.type"
        dense
        :color="getTypeColor(object.type)"
        text-color="white"
        :size="size === 'sm' ? 'sm' : 'md'"
      >
        <q-icon :name="getTypeIcon(object.type)" class="q-mr-xs" />
        {{ getTypeLabel(object.type) }}
      </q-chip>

      <!-- Slot pour métadonnées personnalisées -->
      <slot name="metadata" :organisation="object" :size="size"></slot>
    </template>

    <!-- Informations étendues pour les organisations -->
    <template #extended-info="{ object }">
      <div class="text-subtitle2 text-grey-7 q-mb-xs">Informations</div>
      <div class="column q-gutter-xs">
        <div v-if="object.owner">
          <q-icon name="mdi-crown" class="q-mr-sm" />
          <span class="text-body2">Propriétaire: {{ getOwnerName(object.owner) }}</span>
        </div>
        <div v-if="object.website">
          <q-icon name="mdi-web" class="q-mr-sm" />
          <span class="text-body2">Site web: {{ object.website }}</span>
        </div>
        <div v-if="object.location">
          <q-icon name="mdi-map-marker" class="q-mr-sm" />
          <span class="text-body2">Localisation: {{ object.location }}</span>
        </div>
        <div v-if="object.sector">
          <q-icon name="mdi-domain" class="q-mr-sm" />
          <span class="text-body2">Secteur: {{ object.sector }}</span>
        </div>
      </div>

      <!-- Slot pour informations étendues personnalisées -->
      <slot name="extended-info" :organisation="object"></slot>
    </template>

    <!-- Contenu personnalisé -->
    <template #content="{ object, size }">
      <slot name="content" :organisation="object" :size="size"></slot>
    </template>
  </ObjectLayout>
</template>

<script setup>
import { computed } from 'vue'
import ObjectLayout from '../layouts/ObjectLayout.vue'

// Props
const props = defineProps({
  organisation: {
    type: Object,
    required: true,
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value),
  },
  clickable: {
    type: Boolean,
    default: false,
  },
  flat: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  // Contexte utilisateur
  currentUserId: {
    type: String,
    default: null,
  },
  // Options d'affichage des boutons
  showActions: {
    type: Boolean,
    default: true,
  },
  showEditAction: {
    type: Boolean,
    default: true,
  },
  showViewButton: {
    type: Boolean,
    default: true,
  },
  showEditButton: {
    type: Boolean,
    default: true,
  },
  showDeleteButton: {
    type: Boolean,
    default: true,
  },
  showJoinButton: {
    type: Boolean,
    default: true,
  },
  showLeaveButton: {
    type: Boolean,
    default: true,
  },
  showInviteButton: {
    type: Boolean,
    default: true,
  },
  showManageButton: {
    type: Boolean,
    default: true,
  },
})

// Emits
defineEmits(['click', 'view', 'edit', 'delete', 'join', 'leave', 'invite', 'manage', 'copy-code'])

// Computed properties pour les permissions
const isMember = computed(() => {
  if (!props.currentUserId || !props.organisation.members) return false
  return props.organisation.members.some(
    (member) => (typeof member === 'string' ? member : member._id) === props.currentUserId,
  )
})

const isOwner = computed(() => {
  if (!props.currentUserId || !props.organisation.owner) return false
  const ownerId =
    typeof props.organisation.owner === 'string'
      ? props.organisation.owner
      : props.organisation.owner._id
  return ownerId === props.currentUserId
})

const canEdit = computed(() => {
  return isOwner.value || (isMember.value && props.organisation.allowMemberEdit)
})

const canDelete = computed(() => {
  return isOwner.value
})

const canInvite = computed(() => {
  return isOwner.value || (isMember.value && props.organisation.allowMemberInvite)
})

// Méthodes utilitaires spécifiques aux organisations
const getTypeColor = (type) => {
  const colors = {
    company: 'blue',
    school: 'green',
    association: 'purple',
    club: 'orange',
    government: 'red',
  }
  return colors[type] || 'grey'
}

const getTypeIcon = (type) => {
  const icons = {
    company: 'mdi-office-building',
    school: 'mdi-school',
    association: 'mdi-account-group',
    club: 'mdi-account-multiple',
    government: 'mdi-bank',
  }
  return icons[type] || 'mdi-domain'
}

const getTypeLabel = (type) => {
  const labels = {
    company: 'Entreprise',
    school: 'École',
    association: 'Association',
    club: 'Club',
    government: 'Administration',
  }
  return labels[type] || type
}

const getOwnerName = (owner) => {
  if (typeof owner === 'string') return owner
  return owner?.userName || owner?.name || 'Anonyme'
}
</script>
