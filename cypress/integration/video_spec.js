const base64 = require('base-64')

describe('Rendering and session management', () => {
  // @TODO creating a new session before each test is redundant
  beforeEach(() => {
    localStorage.clear()
    // Setup meeting
    cy.visit('http://localhost:3000')

    // Fill form
    cy.get('input[id="mui-1"]')
      .type('username')
    cy.get('input[id="mui-2"]')
      .type('password')

    // Submit form
    cy.get('button')
      .click()

    cy.url().should('include', 'meeting')
  })

  it('Should show a loading page as client waits for PeerJS to open', () => {
    cy.get('span[id="loading"]')
      .should('be.visible')
  })

  it('Session details should be stored in localStorage', () => {
    let session = localStorage.getItem('Session')
    expect(session).not.eq(null || undefined)

    // Expect base64 encoding
    const base64decoded = base64.decode(session)
    expect(base64decoded).not.eq(null || undefined)

    // Expect to be able to parse as JSON
    session = JSON.parse(base64decoded)
    expect(session).not.eq(null || undefined)

    // Expect Session key/values to exist and not be null
    expect(session.Username).not.eq(null || undefined)
    expect(session.Meeting).not.eq(null || undefined)
    expect(session.Password).not.eq(null || undefined)
    expect(session.Admin).not.eq(null || undefined)
    expect(session.JWT).not.eq(null || undefined)
  })

  // Because our client is the meeting admin...
  it('Should not show sign-in form if session is in localStorage', () => {
    cy.get('input[id="mui-1"]')
      .should('not.exist')
    cy.get('input[id="mui-2"]')
      .should('not.exist')
  })

  it('Should ask for mic/video permissions if session is in localStorage', () => {
    // When the sign-in form is visible but no textfields
    // are present, then we know we must have the
    // permissions form.
    cy.get('form[id="sign-into-meeting--form"]')
      .should('be.visible')

    cy.get('input[id="mui-1"]')
      .should('not.exist')
  })

  it('Should show sign-in form (and not permissions form) if session is not in localStorage', () => {
    localStorage.clear()
    cy.reload()
    // When the sign-in form is visible and textfields are present
    // we know we're in the sign-in form (because the perm. form has
    // no textfields).

    // We also know that we're not seeing the permissions form
    // because only one form can ever be shown at a time.

    cy.get('form[id="sign-into-meeting--form"]')
      .should('be.visible')

    cy.get('input[id="mui-1"]')
      .should('exist')

    cy.get('input[id="mui-2"]')
      .should('exist')
  })
})

describe('Sign-in form', () => {
  before(() => {
    localStorage.clear()

    // Setup a meeting
    cy.visit('http://localhost:3000')

    // Fill form
    cy.get('input[id="mui-1"]')
      .type('username')
    cy.get('input[id="mui-2"]')
      .type('password')

    // Submit form
    cy.get('button')
      .click()

    cy.url().should('include', 'meeting')
  })

  it('Should be fillable and reflect input', () => {
    localStorage.clear()
    cy.reload()

    cy.get('form[id="sign-into-meeting--form"]')
      .should('be.visible')

    // Username
    cy.get('input[id="mui-1"]')
      .type('someUser')
      .should('have.value', 'someUser')

    // Password
    cy.get('input[id="mui-2"]')
      .type('pass')
      .should('have.value', 'pass')
  })

  it('Should have a hint option', () => {
    cy.reload()

    cy.get('.MuiIconButton-sizeLarge')
      .click()

    cy.get('h6')
      .should('be.visible')
      .should('have.text', " Hint: You've been invited to a meeting. Enter any username and the meeting password to join the call.")
  })

  it('Should display an alert if password field is empty or whitespace', () => {
    cy.reload()

    // Enter a username so client doesn't trigger a username
    // error
    cy.get('input[id="mui-1"]')
      .type('SomeUser')

    // Only whitespace
    cy.get('input[id="mui-2"]')
      .type('    ')

    cy.get('.MuiButton-fullWidth')
      .click()

    cy.get('.MuiSnackbarContent-message')
      .should('be.visible')
      .should('have.text', 'Password cannot be empty')

    // Error message dissapears when we click away
    cy.get('form[id="sign-into-meeting--form"]')
      .click()

    cy.get('.MuiSnackbarContent-message')
      .should('not.be.visible')
  })

  it('Should display an alert if password is too short', () => {
    cy.reload()

    // Enter a username so client doesn't trigger a username
    // error
    cy.get('input[id="mui-1"]')
      .type('SomeUser')

    cy.get('input[id="mui-2"]')
      .type('a')

    cy.get('.MuiButton-fullWidth')
      .click()

    // Error message
    cy.get('.MuiSnackbarContent-message')
      .should('be.visible')
      .should('have.text', 'Password must be at least 4 characters')

    // Error message dissapears when we click away
    cy.get('form[id="sign-into-meeting--form"]')
      .click()

    cy.get('.MuiSnackbarContent-message')
      .should('not.be.visible')
  })

  it('Should display an alert if password is incorrect', () => {
    cy.reload()

    // Enter a username so client doesn't trigger a username
    // error
    cy.get('input[id="mui-1"]')
      .type('SomeUser')

    cy.get('input[id="mui-2"]')
      .type('incorrect')

    cy.get('.MuiButton-fullWidth')
      .click()

    // Error message
    cy.get('.MuiSnackbarContent-message')
      .should('be.visible')
      .should('have.text', 'Incorrect password')

    // Error message dissapears when we click away
    cy.get('form[id="sign-into-meeting--form"]')
      .click()

    cy.get('.MuiSnackbarContent-message')
      .should('not.be.visible')
  })

  it('Should display an alert if username field is empty or whitespace', () => {
    cy.reload()

    // Only whitespace
    cy.get('input[id="mui-1"]')
      .type('    ')

    cy.get('input[id="mui-2"]')
      .type('password')

    cy.get('.MuiButton-fullWidth')
      .click()

    cy.get('.MuiSnackbarContent-message')
      .should('be.visible')
      .should('have.text', 'Username cannot be empty')

    // Error message dissapears when we click away
    cy.get('form[id="sign-into-meeting--form"]')
      .click()

    cy.get('.MuiSnackbarContent-message')
      .should('not.be.visible')
  })

  it('Should display an alert if username is already taken', () => {
    cy.reload()

    cy.get('input[id="mui-1"]')
      .type('username')

    cy.get('input[id="mui-2"]')
      .type('password')

    cy.get('.MuiButton-fullWidth')
      .click()

    // Error message
    cy.get('.MuiSnackbarContent-message')
      .should('be.visible')
      .should('have.text', 'Username already taken')

    // Error message dissapears when we click away
    cy.get('form[id="sign-into-meeting--form"]')
      .click()

    cy.get('.MuiSnackbarContent-message')
      .should('not.be.visible')
  })

  it('Should write session object to localStorage', () => {
    localStorage.clear()
    cy.reload()

    cy.get('input[id="mui-1"]')
      .type('myUser')

    cy.get('input[id="mui-2"]')
      .type('password')

    cy.get('.MuiButton-fullWidth')
      .click()

    expect(localStorage.getItem('Session'))
      .not.eq(null || undefined)
  })
})

