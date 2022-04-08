const base64 = require('base-64')

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

  it("Displays error message when username is whitespace", () => {
    cy.visit('http://localhost:3000')
    
    // Fill the username form with whitespace
    cy.get('input[id="mui-1"]')
      .type('   ')

    // Fill some password
    cy.get('input[id="mui-2"]')
      .type('1234')

    // Submit
    cy.get('button')
      .click()

    // Error message pops up
    cy.get('.MuiSnackbarContent-message')
    .should('be.visible')

    // Correct error message value
    cy.get('.MuiSnackbarContent-message')
      .should('have.text', 'Username cannot be empty')

    // Error message dissapears when we click away
    cy.get('h1')
      .click()

    cy.get('.MuiSnackbarContent-message')
      .should('not.be.visible')
  })

  it("Displays error message when password is whitespace", () => {
    cy.visit('http://localhost:3000')
    
    // Fill the password form with whitespace
    cy.get('input[id="mui-2"]')
      .type('    ')

    // Fill some valid username
    cy.get('input[id="mui-1"]')
      .type('1234')

    // Submit
    cy.get('button')
      .click()

    // Error message pops up
    cy.get('.MuiSnackbarContent-message')
    .should('be.visible')

    // Correct error message value
    cy.get('.MuiSnackbarContent-message')
      .should('have.text', 'Password cannot be empty')

    // Error message dissapears when we click away
    cy.get('h1')
      .click()

    cy.get('.MuiSnackbarContent-message')
      .should('not.be.visible')
  })

  it("Saves new session data onto localStorage in base64 encoding", () => {
    cy.clearLocalStorage()
    cy.visit('http://localhost:3000')

    // Sign into a meeting
    cy.get('input[id="mui-1"]')
      .type('Username')

    cy.get('input[id="mui-2"]')
      .type('Password')

    cy.get('button')
      .click()
      .should(() => {
        // Client save session to localStorage
        expect(localStorage.getItem('Session')).not.eq(null || undefined)

        // Expect base64 encoding
        const base64decoded = base64.decode(localStorage.getItem('Session'))
        expect(base64decoded).not.eq(null || undefined)

        // Expect to be able to parse as JSON
        const session = JSON.parse(base64decoded)
        expect(session).not.eq(null || undefined)

        // Expect Session key/values to exist and not be null
        expect(session.Username).not.eq(null || undefined)
        expect(session.Meeting).not.eq(null || undefined)
        expect(session.Password).not.eq(null || undefined)
        expect(session.Admin).not.eq(null || undefined)
        expect(session.JWT).not.eq(null || undefined)
      })
  })

  it("Hides the banner for responsiveness", () => {
    cy.visit('http://localhost:3000')

    // Test on some generic phone
    cy.viewport('iphone-6')

    cy.get('div[id="banner"]')
      .should('not.be.visible')
  })
})
