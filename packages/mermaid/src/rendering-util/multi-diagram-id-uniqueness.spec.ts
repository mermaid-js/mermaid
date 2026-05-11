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

  treeView: `treeView-beta
"packages"
  "mermaid"
    "src"
  "parser"`,

  ishikawa: `ishikawa-beta
Root Cause
    Category A
        Cause 1
    Category B
        Cause 2`,

  venn: `venn-beta
set A
set B
union A, B`,

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

  block: `block-beta
    columns 1
    a["A"]
    b["B"]`,

  architecture: `architecture-beta
    service api(cloud)[API]
    service db(database)[DB]
    api:R -- L:db`,

  'wardley-beta': `wardley-beta
    title Kettle Evolution Pipeline
    size [1100, 800]

    component Kettle [0.57, 0.45]
    component Power [0.10, 0.70]

    Kettle -> Power

    pipeline Kettle {
      component Campfire Kettle [0.35] label [-60, 35]
      component Electric Kettle [0.53] label [-60, 35]
      component Smart Kettle [0.72] label [-30, 35]
    }

    Campfire Kettle -> Kettle
    Electric Kettle -> Kettle
    Smart Kettle -> Kettle`,

  cynefin: `cynefin-beta
    title Incident Response
    complex
      "Investigate root cause"
    complicated
      "Analyze metrics"
    clear
      "Restart service"
    chaotic
      "Page on-call"`,

  eventmodeling: `eventmodeling
    tf 01 evt Start
    tf 02 evt End
    rf 03 readmodel ReadModel01 ->> 01 ->> 02 { a: true }
    rf 04 rmo ReadModel02 ->> 01 ->> 02`,
};

async function renderTwoAndCheckIds(
  code: string,
  ids: [string, string] = ['mermaid-0', 'mermaid-1']
): Promise<Element> {
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

    for (const id of ids) {
      const { svg } = await mermaidAPI.render(id, code);
      const div = dom.window.document.createElement('div');
      div.innerHTML = svg;
      container.appendChild(div);
    }

    assertNoDuplicateIds(container);
    return container;
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

  it('"journey" — task line IDs are scoped with the diagram ID', async () => {
    // Before the fix, task lines had bare IDs like "task0" with no diagram prefix.
    const container = await renderTwoAndCheckIds(DIAGRAMS.journey, ['journey-a', 'journey-b']);
    const taskIds = [...container.querySelectorAll('.task-line')].map((el) =>
      el.getAttribute('id')
    );
    expect(taskIds).toContain('journey-a-task0');
    expect(taskIds).toContain('journey-b-task0');
  });

  it('"timeline" — task line IDs are scoped with the diagram ID', async () => {
    // Before the fix, timeline task lines had bare IDs like "task0" with no diagram prefix.
    const container = await renderTwoAndCheckIds(DIAGRAMS.timeline, ['timeline-a', 'timeline-b']);
    const taskLines = [...container.querySelectorAll('.task-line')];
    const ids = taskLines.map((el) => el.getAttribute('id'));
    // Every task-line ID should be prefixed with the diagram ID
    for (const id of ids) {
      expect(id).toMatch(/^timeline-[ab]-task\d+$/);
    }
  });

  it('"sequence" — marker IDs reference conf.diagramId (no stale module-level state)', async () => {
    // Before the fix, sequence diagrams used a redundant module-level diagramId variable.
    // This test renders two sequence diagrams and verifies markers are correctly scoped.
    const seqWithControl = `sequenceDiagram
      participant Alice
      participant Bob
      Alice->>Bob: Hello
      Bob-->>Alice: Hi`;
    const container = await renderTwoAndCheckIds(seqWithControl, ['seq-ctrl-0', 'seq-ctrl-1']);
    // Verify arrowhead markers are scoped per diagram
    const markers = [...container.querySelectorAll('marker[id]')];
    const markerIds = markers.map((m) => m.getAttribute('id'));
    const seq0Markers = markerIds.filter((id) => id!.startsWith('seq-ctrl-0'));
    const seq1Markers = markerIds.filter((id) => id!.startsWith('seq-ctrl-1'));
    expect(seq0Markers.length).toBeGreaterThan(0);
    expect(seq1Markers.length).toBeGreaterThan(0);
    // No marker should have an empty/missing diagram prefix
    for (const id of markerIds) {
      expect(id).not.toMatch(/^-/); // No leading hyphen (old empty-fallback bug)
    }
  });

  it('every registered diagram type has a uniqueness test or is explicitly excluded', () => {
    const testedTypes = new Set(Object.keys(DIAGRAMS));
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
