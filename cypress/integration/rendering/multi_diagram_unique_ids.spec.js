/**
 * Verifies that multiple identical mermaid diagrams rendered on the same page
 * produce no duplicate DOM element IDs. Tests flowchart, class, ER, and state
 * diagram pairs.
 */
describe('Multi-Diagram Unique IDs', () => {
  it('should have no duplicate element IDs across all diagrams on the page', () => {
    cy.visit('/multi_diagram_unique_ids.html');
    cy.window().should('have.property', 'rendered', true);
    cy.get('svg').should('have.length.at.least', 8);

    cy.document().then((doc) => {
      const allElements = doc.querySelectorAll('[id]');
      const idCounts = {};
      for (const el of allElements) {
        const id = el.getAttribute('id');
        idCounts[id] = (idCounts[id] || 0) + 1;
      }
      const duplicates = Object.entries(idCounts).filter(([, count]) => count > 1);
      expect(
        duplicates,
        `Duplicate IDs found: ${duplicates.map(([id, n]) => `${id} (${n}x)`).join(', ')}`
      ).to.have.length(0);
    });
  });
});
