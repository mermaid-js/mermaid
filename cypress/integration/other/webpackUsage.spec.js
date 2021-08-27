/* eslint-env jest */
describe('Sequencediagram', () => {
  it('should render a simple sequence diagrams', () => {
    const url = 'http://localhost:9000/webpackUsage.html';

    cy.visit(url);
    cy.get('body')
      .find('svg')
      .should('have.length', 1);
  });
  it('should handle html escapings properly', () => {
    const url = 'http://localhost:9000/webpackUsage.html?test-html-escaping=true';

    cy.visit(url);
    cy.get('body')
      .find('svg')
      .should('have.length', 1);

    cy.get('g.label > foreignobject > div').should('not.contain.text', '<b>');
  });
});
