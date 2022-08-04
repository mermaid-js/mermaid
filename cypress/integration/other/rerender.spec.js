describe('Rerendering', () => {
  it('should be able to render after an error has occurred', () => {
    const url = 'http://localhost:9000/render-after-error.html';
    cy.viewport(1440, 1024);
    cy.visit(url);
    cy.get('#graphDiv').should('exist');
  });

  it('should be able to render and rerender a graph via API', () => {
    const url = 'http://localhost:9000/rerender.html';
    cy.viewport(1440, 1024);
    cy.visit(url);
    cy.get('#graph [id^=flowchart-A]').should('have.text', 'XMas');

    cy.get('body').find('#rerender').click({ force: true });

    cy.get('#graph [id^=flowchart-A]').should('have.text', 'Saturday');
  });
});
