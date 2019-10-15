/* eslint-env jest */
describe('Rerendering', () => {

    it('should be able to render and rerender a graph via API', () => {
      const url = 'http://localhost:9000/rerender.html';
      cy.viewport(1440, 1024);
      cy.visit(url);
      cy.get('#graph #A').should('have.text', 'XMas');

      cy.get('body')
        .find('#rerender')
        .click({ force: true });

      cy.get('#graph #A').should('have.text', 'Saturday');
    });
});
