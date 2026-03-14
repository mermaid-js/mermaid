import { urlSnapshotTest, assertNoDuplicateIds } from '../../helpers/util.ts';

describe('Marker Unique IDs Per Diagram', () => {
  it('should render a blue arrow tip in second digram', () => {
    urlSnapshotTest('/marker_unique_id.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });

  it('should have no duplicate element IDs across all four diagrams', () => {
    cy.visit('/marker_unique_id.html');
    cy.window().should('have.property', 'rendered', true);
    cy.get('svg').should('have.length.at.least', 4);
    assertNoDuplicateIds();
  });
});
