import { assertNoDuplicateIds } from '../../helpers/util.ts';

describe('Multi-Diagram Unique IDs', () => {
  it('should have no duplicate element IDs across all diagrams on the page', () => {
    cy.visit('/multi_diagram_unique_ids.html');
    cy.window().should('have.property', 'rendered', true);
    cy.get('svg').should('have.length.at.least', 8);
    assertNoDuplicateIds();
  });
});
