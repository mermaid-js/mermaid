import { imgSnapshotTest } from '../../helpers/util.js';

/**
 * Check whether the SVG Element has a Mindmap root
 *
 * Sometimes, Cypress takes a snapshot before the mermaid mindmap has finished
 * generating the SVG.
 *
 * @param $p - The element to check.
 */
function shouldHaveRoot($p: JQuery<SVGSVGElement>) {
  // get HTML Element from jquery element
  const svgElement = $p[0];
  expect(svgElement.nodeName).equal('svg');

  const sectionRoots = svgElement.getElementsByClassName('mindmap-node section-root');
  // mindmap should have at least one root section
  expect(sectionRoots).to.have.lengthOf.at.least(1);
}

describe('Mindmaps', () => {
  it('Only a root', () => {
    imgSnapshotTest(
      `mindmap
root
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('a root with a shape', () => {
    imgSnapshotTest(
      `mindmap
root[root]
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('a root with wrapping text and a shape', () => {
    imgSnapshotTest(
      `mindmap
root[A root with a long text that wraps to keep the node size in check]
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('a root with an icon', () => {
    imgSnapshotTest(
      `mindmap
root[root]
::icon(mdi mdi-fire)
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('Blang and cloud shape', () => {
    imgSnapshotTest(
      `mindmap
root))bang((
  ::icon(mdi mdi-fire)
  a))Another bang((
  ::icon(mdi mdi-fire)
  a)A cloud(
  ::icon(mdi mdi-fire)
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('Blang and cloud shape with icons', () => {
    imgSnapshotTest(
      `mindmap
root))bang((

  a))Another bang((
  a)A cloud(
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('braches', () => {
    imgSnapshotTest(
      `mindmap
root
  child1
      grandchild 1
      grandchild 2
  child2
      grandchild 3
      grandchild 4
  child3
      grandchild 5
      grandchild 6
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('braches with shapes and labels', () => {
    imgSnapshotTest(
      `mindmap
root
  child1((Circle))
      grandchild 1
      grandchild 2
  child2(Round rectangle)
      grandchild 3
      grandchild 4
  child3[Square]
      grandchild 5
      ::icon(mdi mdi-fire)
      gc6((grand<br/>child 6))
      ::icon(mdi mdi-fire)
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  it('text shouhld wrap with icon', () => {
    imgSnapshotTest(
      `mindmap
root
  Child3(A node with an icon and with a long text that wraps to keep the node size in check)
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  it('square shape', () => {
    imgSnapshotTest(
      `
mindmap
    root[
      The root
    ]
      `,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  it('rounded rect shape', () => {
    imgSnapshotTest(
      `
mindmap
    root((
      The root
    ))
      `,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  it('circle shape', () => {
    imgSnapshotTest(
      `
mindmap
    root(
      The root
    )
      `,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  it('default shape', () => {
    imgSnapshotTest(
      `
mindmap
  The root
      `,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  it('adding children', () => {
    imgSnapshotTest(
      `
mindmap
  The root
    child1
    child2
      `,
      {},
      undefined,
      shouldHaveRoot
    );
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
      {},
      undefined,
      shouldHaveRoot
    );
  });
  /* The end */
});
