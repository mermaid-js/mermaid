import { imgSnapshotTest, renderGraph } from '../../../helpers/util.ts';

/**
 * Visual coverage for the `grid-decomposed` layout: HOLA's topological
 * decomposition (trees peeled off the core) with every part drawn on its own by
 * grid-like and packed beside the others.
 *
 * Each peeled tree is re-rooted on a *duplicate* of the core node it hung from —
 * drawn with a dashed outline — so the edge peeling cut is still drawn, from the
 * duplicate, and no edge runs between two parts.
 */
const gridDecomposed = { layout: 'grid-decomposed' } as const;

// A four-cycle core with two trees hanging off it: `t1 → t2 → t3` from `A`, and
// `s1 → s2` from `C`. Peeling leaves `A B C D` as the core, so the drawing is
// three islands and carries two duplicated roots.
const CORE_WITH_TWO_TREES = `flowchart TB
  A --> B
  B --> C
  C --> D
  D --> A
  A --> t1
  t1 --> t2
  t2 --> t3
  C --> s1
  s1 --> s2
`;

describe('Flowchart grid-decomposed', () => {
  it('1-grid-decomposed: should render a core and its peeled trees as separate islands', () => {
    imgSnapshotTest(CORE_WITH_TWO_TREES, gridDecomposed);
  });

  it('2-grid-decomposed: should render an acyclic graph as a single tree', () => {
    imgSnapshotTest(
      `flowchart LR
      root --> a
      root --> b
      b --> c
      b --> d
      a --> e
      `,
      gridDecomposed
    );
  });

  it('3-grid-decomposed: should decompose each connected component independently', () => {
    imgSnapshotTest(
      `flowchart TB
      A --> B
      B --> C
      C --> A
      B --> D
      D --> E
      E --> B
      A --> p1
      C --> p2
      p2 --> p3
      E --> p4
      X --> Y
      Y --> Z
      Z --> X
      `,
      gridDecomposed
    );
  });

  it('4-grid-decomposed: should render edge labels and a self-loop on a peeled node', () => {
    imgSnapshotTest(
      `flowchart TB
      Start --> Parse
      Parse -- ok --> Layout
      Layout --> Render
      Render --> Start
      Parse -- error --> Report
      Report --> Report
      `,
      gridDecomposed
    );
  });

  it('5-grid-decomposed: should render a busy core with many single-node trees', () => {
    imgSnapshotTest(
      `flowchart LR
      hub --> a
      a --> b
      b --> hub
      hub --> c
      c --> d
      d --> hub
      hub --> leaf1
      hub --> leaf2
      hub --> leaf3
      a --> leaf4
      b --> leaf5
      `,
      gridDecomposed
    );
  });

  it('6-grid-decomposed: should render the HOLA paper graph, cycle drawn as a cycle', () => {
    imgSnapshotTest(
      `flowchart TB
      A --- B
      B --- C
      C --- D
      D --- A
      D --- E
      E --- F
      E --- G
      E --- H
      G --- I
      G --- L
      `,
      gridDecomposed
    );
  });

  it('7-grid-decomposed: should duplicate each tree root and keep every edge', () => {
    renderGraph(CORE_WITH_TWO_TREES, { ...gridDecomposed, screenshot: false });

    // Nine declared nodes plus one duplicated root per peeled tree.
    cy.get('svg g.node').should('have.length', 11);
    // Every declared edge is still drawn — peeling rewires, it does not delete.
    cy.get('svg path.flowchart-link').should('have.length', 9);

    // The core is drawn as a cycle: its four nodes span two dimensions rather
    // than sitting in one column with the closing edge running back through them.
    cy.get('svg g.node').then(($nodes) => {
      const boxes = [...$nodes].map((n) => n.getBoundingClientRect());
      const widest = Math.max(...boxes.map((b) => b.width));

      const sorted = [...boxes].sort((a, b) => a.left - b.left);
      const biggestGap = sorted
        .slice(1)
        .reduce((gap, box, index) => Math.max(gap, box.left - sorted[index].right), 0);
      expect(
        biggestGap,
        'islands should be separated by more than one node width'
      ).to.be.greaterThan(widest);

      const distinctLeft = new Set(boxes.map((b) => Math.round(b.left))).size;
      expect(distinctLeft, 'the drawing should occupy more than one column').to.be.greaterThan(3);
    });
  });
});
