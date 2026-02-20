/**
 * Renders two identical diagrams side-by-side and asserts that ALL element IDs
 * across both SVGs are unique. Covers diagram types that go through the unified
 * render path (render.ts domId prefixing) or have their own scoping.
 *
 * IMPORTANT: When adding a new diagram type to mermaid, add a corresponding
 * entry to the DIAGRAMS map below. The meta-test at the bottom will fail if
 * a registered diagram type is missing from this map.
 */
import { JSDOM } from 'jsdom';
import { describe, beforeAll, it, expect } from 'vitest';
import mermaid from '../mermaid.js';
import { mermaidAPI } from '../mermaidAPI.js';
import { assertNoDuplicateIds } from '../tests/util.js';
import { detectors } from '../diagram-api/detectType.js';

const DIAGRAMS: Record<string, string> = {
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

  gitGraph: `gitGraph
    commit
    branch develop
    commit
    checkout main
    commit`,

  pie: `pie title Pets
    "Dogs" : 50
    "Cats" : 30`,

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

  sequence: `sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Alice: Hi
    Alice-xBob: Bye`,

  journey: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me`,

  timeline: `timeline
    title History
    2020 : COVID-19 Pandemic
    2021 : Vaccines`,

  gantt: `gantt
    dateFormat YYYY-MM-DD
    section Section
    Task A :a1, 2024-01-01, 30d
    Task B :a2, after a1, 20d`,

  c4: `C4Context
    Person(user, "User")
    System(system, "System")
    Rel(user, system, "Uses")`,
};

async function renderTwoAndCheckIds(code: string): Promise<void> {
  const oldWindow = global.window;
  const oldDocument = global.document;

  try {
    const dom = new JSDOM(`<html lang="en"><body><div id="container"></div></body></html>`, {
      resources: 'usable',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeParse(_window: any) {
        _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
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

    const { svg: svg1 } = await mermaidAPI.render('mermaid-0', code);
    const { svg: svg2 } = await mermaidAPI.render('mermaid-1', code);

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
      logLevel: 5,
    });
  });

  for (const [diagramId, code] of Object.entries(DIAGRAMS)) {
    it(`"${diagramId}" — two identical diagrams produce no duplicate element IDs`, async () => {
      await renderTwoAndCheckIds(code);
    });
  }

  // Known ID collision issues — tracked as failing tests so they don't block CI
  // but remain visible as work to be done.
  const KNOWN_FAILING: Record<string, string> = {
    block: `block-beta
    columns 1
    a["A"]
    b["B"]`,
    architecture: `architecture-beta
    service api(cloud)[API]
    service db(database)[DB]
    api:R -- L:db`,
  };

  for (const [diagramType, code] of Object.entries(KNOWN_FAILING)) {
    it.fails(`"${diagramType}" — known duplicate IDs (needs fix)`, async () => {
      await renderTwoAndCheckIds(code);
    });
  }

  // Diagram types that are aliases, variants, or internal-only and don't need
  // their own uniqueness test entry. When adding a new type here, add a comment
  // explaining why it's excluded.
  const EXCLUDED_TYPES = new Set([
    'error', // internal error-handling pseudo-diagram
    '---', // YAML front-matter parse-error pseudo-diagram
    'info', // simple diagnostic diagram with no generated IDs
    'flowchart', // legacy alias, covered by flowchart-v2
    'class', // legacy alias, covered by classDiagram
    'state', // legacy alias, covered by stateDiagram
    'flowchart-elk', // ELK layout variant, same renderer as flowchart-v2
    'mindmap', // uses unified pipeline (IDs are prefixed), but cytoscape crashes in JSDOM
  ]);

  it('every registered diagram type has a uniqueness test or is explicitly excluded', () => {
    const testedTypes = new Set([...Object.keys(DIAGRAMS), ...Object.keys(KNOWN_FAILING)]);
    const missing = Object.keys(detectors).filter(
      (key) => !testedTypes.has(key) && !EXCLUDED_TYPES.has(key)
    );
    if (missing.length > 0) {
      expect.fail(
        `Registered diagram type(s) missing from DIAGRAMS map: ${missing.join(', ')}.\n` +
          'Add a test entry to DIAGRAMS, or add to EXCLUDED_TYPES with a justification.'
      );
    }
  });
});
