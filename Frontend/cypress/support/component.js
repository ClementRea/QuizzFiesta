/* global Cypress */
import { mount } from 'cypress/vue';
import { Quasar } from 'quasar';

// Importez les styles de Quasar
import 'quasar/dist/quasar.css';

// Quasar plugins essentiels si nécessaire
// import { Dialog, Notify } from 'quasar';

Cypress.Commands.add('mount', (component, options = {}) => {
  // Options par défaut sont fusionnées avec des options utilisateurs
  return mount(component, {
    global: {
      plugins: [
        [Quasar, {
          // plugins: { Dialog, Notify }
        }]
      ],
      ...options.global
    },
    ...options
  });
});