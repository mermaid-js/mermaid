import { imgSnapshotTest, renderGraph } from '../../helpers/util.js';

describe('Mindmap', () => {
  it('square shape', () => {
    imgSnapshotTest(
      `
mindmap
    root[
      The root
    ]
      `,
      {}
    );
    cy.get('svg');
  });
  it('rounded rect shape', () => {
    imgSnapshotTest(
      `
mindmap
    root((
      The root
    ))
      `,
      {}
    );
    cy.get('svg');
  });
  it('circle shape', () => {
    imgSnapshotTest(
      `
mindmap
    root(
      The root
    )
      `,
      {}
    );
    cy.get('svg');
  });
  it('default shape', () => {
    imgSnapshotTest(
      `
mindmap
  The root
      `,
      {}
    );
    cy.get('svg');
  });
  it('adding children', () => {
    imgSnapshotTest(
      `
mindmap
  The root
    child1
    child2
      `,
      {}
    );
    cy.get('svg');
  });
  it('adding grand children', () => {
    imgSnapshotTest(
      `
mindmap
  The root
    child1
      child2
      child3
      `,
      {}
    );
    cy.get('svg');
  });
});
