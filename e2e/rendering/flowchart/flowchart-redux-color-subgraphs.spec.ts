import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

/**
 * Flowchart subgraph containers take a per-container colour under the redux colour
 * themes. Nothing in the suite rendered a flowchart under those themes, so the wiring
 * had no visual coverage: the unit tests check that `flowDb` hands out slots and that the
 * stylesheet emits rules, but only a render proves the stamped `data-color-id` actually
 * meets the emitted selector on the element.
 */
const reduxThemes = ['redux', 'redux-color', 'redux-dark', 'redux-dark-color'] as const;

/**
 * Five subgraphs, one more than the four in the demo fixtures, so the ordering is
 * unambiguous and a reversed cycle would be obvious. Nodes inside stay uniform by design.
 */
const subgraphs = `
  flowchart TB
    subgraph Ingest
      A[Fetch] --> B[Validate]
    end
    subgraph Transform
      C[Normalise] --> D[Enrich]
    end
    subgraph Store
      E[(Warehouse)]
    end
    subgraph Serve
      F[API] --> G[Cache]
    end
    subgraph Observe
      H[Metrics]
    end
    B --> C
    D --> E
    E --> F
    F --> H
`;

/** Nested containers, to show the palette applying at more than one depth. */
const nested = `
  flowchart LR
    subgraph Outer
      subgraph InnerOne
        A[one] --> B[two]
      end
      subgraph InnerTwo
        C[three]
      end
    end
    subgraph Sibling
      D[four]
    end
    B --> C
    C --> D
`;

/**
 * A collapsed subgraph renders as a compact node rather than a container. It is still a
 * container, so it takes a palette slot too — and it keeps the slot it would have had
 * expanded, so collapsing one does not reshuffle its siblings' colours.
 */
const collapsed = `
  flowchart TB
    subgraph first[First]
      A[a] --> B[b]
    end
    subgraph second[Second]
      C[c]
    end
    second@{ view: collapsed }
    subgraph third[Third]
      D[d]
    end
    B --> C
    C --> D
`;

/**
 * Explicit user styling has to keep winning over the palette: `classDef` / `style`
 * declarations become inline `style` attributes and none of the palette rules are
 * `!important`. `Two` should stay green here while `One` takes its slot colour.
 */
const userStyled = `
  flowchart LR
    subgraph One
      X[node] --> Y[node]
    end
    subgraph Two
      Z[node]
    end
    classDef mine fill:#ff0000,stroke:#000000
    class X mine
    style Two fill:#00ff00,stroke:#0000ff
    Y --> Z
`;

const diagrams = {
  subgraphs,
  nested,
  collapsed,
  'user-styled': userStyled,
} as const;

test.describe('Flowchart - Redux colour theme subgraphs', () => {
  for (const theme of reduxThemes) {
    test.describe(`Theme: ${theme}`, () => {
      for (const [name, diagram] of Object.entries(diagrams)) {
        test(`should render ${name} subgraph containers`, async ({ page }, testInfo) => {
          await imgSnapshotTest(page, testInfo, diagram, { theme });
        });
      }
    });
  }
});
