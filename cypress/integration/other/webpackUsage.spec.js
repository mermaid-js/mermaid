/* eslint-env jest */
describe('Sequencediagram', () => {
  it('should render a simple sequence diagrams', () => {
    const url = 'http://localhost:9000/webpackUsage.html';

    cy.visit(url);
    cy.get('body')
      .find('svg')
      .should('have.length', 2);
  });
});
