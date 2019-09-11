/// <reference types="Cypress" />

context('Network Requests', () => {
  beforeEach(() => {
    cy.visit('https://example.cypress.io/commands/network-requests')
  })

  // Manage AJAX / XHR requests in your app

  it('cy.server() - control behavior of network requests and responses', () => {
    // https://on.cypress.io/server

    cy.server().should((server) => {
      // the default options on server
      // you can override any of these options
      expect(server.delay).to.eq(0)
      expect(server.method).to.eq('GET')
      expect(server.status).to.eq(200)
      expect(server.headers).to.be.null
      expect(server.response).to.be.null
      expect(server.onRequest).to.be.undefined
      expect(server.onResponse).to.be.undefined
      expect(server.onAbort).to.be.undefined

      // These options control the server behavior
      // affecting all requests

      // pass false to disable existing route stubs
      expect(server.enable).to.be.true
      // forces requests that don't match your routes to 404
      expect(server.force404).to.be.false
      // whitelists requests from ever being logged or stubbed
      expect(server.whitelist).to.be.a('function')
    })

    cy.server({
      method: 'POST',
      delay: 1000,
      status: 422,
      response: {},
    })

    // any route commands will now inherit the above options
    // from the server. anything we pass specifically
    // to route will override the defaults though.
  })

  it('cy.request() - make an XHR request', () => {
    // https://on.cypress.io/request
    cy.request('https://jsonplaceholder.cypress.io/comments')
      .should((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.length(500)
        expect(response).to.have.property('headers')
        expect(response).to.have.property('duration')
      })
  })


  it('cy.request() - verify response using BDD syntax', () => {
    cy.request('https://jsonplaceholder.cypress.io/comments')
    .then((response) => {
      // https://on.cypress.io/assertions
      expect(response).property('status').to.equal(200)
      expect(response).property('body').to.have.length(500)
      expect(response).to.include.keys('headers', 'duration')
    })
  })

  it('cy.request() with query parameters', () => {
    // will execute request
    // https://jsonplaceholder.cypress.io/comments?postId=1&id=3
    cy.request({
      url: 'https://jsonplaceholder.cypress.io/comments',
      qs: {
        postId: 1,
        id: 3,
      },
    })
    .its('body')
    .should('be.an', 'array')
    .and('have.length', 1)
    .its('0') // yields first element of the array
    .should('contain', {
      postId: 1,
      id: 3,
    })
  })

  it('cy.request() - pass result to the second request', () => {
    // first, let's find out the userId of the first user we have
    cy.request('https://jsonplaceholder.cypress.io/users?_limit=1')
      .its('body.0') // yields the first element of the returned list
      .then((user) => {
        expect(user).property('id').to.be.a('number')
        // make a new post on behalf of the user
        cy.request('POST', 'https://jsonplaceholder.cypress.io/posts', {
          userId: user.id,
          title: 'Cypress Test Runner',
          body: 'Fast, easy and reliable testing for anything that runs in a browser.',
        })
      })
      // note that the value here is the returned value of the 2nd request
      // which is the new post object
      .then((response) => {
        expect(response).property('status').to.equal(201) // new entity created
        expect(response).property('body').to.contain({
          id: 101, // there are already 100 posts, so new entity gets id 101
          title: 'Cypress Test Runner',
        })
        // we don't know the user id here - since it was in above closure
        // so in this test just confirm that the property is there
        expect(response.body).property('userId').to.be.a('number')
      })
  })

  it('cy.request() - save response in the shared test context', () => {
    // https://on.cypress.io/variables-and-aliases
    cy.request('https://jsonplaceholder.cypress.io/users?_limit=1')
      .its('body.0') // yields the first element of the returned list
      .as('user') // saves the object in the test context
      .then(function () {
        // NOTE 👀
        //  By the time this callback runs the "as('user')" command
        //  has saved the user object in the test context.
        //  To access the test context we need to use
        //  the "function () { ... }" callback form,
        //  otherwise "this" points at a wrong or undefined object!
        cy.request('POST', 'https://jsonplaceholder.cypress.io/posts', {
          userId: this.user.id,
          title: 'Cypress Test Runner',
          body: 'Fast, easy and reliable testing for anything that runs in a browser.',
        })
        .its('body').as('post') // save the new post from the response
      })
      .then(function () {
        // When this callback runs, both "cy.request" API commands have finished
        // and the test context has "user" and "post" objects set.
        // Let's verify them.
        expect(this.post, 'post has the right user id').property('userId').to.equal(this.user.id)
      })
  })

  it('cy.route() - route responses to matching requests', () => {
    // https://on.cypress.io/route

    let message = 'whoa, this comment does not exist'

    cy.server()

    // Listen to GET to comments/1
    cy.route('GET', 'comments/*').as('getComment')

    // we have code that gets a comment when
    // the button is clicked in scripts.js
    cy.get('.network-btn').click()

    // https://on.cypress.io/wait
    cy.wait('@getComment').its('status').should('eq', 200)

    // Listen to POST to comments
    cy.route('POST', '/comments').as('postComment')

    // we have code that posts a comment when
    // the button is clicked in scripts.js
    cy.get('.network-post').click()
    cy.wait('@postComment')

    // get the route
    cy.get('@postComment').should((xhr) => {
      expect(xhr.requestBody).to.include('email')
      expect(xhr.requestHeaders).to.have.property('Content-Type')
      expect(xhr.responseBody).to.have.property('name', 'Using POST in cy.route()')
    })

    // Stub a response to PUT comments/ ****
    cy.route({
      method: 'PUT',
      url: 'comments/*',
      status: 404,
      response: { error: message },
      delay: 500,
    }).as('putComment')

    // we have code that puts a comment when
    // the button is clicked in scripts.js
    cy.get('.network-put').click()

    cy.wait('@putComment')

    // our 404 statusCode logic in scripts.js executed
    cy.get('.network-put-comment').should('contain', message)
  })
})
