describe('Create a meeting', () => {
  it('Reflects input when we enter username and password', () => {
    cy.visit('http://localhost:3000')
    cy.get('input[id="mui-1"]')
      .type('myUsername')
      .should('have.value', 'myUsername')
    cy.get('input[id="mui-2"]')
      .type('myPass')
      .should('have.value', 'myPass')
  })

  it('Displays an error message when the password is too short', () => {
    cy.visit('http://localhost:3000')

    // Fill in sample username
    cy.get('input[id="mui-1"]')
      .type('myUsername')
      .should('have.value', 'myUsername')

    // Fill in 1-digit password (too short)
    cy.get('input[id="mui-2"]')
      .type('1')

    // Submit
    cy.get('button')
      .click()

    // Error message pops up
    cy.get('.MuiSnackbarContent-message')
      .should('be.visible')

    // Correct error message value
    cy.get('.MuiSnackbarContent-message')
      .should('have.text', 'Password must be at least 4 characters')

    // Error message dissapears when we click away
    cy.get('h1')
      .click()

    cy.get('.MuiSnackbarContent-message')
      .should('not.be.visible')
  })

  it('Redirects to a newly created meeting page', () => {
    cy.visit('http://localhost:3000')

    // Fill form
    cy.get('input[id="mui-1"]')
      .type('myUsername')
    cy.get('input[id="mui-2"]')
      .type('myPass')

    // Submit form
    cy.get('button')
      .click()

    cy.url().should('include', '/meeting')
  })
})
