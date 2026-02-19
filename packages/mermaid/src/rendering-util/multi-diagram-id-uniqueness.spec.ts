/**
 * Self-enforcing integration test: renders two identical diagrams side-by-side
 * and asserts that ALL element IDs across both SVGs are unique.
 *
 * HOW THIS IS SELF-ENFORCING:
 * The first test case checks `mermaid.getRegisteredDiagramsMetadata()` against
 * the DIAGRAM_EXAMPLES map below. If a new diagram type is registered without
 * adding an entry here, the test fails with a message telling the developer
 * exactly what to do. This ensures new diagram types automatically get
 * ID-uniqueness coverage.
 *
 * UNIFIED vs LEGACY RENDERERS:
 * Diagram types using the unified render path (render.ts) have their node domIds
 * automatically prefixed with the diagram's SVG element ID. Legacy renderers
 * use their own draw logic and many have known duplicate-ID issues documented
 * here. As legacy renderers are migrated, move their entries from
 * LEGACY_DIAGRAM_EXAMPLES to DIAGRAM_EXAMPLES and the test will enforce
 * uniqueness.
 */
import { JSDOM } from 'jsdom';
import { describe, beforeAll, it, expect } from 'vitest';
import mermaid from '../mermaid.js';
import { mermaidAPI } from '../mermaidAPI.js';
import { assertNoDuplicateIds } from '../tests/util.js';

/**
 * Diagram examples for types that use the unified render path (render.ts).
 * These MUST produce unique IDs across multiple renders — the test enforces this.
 */
const DIAGRAM_EXAMPLES: Record<string, string> = {
  'flowchart-v2': `flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[Cancel]`,

  classDiagram: `classDiagram
    class Animal {
      +String name
      +makeSound()
    }
    class Dog {
      +fetch()
    }
    Animal <|-- Dog`,

  er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains`,

  stateDiagram: `stateDiagram-v2
    [*] --> Active
    Active --> Inactive
    Inactive --> [*]`,

  requirement: `requirementDiagram
    requirement test_req {
      id: 1
      text: the test text.
      risk: high
      verifymethod: test
    }`,

  kanban: `kanban
    column1[Todo]
      task1[Task 1]
    column2[Done]
      task2[Task 2]`,
};

/**
 * Diagram examples for types using legacy renderers that do NOT go through
 * render.ts. These are known to have duplicate-ID issues. They are tested
 * with `it.fails` to document the known issues, and the test will
 * automatically start failing (in the "expected to fail but passed" sense)
 * when the legacy renderer is fixed — prompting the developer to move the
 * entry to DIAGRAM_EXAMPLES.
 */
const LEGACY_DIAGRAM_EXAMPLES: Record<string, string> = {
  // Legacy renderers with known unscoped IDs:
  c4: `C4Context
    Person(user, "User")
    System(system, "System")
    Rel(user, system, "Uses")`,

  sequence: `sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Alice: Hi back`,

  gantt: `gantt
    title A Gantt
    dateFormat YYYY-MM-DD
    section Section
    Task1 :a1, 2024-01-01, 30d
    Task2 :after a1, 20d`,

  journey: `journey
    title My Day
    section Morning
      Wake up: 5: Me
      Breakfast: 3: Me`,

  block: `block-beta
    columns 2
    a["A"] b["B"]`,

  architecture: `architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service server(server)[Server] in api

    db:R -- L:server`,

  timeline: `timeline
    title Timeline of Events
    2023 : Event A
    2024 : Event B`,
};

/**
 * Diagram examples for types that render correctly but need special handling
 * in jsdom (e.g., they depend on browser APIs that jsdom doesn't provide).
 * Covered by Cypress tests instead.
 */
const JSDOM_INCOMPATIBLE_EXAMPLES: Record<string, string> = {
  mindmap: `mindmap
  root((Central))
    Topic1
    Topic2`, // Requires cytoscape layout engine, which needs real DOM dimensions
};

// Diagram types that pass uniqueness and use simple/standalone renderers.
const SIMPLE_DIAGRAM_EXAMPLES: Record<string, string> = {
  gitGraph: `gitGraph
    commit
    branch develop
    commit
    checkout main
    commit`,

  pie: `pie title Pets
    "Dogs" : 50
    "Cats" : 30
    "Birds" : 20`,

  quadrantChart: `quadrantChart
    title Reach and engagement
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]`,

  sankey: `sankey-beta
    Source,Target,5
    Source,Target2,3`,

  xychart: `xychart-beta
    title "Sales"
    x-axis [jan, feb, mar]
    y-axis "Revenue"
    bar [10, 20, 30]`,

  packet: `packet-beta
    0-15: "Source Port"
    16-31: "Destination Port"`,

  radar: `---
title: "Grades"
---
radar-beta
  axis m["Math"], s["Science"], e["English"]
  curve a["Alice"]{85, 90, 80}
  max 100
  min 0`,

  treemap: `treemap-beta
"Section 1"
    "Leaf 1.1": 12
    "Leaf 1.2": 8
