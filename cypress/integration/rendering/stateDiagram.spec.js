/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util';

describe('State diagram', () => {
  it('should render a simple state diagrams', () => {
    imgSnapshotTest(
      `
    stateDiagram
    [*] --> State1
    State1 --> [*]
      `,
      { logLevel: 0 }
    );
    cy.get('svg');
  });
});
