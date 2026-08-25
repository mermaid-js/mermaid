import { imgSnapshotTest, renderGraph } from '../../../helpers/util.ts';

/**
 * Visual coverage for the `grid-attached` layout: the `grid-decomposed`
 * decomposition put back together. The core is the same grid-like drawing, and
 * every tree HOLA's leaf peeling removed is hung back onto the core node it came
 * from, in the place HOLA's face search chooses for it.
 *
 * Unlike `grid-decomposed`, nothing is duplicated and nothing is packed beside
 * anything else: one connected diagram in, one connected diagram out.
 */
const gridAttached = { layout: 'grid-attached' } as const;

// A four-cycle core with two trees hanging off it: `t1 → t2 → t3` from `A`, and
// `s1 → s2` from `C`. Peeling leaves `A B C D` as the core, and both trees are
// attached back to it.
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

describe('Flowchart grid-attached', () => {
  it('1-grid-attached: should attach a core and its peeled trees as one diagram', () => {
    imgSnapshotTest(CORE_WITH_TWO_TREES, gridAttached);
  });

  it('2-grid-attached: should render an acyclic graph as a single tree', () => {
    imgSnapshotTest(
      `flowchart LR
      root --> a
      root --> b
      b --> c
      b --> d
      a --> e
      `,
      gridAttached
    );
  });

  it('3-grid-attached: should attach the trees of each component independently', () => {
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
      `,
      gridAttached
    );
  });

  it('4-grid-attached: should spread several trees hanging off one core node', () => {
    imgSnapshotTest(
      `flowchart TB
      A --> B
      B --> C
      C --> A
      A --> k1
      A --> k2
      A --> k3
      A --> k4
      `,
      gridAttached
    );
  });

  it('5-grid-attached: should attach bushy trees to a dense core', () => {
    imgSnapshotTest(
      `flowchart LR
      A --> B
      B --> C
      C --> D
      D --> E
      E --> F
      F --> A
      A --> D
      A --> a1
      a1 --> a2
      a1 --> a3
      C --> c1
      c1 --> c2
      c1 --> c3
      E --> e1
      e1 --> e2
      `,
      gridAttached
    );
  });

  it('6-grid-attached: should keep edge labels on tree connectors', () => {
    imgSnapshotTest(
      `flowchart TB
      A -->|loops| B
      B --> C
      C --> A
      A -->|yes| t1
      t1 -->|then| t2
      `,
      gridAttached
    );
  });

  it('7-grid-attached: should nest a wide fan of connectors instead of stacking them', () => {
    imgSnapshotTest(
      `flowchart TD
      L1 --- L2
      L2 --- C
      M1 ---> C
      R1 .-> R2
      R2 <.-> C
      C -->|Label 1| E1
      C <-- Label 2 ---> E2
      C ----> E3
      C <-...-> E4
      C ======> E5
      `,
      gridAttached
    );
  });

  it('8-grid-attached: should route a mostly-core diagram without diagonals', () => {
    imgSnapshotTest(
      `flowchart TD
      edit["Editor text edit"] --> classify["Editor classifies edit"]
      classify --> noop["NOOP: keep current SVG"]
      classify --> local["LOCAL PATCH: update live SVG"]
      classify --> relayout["SAME-GRAPH RELAYOUT"]
      classify --> full["FULL MERMAID FALLBACK"]
      local --> patch["Patch label/node/edge label"]
      patch --> resize["Resize local box and retarget edges"]
      resize --> overlap{"Overlap or invalid geometry?"}
      overlap -->|no| done["Done without Mermaid render"]
      overlap -->|yes| relayout
      relayout --> sizes["Reuse known sizes where valid"]
      sizes --> worker["Run pure layout, preferably in worker"]
      worker --> move["Move existing SVG nodes, edges, labels"]
      move --> compare{"Supported and valid?"}
      compare -->|yes| done
      compare -->|no| full
      full --> fallback["Render from parsed data without parsing twice"]
      fallback --> replace["Replace SVG from Mermaid render"]
      `,
      gridAttached
    );
  });

  it('9-grid-attached: should start connectors on a diamond, not on its bounding box', () => {
    imgSnapshotTest(
      `flowchart TD
      A[Start Build] --> B[Compile Source]
      B --> C[Test Suite]
      C --> D{Tests Passed?}
      D -->|No| E[Notify Developer]
      E --> A
      D -->|Yes| F[Build Docker Image]
      F --> G[Deploy to Staging]
      G --> H[Run Integration Tests]
      H --> I{Tests Passed?}
      I -->|No| J[Rollback & Alert]
      I -->|Yes| K[Deploy to Production]
      K --> L([Success])
      `,
      gridAttached
    );
  });

  it('10-grid-attached: should draw every node and every edge exactly once', () => {
    renderGraph(CORE_WITH_TWO_TREES, { ...gridAttached, screenshot: false });

    // Nine declared nodes, nothing duplicated — the trees hang off the real core
    // nodes rather than off a copy of them.
    cy.get('svg g.node').should('have.length', 9);
    cy.get('svg path.flowchart-link').should('have.length', 9);

    cy.get('svg g.node').then(($nodes) => {
      const boxes = [...$nodes].map((n) => n.getBoundingClientRect());

      // No node overlaps another, whichever part of the decomposition it came from.
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const overlaps =
            a.left < b.right - 1 &&
            b.left < a.right - 1 &&
            a.top < b.bottom - 1 &&
            b.top < a.bottom - 1;
          expect(overlaps, `node ${i} overlaps node ${j}`).to.equal(false);
        }
      }

      // One diagram, not a row of islands: no gap wider than a whole node.
      const widest = Math.max(...boxes.map((box) => box.width));
      const sorted = [...boxes].sort((a, b) => a.left - b.left);
      const biggestGap = sorted
        .slice(1)
        .reduce((gap, box, index) => Math.max(gap, box.left - sorted[index].right), 0);
      expect(biggestGap, 'the trees should be attached, not packed beside the core').to.be.lessThan(
        2 * widest
      );
    });
  });
});
