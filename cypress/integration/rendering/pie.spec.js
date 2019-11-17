/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util.js';

describe('Pie Chart', () => {
  it('should render a simple pie diagram', () => {
    imgSnapshotTest(
      `
    pie title Sports in Sweden
       "Bandy" : 40
       "Ice-Hockey" : 80
       "Football" : 90
      `,
      {}
    );
    cy.get('svg');
  });
  it('should render a simple pie diagram with long labels', () => {
    imgSnapshotTest(
      `
      pie title NETFLIX
         "Time spent looking for movie" : 90
         "Time spent watching it" : 10
        `,
      {}
    );
    cy.get('svg');
  });
  it('should render a simple pie diagram with capital letters for labels', () => {
    imgSnapshotTest(
      `
      pie title What Voldemort doesn't have?
         "FRIENDS" : 2
         "FAMILY" : 3
         "NOSE" : 45
        `,
      {}
    );
    cy.get('svg');
  });
});
