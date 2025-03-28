import AuthRegister from './pages/Authentification/AuthRegister.vue'

describe('<AuthRegister />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(AuthRegister)
  })
})