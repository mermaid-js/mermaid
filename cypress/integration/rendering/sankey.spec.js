import { imgSnapshotTest } from '../../helpers/util.js';

describe('Sankey Diagram', () => {
  it('should render a simple example', () => {
    imgSnapshotTest(
      `
      sankey-beta
      
      a,b,10
      `,
      {}
    );
    cy.get('svg');
  });
});
