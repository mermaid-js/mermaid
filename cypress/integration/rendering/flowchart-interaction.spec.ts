import { renderGraph } from '../../helpers/util.ts';

describe('Flowchart Interaction', () => {
  describe('Click to Highlight', () => {
    it('should add highlighted class when node is clicked', () => {
      renderGraph(
        `flowchart TD
        A[Start] --> B{Decision}
        B -->|Yes| C[Action 1]
        B -->|No| D[Action 2]
        C --> E[End]
        D --> E`,
        { flowchart: { htmlLabels: true }, screenshot: false }
      );

      // Initially no nodes should be highlighted
      cy.get('.node.highlighted').should('not.exist');

      // Click on node A (Start)
      cy.get('.node').first().click({ force: true });

      // Now node A should be highlighted
      cy.get('.node.highlighted').should('exist');
    });

    it('should remove highlighted class when highlighted node is clicked again', () => {
      renderGraph(
        `flowchart TD
        A[Start] --> B[End]`,
        { flowchart: { htmlLabels: true }, screenshot: false }
      );

      // Click to highlight
      cy.get('.node').first().click({ force: true });
      cy.get('.node.highlighted').should('exist');

      // Wait a moment for click handling to complete, then click again to unhighlight
      cy.wait(100);
      cy.get('.node.highlighted').click({ force: true });
      cy.get('.node.highlighted').should('not.exist');
    });

    it('should toggle highlight correctly on multiple clicks', () => {
      renderGraph(
        `flowchart TD
        A[Start] --> B[End]`,
        { flowchart: { htmlLabels: true }, screenshot: false }
      );

      // First click - highlight
      cy.get('.node').first().click({ force: true });
      cy.get('.node.highlighted').should('exist');

      // Second click - unhighlight
      cy.wait(100);
      cy.get('.node.highlighted').click({ force: true });
      cy.get('.node.highlighted').should('not.exist');

      // Third click - highlight again
      cy.wait(100);
      cy.get('.node').first().click({ force: true });
      cy.get('.node.highlighted').should('exist');
    });

    it('should highlight connected edges when node is highlighted', () => {
      renderGraph(
        `flowchart TD
        A[Start] --> B[End]`,
        { flowchart: { htmlLabels: true }, screenshot: false }
      );

      // Click on first node
      cy.get('.node').first().click({ force: true });

      // Check that an edge path has the highlighted class
      cy.get('path.highlighted').should('exist');
    });
  });

  describe('Interaction Disabled', () => {
    it('should not add highlighted class when interaction is disabled', () => {
      renderGraph(
        `flowchart TD
        A[Start] --> B[End]`,
        {
          flowchart: {
            htmlLabels: true,
            enableInteraction: false,
          },
          screenshot: false,
        }
      );

      // Initially no nodes should be highlighted
      cy.get('.node.highlighted').should('not.exist');

      // Click on first node
      cy.get('.node').first().click({ force: true });

      // Node should still not be highlighted (interaction disabled)
      cy.get('.node.highlighted').should('not.exist');
    });

    it('should not highlight edges when interaction is disabled', () => {
      renderGraph(
        `flowchart TD
        A[Start] --> B[End]`,
        {
          flowchart: {
            htmlLabels: true,
            enableInteraction: false,
          },
          screenshot: false,
        }
      );

      // Click on first node
      cy.get('.node').first().click({ force: true });

      // No edge paths should be highlighted
      cy.get('path.highlighted').should('not.exist');
    });
  });
});
