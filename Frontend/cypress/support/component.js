/* global Cypress */
import { mount } from 'cypress/vue';
import { Quasar } from 'quasar';
import { createRouter, createWebHistory } from 'vue-router';

import 'quasar/dist/quasar.css';
import '@quasar/extras/material-icons/material-icons.css'
import '../support/styles.scss';

// Quasar plugins si vous les utilisez dans votre application
import { Dialog, Notify, Loading } from 'quasar';

Cypress.Commands.add('mount', (component, options = {}) => {
  // Créer un routeur mock pour les tests
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/register', name: 'register' },
      { path: '/login', name: 'login' },
      { path: '/reset-password', name: 'reset-password' },
      { path: '/accueil', name: 'accueil' }
    ]
  })

  // Options par défaut sont fusionnées avec des options utilisateurs
  return mount(component, {
    global: {
      plugins: [
        [Quasar, {
          plugins: { Dialog, Notify, Loading }
        }],
        router
      ],
      directives: {
        // ClosePopup: ClosePopup,
        // Ripple: Ripple
      },
      ...options.global
    },
    ...options
  });
});