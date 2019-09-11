/// <reference types="Cypress" />

/// JSON fixture file can be loaded directly using
// the built-in JavaScript bundler
// @ts-ignore
const requiredExample = require('../../fixtures/example')

context('Files', () => {
  beforeEach(() => {
    cy.visit('https://example.cypress.io/commands/files')
  })

  beforeEach(() => {
    // load example.json fixture file and store
    // in the test context object
    cy.fixture('example.json').as('example')
  })

  it('cy.fixture() - load a fixture', () => {
    // https://on.cypress.io/fixture

    // Instead of writing a response inline you can
    // use a fixture file's content.

    cy.server()
    cy.fixture('example.json').as('comment')
    // when application makes an Ajax request matching "GET comments/*"
    // Cypress will intercept it and reply with object
    // from the "comment" alias
    cy.route('GET', 'comments/*', '@comment').as('getComment')

    // we have code that gets a comment when
    // the button is clicked in scripts.js
    cy.get('.fixture-btn').click()

    cy.wait('@getComment').its('responseBody')
      .should('have.property', 'name')
      .and('include', 'Using fixtures to represent data')

    // you can also just write the fixture in the route
    cy.route('GET', 'comments/*', 'fixture:example.json').as('getComment')

    // we have code that gets a comment when
    // the button is clicked in scripts.js
    cy.get('.fixture-btn').click()

    cy.wait('@getComment').its('responseBody')
      .should('have.property', 'name')
      .and('include', 'Using fixtures to represent data')

    // or write fx to represent fixture
    // by default it assumes it's .json
    cy.route('GET', 'comments/*', 'fx:example').as('getComment')

    // we have code that gets a comment when
    // the button is clicked in scripts.js
    cy.get('.fixture-btn').click()

    cy.wait('@getComment').its('responseBody')
      .should('have.property', 'name')
      .and('include', 'Using fixtures to represent data')
  })

  it('cy.fixture() or require - load a fixture', function () {
    // we are inside the "function () { ... }"
    // callback and can use test context object "this"
    // "this.example" was loaded in "beforeEach" function callback
    expect(this.example, 'fixture in the test context')
      .to.deep.equal(requiredExample)

    // or use "cy.wrap" and "should('deep.equal', ...)" assertion
    // @ts-ignore
    cy.wrap(this.example, 'fixture vs require')
      .should('deep.equal', requiredExample)
  })

  it('cy.readFile() - read a files contents', () => {
    // https://on.cypress.io/readfile

    // You can read a file and yield its contents
    // The filePath is relative to your project's root.
    cy.readFile('cypress.json').then((json) => {
      expect(json).to.be.an('object')
    })
  })

  it('cy.writeFile() - write to a file', () => {
    // https://on.cypress.io/writefile

    // You can write to a file

    // Use a response from a request to automatically
    // generate a fixture file for use later
    cy.request('https://jsonplaceholder.cypress.io/users')
      .then((response) => {
        cy.writeFile('cypress/fixtures/users.json', response.body)
      })
    cy.fixture('users').should((users) => {
      expect(users[0].name).to.exist
    })

    // JavaScript arrays and objects are stringified
    // and formatted into text.
    cy.writeFile('cypress/fixtures/profile.json', {
      id: 8739,
      name: 'Jane',
      email: 'jane@example.com',
    })

    cy.fixture('profile').should((profile) => {
      expect(profile.name).to.eq('Jane')
    })
  })
})
