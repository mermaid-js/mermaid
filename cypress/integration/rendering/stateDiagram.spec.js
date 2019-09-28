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
  it('should render a simple state diagrams', () => {
    imgSnapshotTest(
      `
    stateDiagram
    [*] --> State1
    State1 --> State2
    State1 --> State3
    State1 --> [*]
      `,
      { logLevel: 0 }
    );
    cy.get('svg');
  });
  it('should render a simple state diagrams with labels', () => {
    imgSnapshotTest(
      `
    stateDiagram
    [*] --> State1
    State1 --> State2 : Transition 1
    State1 --> State3 : Transition 2
    State1 --> State4 : Transition 3
    State1 --> State5 : Transition 4
    State2 --> State3 : Transition 5
    State1 --> [*]
      `,
      { logLevel: 0 }
    );
    cy.get('svg');
  });
});
