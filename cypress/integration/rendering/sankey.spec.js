import { imgSnapshotTest, renderGraph } from '../../helpers/util.js';

describe('Sankey Diagram', () => {
  it('should render a simple sankey diagram', () => {
    imgSnapshotTest(
      `
      sankey
      a,b,10
      `,
      {}
    );
    cy.get('svg');
  });
});
