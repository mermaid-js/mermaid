import { test } from '@playwright/test';
import { imgSnapshotTest } from '../helpers/util.ts';

/**
 * ELK is mermaid's default layout, but the rest of this suite pins dagre so its
 * baselines stay comparable (see `E2E_BASELINE_LAYOUT` in helpers/util.ts). That
 * leaves the shipped default itself uncovered, which is what these render: one
 * representative diagram per type that was migrated to ELK, with no layout
 * configured at all.
 *
 * `useDiagramLayout` here means "do not pin" rather than "use ELK" on purpose —
 * if the default ever regressed to dagre, these would move, which is the point.
 */
const diagrams: { name: string; code: string }[] = [
  {
    name: 'flowchart',
    code: `flowchart TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]`,
  },
  {
    name: 'state',
    code: `stateDiagram-v2
      [*] --> Still
      Still --> Moving
      Moving --> Crash
      Crash --> [*]`,
  },
  {
    name: 'class',
    code: `classDiagram
      Animal <|-- Duck
      Animal <|-- Fish
      Animal : +int age
      Duck : +String beakColor`,
  },
  {
    name: 'er',
    code: `erDiagram
      CUSTOMER ||--o{ ORDER : places
      ORDER ||--|{ LINE-ITEM : contains`,
  },
  {
    name: 'requirement',
    code: `requirementDiagram
      requirement test_req {
      id: 1
      text: the test text.
      risk: high
      verifymethod: test
      }

      element test_entity {
      type: simulation
      }

      test_entity - satisfies -> test_req`,
  },
  {
    name: 'usecase',
    code: `usecase-beta
      systemBoundary "System"
        actor User
        Login("Sign in")
      end
      User --> Login`,
  },
  {
    name: 'agentflow',
    code: `agentflow-beta LR
      flow review_agent["Code Review Agent"]
        receive_pr("Receive PR")
        analysis["Code Analysis"]
        receive_pr --> analysis
      end`,
  },
];

test.describe('default layout (elk)', () => {
  for (const { name, code } of diagrams) {
    test(`renders a ${name} with no layout configured`, async ({ page }, testInfo) => {
      await imgSnapshotTest(page, testInfo, code, { useDiagramLayout: true, logLevel: 1 });
    });
  }
});