"Section 2"
    "Leaf 2.1": 20`,
};

// All diagram examples combined for the self-enforcement check
const ALL_DIAGRAM_EXAMPLES: Record<string, string> = {
  ...DIAGRAM_EXAMPLES,
  ...LEGACY_DIAGRAM_EXAMPLES,
  ...JSDOM_INCOMPATIBLE_EXAMPLES,
  ...SIMPLE_DIAGRAM_EXAMPLES,
};

// Diagram IDs that are excluded from the uniqueness test entirely.
// Each exclusion MUST have a comment explaining why.
const SKIP_DIAGRAM_IDS = new Set([
  'error', // Internal error diagram, not user-facing
  'info', // Internal info diagram, not user-facing
  '---', // YAML front matter detector, not a real diagram
  // Legacy v1 IDs — their v2 equivalents are tested instead
  'class', // tested as 'classDiagram'
  'flowchart', // tested as 'flowchart-v2'
  'state', // tested as 'stateDiagram'
  'flowchart-elk', // Requires ELK layout (optional large feature); same renderer as flowchart-v2
]);

/** Render two identical diagrams and check for duplicate IDs */
async function renderTwoAndCheckIds(code: string): Promise<void> {
  const oldWindow = global.window;
  const oldDocument = global.document;

  try {
    const dom = new JSDOM(`<html lang="en"><body><div id="container"></div></body></html>`, {
      resources: 'usable',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeParse(_window: any) {
        _window.Element.prototype.getBBox = () => ({
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        _window.Element.prototype.getComputedTextLength = () => 50;
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = dom.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = dom.window.document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).MutationObserver = undefined;

    const container = dom.window.document.getElementById('container')!;

    // Render the same diagram text twice with different outer SVG IDs
    const { svg: svg1 } = await mermaidAPI.render('mermaid-0', code);
    const { svg: svg2 } = await mermaidAPI.render('mermaid-1', code);

    // Insert both SVGs into the same DOM to check for cross-diagram collisions
    const div1 = dom.window.document.createElement('div');
    div1.innerHTML = svg1;
    container.appendChild(div1);

    const div2 = dom.window.document.createElement('div');
    div2.innerHTML = svg2;
    container.appendChild(div2);

    assertNoDuplicateIds(container);
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = oldWindow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = oldDocument;
  }
}

describe('Multi-diagram ID uniqueness', () => {
  beforeAll(async () => {
    await mermaid.registerExternalDiagrams([]);
    mermaid.initialize({
      deterministicIds: true,
      deterministicIDSeed: '',
      flowchart: { htmlLabels: false },
      sequence: { useMaxWidth: false },
      logLevel: 5, // fatal — suppress noise
    });
  });

  it('should have an example for every registered diagram type (self-enforcement check)', () => {
    const registeredIds = mermaid.getRegisteredDiagramsMetadata().map((d) => d.id);
    const missingIds = registeredIds.filter(
      (id) => !SKIP_DIAGRAM_IDS.has(id) && !(id in ALL_DIAGRAM_EXAMPLES)
    );
    expect(
      missingIds,
      `New diagram type(s) registered but missing from multi-diagram-id-uniqueness.spec.ts. ` +
        `Add an example to DIAGRAM_EXAMPLES (if unified path) or LEGACY_DIAGRAM_EXAMPLES ` +
        `(if legacy renderer) for: ${missingIds.join(', ')}`
    ).toHaveLength(0);
  });

  describe('unified render path (must pass)', () => {
    for (const [diagramId, code] of Object.entries(DIAGRAM_EXAMPLES)) {
      it(`"${diagramId}" — two identical diagrams produce no duplicate element IDs`, async () => {
        await renderTwoAndCheckIds(code);
      });
    }
  });

  describe('simple/other diagrams (must pass)', () => {
    for (const [diagramId, code] of Object.entries(SIMPLE_DIAGRAM_EXAMPLES)) {
      it(`"${diagramId}" — two identical diagrams produce no duplicate element IDs`, async () => {
        await renderTwoAndCheckIds(code);
      });
    }
  });

  describe('legacy renderers (known duplicate-ID issues — move to DIAGRAM_EXAMPLES when fixed)', () => {
    for (const [diagramId, code] of Object.entries(LEGACY_DIAGRAM_EXAMPLES)) {
      // it.fails: expected to fail. When a legacy renderer is fixed, this test
      // will unexpectedly pass, prompting the developer to move it to DIAGRAM_EXAMPLES.
      it.fails(
        `"${diagramId}" — two identical diagrams produce no duplicate element IDs`,
        async () => {
          await renderTwoAndCheckIds(code);
        }
      );
    }
  });

  describe('jsdom-incompatible (covered by Cypress tests instead)', () => {
    for (const [diagramId] of Object.entries(JSDOM_INCOMPATIBLE_EXAMPLES)) {
      it.skip(`"${diagramId}" — skipped in jsdom (requires browser layout engine)`, () => {
        // Covered by cypress/integration/rendering/multi_diagram_unique_ids.spec.js
      });
    }
  });
});
