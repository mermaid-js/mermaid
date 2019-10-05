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
  it('should render a states with descriptions including multi-line descriptions', () => {
    imgSnapshotTest(
      `
    stateDiagram
    State1: This a a single line description
    State2: This a a multi line description
    State2: here comes the multi part
    [*] --> State1
    State1 --> State2
    State2 --> [*]
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
  it('should render state descriptions', () => {
    imgSnapshotTest(
      `
      stateDiagram
        state "Long state description" as XState1
        state "Another Long state description" as XState2
        XState2 : New line
        XState1 --> XState2
      `,
      { logLevel: 0 }
    );
    cy.get('svg');
  });
  it('should render composit states', () => {
    imgSnapshotTest(
      `
      stateDiagram
      [*] --> NotShooting: Pacifist
      NotShooting --> A
      NotShooting --> B
      NotShooting --> C

      state NotShooting {
        [*] --> Idle: Yet another long long öong öong öong label
        Idle --> Configuring : EvConfig
        Configuring --> Idle : EvConfig  EvConfig EvConfig  EvConfig EvConfig
      }
      `,
      { logLevel: 0 }
    );
    cy.get('svg');
  });
  it('should render multiple composit states', () => {
    imgSnapshotTest(
      `
      stateDiagram
      [*]-->TV

      state TV {
        [*] --> Off: Off to start with
        On --> Off : Turn off
        Off --> On : Turn on
      }

      TV--> Console : KarlMartin

      state Console {
        [*] --> Off2: Off to start with
        On2--> Off2 : Turn off
        Off2 --> On2 : Turn on
        On2-->Playing

        state Playing {
          Alive --> Dead
          Dead-->Alive
         }
      }
      `,
      { logLevel: 0 }
    );
    cy.get('svg');
  });
});
