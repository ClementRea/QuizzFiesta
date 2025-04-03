import AuthLogin from '../pages/Authentification/AuthLogin.vue'

describe('<AuthLogin />', () => {
  beforeEach(() => {
    cy.mount(AuthLogin)
  })

  it('should render all form inputs and forgot password link', () => {
    cy.get('[data-cy=email-input]').should('exist')
    cy.get('[data-cy=password-input]').should('exist')
    cy.contains('Mot de passe oublié ?').should('exist')
  })

  it('should validate email input', () => {
    const input = cy.get('[data-cy=email-input]')
    input.type('invalid-email')
    cy.contains('Veuillez entrer une adresse email valide').should('be.visible')
    input.clear().type('valid@email.com')
    cy.contains('Veuillez entrer une adresse email valide').should('not.exist')
  })

  it('should validate password input', () => {
    const input = cy.get('[data-cy=password-input]')
    input.focus().blur()
    cy.contains('Le mot de passe est requis').should('be.visible')
    input.type('password123')
    cy.contains('Le mot de passe est requis').should('not.exist')
  })

  it('should toggle password visibility', () => {
    cy.get('[data-cy=password-input]').type('MyPassword123')
    cy.get('[data-cy=toggle-password-visibility]').click()
    cy.get('[data-cy=password-input]').should('have.attr', 'type', 'text')
    cy.get('[data-cy=toggle-password-visibility]').click()
    cy.get('[data-cy=password-input]').should('have.attr', 'type', 'password')
  })

  it('should submit form with valid credentials', () => {
    cy.intercept('POST', 'http://localhost:3000/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-token' }
    }).as('loginRequest')

    cy.get('[data-cy=email-input]').type('test@example.com')
    cy.get('[data-cy=password-input]').type('Password123')
    cy.contains('button', 'se connecter').click()

    cy.wait('@loginRequest').its('request.body').should('deep.equal', {
      email: 'test@example.com',
      password: 'Password123'
    })
  })

  it('should handle login error', () => {
    cy.intercept('POST', 'http://localhost:3000/api/auth/login', {
      statusCode: 401,
      body: { error: 'Email ou mot de passe incorrect.' }
    }).as('failedLogin')

    cy.get('[data-cy=email-input]').type('test@example.com')
    cy.get('[data-cy=password-input]').type('WrongPassword')
    cy.contains('button', 'se connecter').click()

  })

  it('should navigate to reset password page', () => {
    cy.get('button').contains('Mot de passe oublié ?').click()
    cy.get('button').contains('Mot de passe oublié ?').should('exist')
  })
})