describe('Permissions form', () => {
  before(() => {
    localStorage.clear()

    // Setup a meeting
    cy.visit('http://localhost:3000')

    // Fill form
    cy.get('input[id="mui-1"]')
      .type('username')
    cy.get('input[id="mui-2"]')
      .type('password')

    // Submit form
    cy.get('button')
      .click()

    cy.url().should('include', 'meeting')
  })

  it('Should have both permissions enabled by default', () => {
    cy.get('form[id="sign-into-meeting--form"]').within(() => {
      cy.get('label').each(() => {
        cy.get('.MuiSwitch-root').within(() => {
          cy.get('.Mui-checked')
            .should('be.visible')
        })
      })
    })
  })

  it('Should be toggle-able', () => {
    const x = cy.get('span[class="MuiSwitch-switchBase MuiSwitch-colorPrimary MuiButtonBase-root MuiSwitch-switchBase MuiSwitch-colorPrimary PrivateSwitchBase-root Mui-checked css-5ryogn-MuiButtonBase-root-MuiSwitch-switchBase"]')
      .eq(0)
    const y = cy.get('span[class="MuiSwitch-switchBase MuiSwitch-colorPrimary MuiButtonBase-root MuiSwitch-switchBase MuiSwitch-colorPrimary PrivateSwitchBase-root Mui-checked css-5ryogn-MuiButtonBase-root-MuiSwitch-switchBase"]')
      .eq(1)

    cy.get('input[class="MuiSwitch-input PrivateSwitchBase-input css-1m9pwf3"]')
      .eq(0).click()
    cy.get('input[class="MuiSwitch-input PrivateSwitchBase-input css-1m9pwf3"]')
      .eq(1).click()

    x.should('not.have.class', 'Mui-checked')
    y.should('not.have.class', 'Mui-checked')

    cy.get('input[class="MuiSwitch-input PrivateSwitchBase-input css-1m9pwf3"]')
      .eq(0).click()
    cy.get('input[class="MuiSwitch-input PrivateSwitchBase-input css-1m9pwf3"]')
      .eq(1).click()
  })

  it('Should capture selected permissions and display them', () => {
    cy.get('button')
      .click()
    cy.get('video[class="self-stream"]')
      .should('be.visible')
  })
})

describe('P2P & Video grid', () => {
  before(() => {
    localStorage.clear()

    // Setup a meeting
    cy.visit('http://localhost:3000')

    // Fill form
    cy.get('input[id="mui-1"]')
      .type('username')
    cy.get('input[id="mui-2"]')
      .type('password')

    // Submit form
    cy.get('button')
      .click()

    cy.url().should('include', 'meeting')

    cy.get('button')
      .click()
  })

  it('Should copy meeting details when share button is clicked', () => {
    cy.get('button[class="MuiButtonBase-root MuiIconButton-root MuiIconButton-colorInherit MuiIconButton-sizeLarge css-1pz7awu-MuiButtonBase-root-MuiIconButton-root"]')
      .eq(3)
      .click()
      .then(() => {
        cy.window().then((win) => {
          win.navigator.clipboard.readText().then((text) => {
            expect(text).to.include(' is inviting you to a meeting at ')
          })
        })
      })

    cy.get('.MuiSnackbarContent-message')
      .should('be.visible')
  })

  // @TODO implement video grid testing
})

// @TODO implement messages testing
