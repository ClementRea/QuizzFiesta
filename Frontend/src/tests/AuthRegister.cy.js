import AuthRegister from '../pages/Authentification/AuthRegister.vue'

describe('<AuthRegister />', () => {
  beforeEach(() => {
    cy.mount(AuthRegister)
  })

  it('should render all form inputs', () => {
    cy.get('[data-cy=username-input]').should('exist')
    cy.get('[data-cy=email-input]').should('exist')
    cy.get('[data-cy=password-input]').should('exist')
    cy.get('[data-cy=confirm-password-input]').should('exist')
  })

  it('should validate username input', () => {
    const input = cy.get('[data-cy=username-input]')
    input.type('ab')
    cy.contains("Le nom d'utilisateur doit contenir au moins 3 caractères").should('be.visible')
    input.clear().type('valid')
    cy.contains("Le nom d'utilisateur doit contenir au moins 3 caractères").should('not.exist')
  })

  it('should validate email input', () => {
    const input = cy.get('[data-cy=email-input]')
    input.type('invalid-email')
    cy.contains('Veuillez entrer une adresse email valide').should('be.visible')
    input.clear().type('valid@email.com')
    cy.contains('Veuillez entrer une adresse email valide').should('not.exist')
  })

  it('should validate password requirements', () => {
    const input = cy.get('[data-cy=password-input]')
    input.type('weak')
    cy.contains('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre').should('be.visible')
    input.clear().type('StrongPass123')
    cy.contains('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre').should('not.exist')
  })

  it('should validate password confirmation', () => {
    cy.get('[data-cy=password-input]').type('StrongPass123')
    cy.get('[data-cy=confirm-password-input]').type('DifferentPass123')
    cy.contains('Les mots de passe ne correspondent pas').should('be.visible')
    cy.get('[data-cy=confirm-password-input]').clear().type('StrongPass123')
    cy.contains('Les mots de passe ne correspondent pas').should('not.exist')
  })

  it('should toggle password visibility', () => {
    cy.get('[data-cy=password-input]').type('StrongPass123')
    cy.get('[data-cy=toggle-password-visibility]').click()
    cy.get('[data-cy=password-input]').should('have.attr', 'type', 'text')
    cy.get('[data-cy=toggle-password-visibility]').click()
    cy.get('[data-cy=password-input]').should('have.attr', 'type', 'password')
  })

  it('should submit form with valid data', () => {
    cy.intercept('POST', 'http://localhost:3000/api/auth/register', {
      statusCode: 200,
      body: { token: 'fake-token' }
    }).as('registerRequest')

    cy.get('[data-cy=username-input]').type('testuser')
    cy.get('[data-cy=email-input]').type('test@example.com')
    cy.get('[data-cy=password-input]').type('StrongPass123')
    cy.get('[data-cy=confirm-password-input]').type('StrongPass123')
    
    cy.contains('button', "s'inscrire").click()
    
    cy.wait('@registerRequest').its('request.body').should('deep.equal', {
      userName: 'testuser',
      email: 'test@example.com',
      password: 'StrongPass123'
    })
  })

  it('should handle registration error', () => {
    cy.intercept('POST', 'http://localhost:3000/api/auth/register', {
      statusCode: 400,
      body: { error: "Erreur lors de l'inscription" }
    }).as('failedRegister')

    cy.get('[data-cy=username-input]').type('testuser')
    cy.get('[data-cy=email-input]').type('test@example.com')
    cy.get('[data-cy=password-input]').type('StrongPass123')
    cy.get('[data-cy=confirm-password-input]').type('StrongPass123')
    
    cy.contains('button', "s'inscrire").click()
    
    cy.contains("Erreur lors de l'inscription").should('be.visible')
  })
})