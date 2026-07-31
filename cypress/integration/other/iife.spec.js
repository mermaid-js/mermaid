describe('IIFE', () => {
  beforeEach(() => {
    cy.visit('/iife.html');
  });

  it('should render when using mermaid.min.js', () => {
    cy.window().should('have.property', 'rendered', true);
    cy.get('svg').should('be.visible');
    cy.get('#d2').should('contain', 'Hello');
  });
});
