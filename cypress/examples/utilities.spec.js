/// <reference types="Cypress" />

context('Utilities', () => {
  beforeEach(() => {
    cy.visit('https://example.cypress.io/utilities')
  })

  it('Cypress._ - call a lodash method', () => {
    // https://on.cypress.io/_
    cy.request('https://jsonplaceholder.cypress.io/users')
      .then((response) => {
        let ids = Cypress._.chain(response.body).map('id').take(3).value()

        expect(ids).to.deep.eq([1, 2, 3])
      })
  })

  it('Cypress.$ - call a jQuery method', () => {
    // https://on.cypress.io/$
    let $li = Cypress.$('.utility-jquery li:first')

    cy.wrap($li)
      .should('not.have.class', 'active')
      .click()
      .should('have.class', 'active')
  })

  it('Cypress.Blob - blob utilities and base64 string conversion', () => {
    // https://on.cypress.io/blob
    cy.get('.utility-blob').then(($div) =>
    // https://github.com/nolanlawson/blob-util#imgSrcToDataURL
    // get the dataUrl string for the javascript-logo
      Cypress.Blob.imgSrcToDataURL('https://example.cypress.io/assets/img/javascript-logo.png', undefined, 'anonymous')
      .then((dataUrl) => {
        // create an <img> element and set its src to the dataUrl
        let img = Cypress.$('<img />', { src: dataUrl })

        // need to explicitly return cy here since we are initially returning
        // the Cypress.Blob.imgSrcToDataURL promise to our test
        // append the image
        $div.append(img)

        cy.get('.utility-blob img').click()
          .should('have.attr', 'src', dataUrl)
      }))
  })

  it('Cypress.minimatch - test out glob patterns against strings', () => {
    // https://on.cypress.io/minimatch
    let matching = Cypress.minimatch('/users/1/comments', '/users/*/comments', {
      matchBase: true,
    })

    expect(matching, 'matching wildcard').to.be.true

    matching = Cypress.minimatch('/users/1/comments/2', '/users/*/comments', {
      matchBase: true,
    })
    expect(matching, 'comments').to.be.false

    // ** matches against all downstream path segments
    matching = Cypress.minimatch('/foo/bar/baz/123/quux?a=b&c=2', '/foo/**', {
      matchBase: true,
    })
    expect(matching, 'comments').to.be.true

    // whereas * matches only the next path segment

    matching = Cypress.minimatch('/foo/bar/baz/123/quux?a=b&c=2', '/foo/*', {
      matchBase: false,
    })
    expect(matching, 'comments').to.be.false
  })


  it('Cypress.moment() - format or parse dates using a moment method', () => {
    // https://on.cypress.io/moment
    const time = Cypress.moment().utc('2014-04-25T19:38:53.196Z').format('h:mm A')

    expect(time).to.be.a('string')

    cy.get('.utility-moment').contains('3:38 PM')
      .should('have.class', 'badge')

    // the time in the element should be between 3pm and 5pm
    const start = Cypress.moment('3:00 PM', 'LT')
    const end = Cypress.moment('5:00 PM', 'LT')

    cy.get('.utility-moment .badge')
      .should(($el) => {
        // parse American time like "3:38 PM"
        const m = Cypress.moment($el.text().trim(), 'LT')

        // display hours + minutes + AM|PM
        const f = 'h:mm A'

        expect(m.isBetween(start, end),
          `${m.format(f)} should be between ${start.format(f)} and ${end.format(f)}`).to.be.true
      })
  })


  it('Cypress.Promise - instantiate a bluebird promise', () => {
    // https://on.cypress.io/promise
    let waited = false

    /**
     * @return Bluebird<string>
     */
    function waitOneSecond () {
      // return a promise that resolves after 1 second
      // @ts-ignore TS2351 (new Cypress.Promise)
      return new Cypress.Promise((resolve, reject) => {
        setTimeout(() => {
          // set waited to true
          waited = true

          // resolve with 'foo' string
          resolve('foo')
        }, 1000)
      })
    }

    cy.then(() =>
    // return a promise to cy.then() that
    // is awaited until it resolves
      // @ts-ignore TS7006
      waitOneSecond().then((str) => {
        expect(str).to.eq('foo')
        expect(waited).to.be.true
      }))
  })
})
