/**
 * Stress tests for multi-diagram ID uniqueness.
 *
 * These tests go beyond the basic two-diagram tests in multi-diagram-id-uniqueness.spec.ts
 * to cover:
 *   - Scaling: 10+ identical diagrams of the same type
 *   - Cross-type: mixed diagram types rendered into the same container
 *   - Edge cases: special characters in node IDs, large diagrams, minimal diagrams
 *   - Re-rendering: sequential renders into the same container
 *   - DiagramId boundaries: empty strings, numeric prefixes, hyphenated names
 *   - Module-level state: verifying counters (taskCount, nodeCount) reset correctly
 */
import { JSDOM } from 'jsdom';
import { describe, beforeAll, it, expect } from 'vitest';
import mermaid from '../mermaid.js';
import { mermaidAPI } from '../mermaidAPI.js';
import { assertNoDuplicateIds } from '../tests/util.js';

/**
 * Renders N diagrams (each with its own ID) into a single container and asserts
 * no duplicate element IDs exist across all SVGs.
 */
async function renderManyAndCheckIds(diagrams: { id: string; code: string }[]): Promise<Element> {
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

    for (const { id, code } of diagrams) {
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

// ─── Diagram definitions ────────────────────────────────────────────────────
const FLOWCHART = `flowchart LR
  A[Start] --> B{Decision}
  B -->|Yes| C[OK]
  B -->|No| D[Cancel]
  C --> E[End]
  D --> E`;

const FLOWCHART_SUBGRAPH = `flowchart TB
  subgraph sg1[Group 1]
    A --> B
    B --> C
  end
  subgraph sg2[Group 2]
    D --> E
    E --> F
  end
  sg1 --> sg2`;

const CLASS_DIAGRAM = `classDiagram
  class Animal {
    +String name
    +int age
    +makeSound()
    +move()
  }
  class Dog {
    +fetch()
    +bark()
  }
  class Cat {
    +purr()
    +scratch()
  }
  Animal <|-- Dog
  Animal <|-- Cat`;

const SEQUENCE = `sequenceDiagram
  participant Alice
  participant Bob
  participant Charlie
  Alice->>Bob: Hello Bob
  Bob-->>Alice: Hi Alice
  Alice-xBob: Bye
  Bob->>Charlie: Forward
  Charlie-->>Bob: Response
  Note over Alice,Bob: A shared note`;

const JOURNEY = `journey
  title My working day
  section Go to work
    Make tea: 5: Me
    Go upstairs: 3: Me
    Do work: 1: Me, Cat
  section Go home
    Go downstairs: 5: Me
    Sit down: 5: Me`;

const TIMELINE = `timeline
  title History of Social Media
  2002 : LinkedIn
  2004 : Facebook : Google
  2005 : YouTube
  2006 : Twitter`;

const GANTT = `gantt
  dateFormat YYYY-MM-DD
  title Project Plan
  section Phase 1
    Task A :a1, 2024-01-01, 30d
    Task B :a2, after a1, 20d
  section Phase 2
    Task C :b1, after a2, 15d
    Task D :b2, after b1, 10d`;

const C4_DIAGRAM = `C4Context
  title System Context
  Person(user, "User", "A user of the system")
  System(web, "Web App", "The web application")
  System(api, "API", "Backend service")
  Rel(user, web, "Uses")
  Rel(web, api, "Calls")`;

const STATE_DIAGRAM = `stateDiagram-v2
  [*] --> Active
  Active --> Inactive: deactivate
  Inactive --> Active: activate
  Active --> [*]: terminate
  state Active {
    [*] --> Running
    Running --> Paused
    Paused --> Running
  }`;

const ER_DIAGRAM = `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE-ITEM : contains
  CUSTOMER {
    string name
    string email
  }
  ORDER {
    int id
    date created
  }`;

const KANBAN = `kanban
  column1[Todo]
    task1[Design API]
    task2[Write tests]
  column2[In Progress]
    task3[Implement feature]
  column3[Done]
    task4[Deploy v1]`;

const PIE = `pie title Favorite Pets
  "Dogs" : 45
  "Cats" : 30
  "Birds" : 15
  "Fish" : 10`;

const GIT_GRAPH = `gitGraph
  commit id: "init"
  branch develop
  commit id: "dev-1"
  commit id: "dev-2"
  checkout main
  commit id: "hotfix"
  merge develop`;

describe('Stress tests: Multi-diagram ID uniqueness', () => {
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

  // ─── Scale tests: 10 identical diagrams ─────────────────────────────────
  describe('Scale: 10 identical diagrams of the same type', () => {
    const SCALE_DIAGRAMS: Record<string, string> = {
      flowchart: FLOWCHART,
      classDiagram: CLASS_DIAGRAM,
      sequence: SEQUENCE,
      journey: JOURNEY,
      timeline: TIMELINE,
      gantt: GANTT,
      c4: C4_DIAGRAM,
      stateDiagram: STATE_DIAGRAM,
      er: ER_DIAGRAM,
      pie: PIE,
      gitGraph: GIT_GRAPH,
    };

    for (const [type, code] of Object.entries(SCALE_DIAGRAMS)) {
      it(`10 identical "${type}" diagrams produce zero duplicate IDs`, async () => {
        const diagrams = Array.from({ length: 10 }, (_, i) => ({
          id: `stress-${type}-${i}`,
          code,
        }));
        await renderManyAndCheckIds(diagrams);
      });
    }
  });

  // ─── Cross-type tests: mixed diagram types in one container ──────────────
  describe('Cross-type: mixed diagram types in a single container', () => {
    it('flowchart + class + sequence + journey produce no collisions', async () => {
      await renderManyAndCheckIds([
        { id: 'mix-flow-0', code: FLOWCHART },
        { id: 'mix-class-0', code: CLASS_DIAGRAM },
        { id: 'mix-seq-0', code: SEQUENCE },
        { id: 'mix-journey-0', code: JOURNEY },
      ]);
    });

    it('timeline + gantt + c4 + state + er produce no collisions', async () => {
      await renderManyAndCheckIds([
        { id: 'mix-timeline-0', code: TIMELINE },
        { id: 'mix-gantt-0', code: GANTT },
        { id: 'mix-c4-0', code: C4_DIAGRAM },
        { id: 'mix-state-0', code: STATE_DIAGRAM },
        { id: 'mix-er-0', code: ER_DIAGRAM },
      ]);
    });

    it('all supported types rendered together produce no collisions', async () => {
      const allTypes = [
        { id: 'all-flow', code: FLOWCHART },
        { id: 'all-class', code: CLASS_DIAGRAM },
        { id: 'all-seq', code: SEQUENCE },
        { id: 'all-journey', code: JOURNEY },
        { id: 'all-timeline', code: TIMELINE },
        { id: 'all-gantt', code: GANTT },
        { id: 'all-c4', code: C4_DIAGRAM },
        { id: 'all-state', code: STATE_DIAGRAM },
        { id: 'all-er', code: ER_DIAGRAM },
        { id: 'all-pie', code: PIE },
        { id: 'all-git', code: GIT_GRAPH },
      ];
      await renderManyAndCheckIds(allTypes);
    });
  });

  // ─── Subgraph / cluster tests ───────────────────────────────────────────
  describe('Subgraph and cluster ID uniqueness', () => {
    it('two identical flowcharts with subgraphs produce unique cluster IDs', async () => {
      await renderManyAndCheckIds([
        { id: 'sg-flow-0', code: FLOWCHART_SUBGRAPH },
        { id: 'sg-flow-1', code: FLOWCHART_SUBGRAPH },
      ]);
    });

    it('5 flowcharts with subgraphs produce unique cluster IDs', async () => {
      const diagrams = Array.from({ length: 5 }, (_, i) => ({
        id: `sg5-flow-${i}`,
        code: FLOWCHART_SUBGRAPH,
      }));
      await renderManyAndCheckIds(diagrams);
    });

    it('flowchart with nested subgraphs produces unique IDs', async () => {
      const nested = `flowchart TB
        subgraph outer[Outer]
          subgraph inner[Inner]
            A --> B
          end
          C --> inner
        end
        D --> outer`;
      await renderManyAndCheckIds([
        { id: 'nested-0', code: nested },
        { id: 'nested-1', code: nested },
      ]);
    });
  });

  // ─── Edge case: large diagrams ──────────────────────────────────────────
  describe('Large diagrams', () => {
    it('flowchart with 50 nodes produces no duplicate IDs across 2 copies', async () => {
      const nodes = Array.from({ length: 50 }, (_, i) => `  N${i}[Node ${i}]`).join('\n');
      const links = Array.from({ length: 49 }, (_, i) => `  N${i} --> N${i + 1}`).join('\n');
      const largeFlow = `flowchart TD\n${nodes}\n${links}`;
      await renderManyAndCheckIds([
        { id: 'large-flow-0', code: largeFlow },
        { id: 'large-flow-1', code: largeFlow },
      ]);
    });

    it('sequence diagram with 20 messages produces no duplicate IDs', async () => {
      const msgs = Array.from({ length: 20 }, (_, i) => `  Alice->>Bob: Message ${i}`).join('\n');
      const largeSeq = `sequenceDiagram\n  participant Alice\n  participant Bob\n${msgs}`;
      await renderManyAndCheckIds([
        { id: 'large-seq-0', code: largeSeq },
        { id: 'large-seq-1', code: largeSeq },
      ]);
    });

    it('class diagram with 20 classes produces no duplicate IDs', async () => {
      const classes = Array.from(
        { length: 20 },
        (_, i) => `  class C${i} {\n    +method${i}()\n  }`
      ).join('\n');
      const relations = Array.from({ length: 19 }, (_, i) => `  C${i} <|-- C${i + 1}`).join('\n');
      const largeClass = `classDiagram\n${classes}\n${relations}`;
      await renderManyAndCheckIds([
        { id: 'large-class-0', code: largeClass },
        { id: 'large-class-1', code: largeClass },
      ]);
    });

    it('journey with 15 tasks produces no duplicate IDs', async () => {
      const tasks = Array.from({ length: 15 }, (_, i) => `    Task ${i}: ${(i % 5) + 1}: Me`).join(
        '\n'
      );
      const largeJourney = `journey\n  title Busy Day\n  section Morning\n${tasks}`;
      await renderManyAndCheckIds([
        { id: 'large-journey-0', code: largeJourney },
        { id: 'large-journey-1', code: largeJourney },
      ]);
    });
  });

  // ─── Edge case: minimal diagrams ────────────────────────────────────────
  describe('Minimal diagrams', () => {
    it('two minimal flowcharts (single node) produce no duplicates', async () => {
      const minimal = `flowchart LR\n  A`;
      await renderManyAndCheckIds([
        { id: 'min-flow-0', code: minimal },
        { id: 'min-flow-1', code: minimal },
      ]);
    });

    it('two minimal class diagrams (single class) produce no duplicates', async () => {
      const minimal = `classDiagram\n  class Foo`;
      await renderManyAndCheckIds([
        { id: 'min-class-0', code: minimal },
        { id: 'min-class-1', code: minimal },
      ]);
    });

    it('two minimal sequence diagrams (single message) produce no duplicates', async () => {
      const minimal = `sequenceDiagram\n  Alice->>Bob: Hi`;
      await renderManyAndCheckIds([
        { id: 'min-seq-0', code: minimal },
        { id: 'min-seq-1', code: minimal },
      ]);
    });

    it('two minimal pie charts produce no duplicates', async () => {
      const minimal = `pie\n  "A" : 100`;
      await renderManyAndCheckIds([
        { id: 'min-pie-0', code: minimal },
        { id: 'min-pie-1', code: minimal },
      ]);
    });
  });

  // ─── DiagramId boundary values ──────────────────────────────────────────
  describe('DiagramId boundary values', () => {
    // Pure numeric IDs like "0" are not valid CSS selectors (#0 fails querySelector).
    // This is a pre-existing mermaid limitation, not a regression from this PR.
    // Use string-prefixed numeric IDs instead.
    it('string-prefixed numeric diagram IDs produce no collisions', async () => {
      await renderManyAndCheckIds([
        { id: 'd0', code: FLOWCHART },
        { id: 'd1', code: FLOWCHART },
        { id: 'd2', code: FLOWCHART },
      ]);
    });

    it('deeply hyphenated diagram IDs produce no collisions', async () => {
      await renderManyAndCheckIds([
        { id: 'my-app-section-1-diagram-0', code: FLOWCHART },
        { id: 'my-app-section-1-diagram-1', code: FLOWCHART },
      ]);
    });

    it('diagram IDs with underscores produce no collisions', async () => {
      await renderManyAndCheckIds([
        { id: 'diagram_0', code: SEQUENCE },
        { id: 'diagram_1', code: SEQUENCE },
      ]);
    });

    it('mixed prefix formats do not collide', async () => {
      await renderManyAndCheckIds([
        { id: 'mermaid-0', code: FLOWCHART },
        { id: 'mermaid-1', code: FLOWCHART },
        { id: 'custom-0', code: FLOWCHART },
        { id: 'custom-1', code: FLOWCHART },
      ]);
    });
  });

  // ─── Sequential re-rendering ───────────────────────────────────────────
  describe('Sequential re-rendering into the same container', () => {
    it('rendering, clearing, and re-rendering produces no stale ID collisions', async () => {
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

        // First render pass: render 3 identical flowcharts
        for (let i = 0; i < 3; i++) {
          const { svg } = await mermaidAPI.render(`rerender-pass1-${i}`, FLOWCHART);
          const div = dom.window.document.createElement('div');
          div.innerHTML = svg;
          container.appendChild(div);
        }
        assertNoDuplicateIds(container);

        // Clear container
        container.innerHTML = '';

        // Second render pass: render 3 identical flowcharts with NEW IDs
        for (let i = 0; i < 3; i++) {
          const { svg } = await mermaidAPI.render(`rerender-pass2-${i}`, FLOWCHART);
          const div = dom.window.document.createElement('div');
          div.innerHTML = svg;
          container.appendChild(div);
        }
        assertNoDuplicateIds(container);
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).window = oldWindow;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).document = oldDocument;
      }
    });

    it('appending diagrams to existing content produces no collisions', async () => {
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

        // Render 2 flowcharts
        for (let i = 0; i < 2; i++) {
          const { svg } = await mermaidAPI.render(`append-flow-${i}`, FLOWCHART);
          const div = dom.window.document.createElement('div');
          div.innerHTML = svg;
          container.appendChild(div);
        }

        // Now append 2 sequence diagrams without clearing
        for (let i = 0; i < 2; i++) {
          const { svg } = await mermaidAPI.render(`append-seq-${i}`, SEQUENCE);
          const div = dom.window.document.createElement('div');
          div.innerHTML = svg;
          container.appendChild(div);
        }

        // Now append 2 journey diagrams
        for (let i = 0; i < 2; i++) {
          const { svg } = await mermaidAPI.render(`append-journey-${i}`, JOURNEY);
          const div = dom.window.document.createElement('div');
          div.innerHTML = svg;
          container.appendChild(div);
        }

        // All 6 diagrams coexist with unique IDs
        assertNoDuplicateIds(container);
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).window = oldWindow;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).document = oldDocument;
      }
    });
  });

  // ─── Module-level state: counter reset verification ─────────────────────
  describe('Module-level counter resets', () => {
    it('journey taskCount resets: identical diagrams have matching task-line structures', async () => {
      const container = await renderManyAndCheckIds([
        { id: 'counter-journey-0', code: JOURNEY },
        { id: 'counter-journey-1', code: JOURNEY },
        { id: 'counter-journey-2', code: JOURNEY },
      ]);

      // Each diagram should have its own set of task lines with scoped IDs
      const taskLines = [...container.querySelectorAll('.task-line')];
      const ids = taskLines.map((el) => el.getAttribute('id')).filter(Boolean);

      // Verify all IDs are unique (no stale counter issue)
      expect(new Set(ids).size).toBe(ids.length);

      // Each diagram should have the same number of task lines
      for (const diagramId of ['counter-journey-0', 'counter-journey-1', 'counter-journey-2']) {
        const thisDigramTasks = ids.filter((id) => id!.startsWith(diagramId));
        // The journey has 5 tasks, so each diagram should have 5 task lines
        expect(thisDigramTasks.length).toBe(5);
      }
    });

    it('timeline nodeCount resets: 3 identical timelines have consistent structure', async () => {
      await renderManyAndCheckIds([
        { id: 'counter-tl-0', code: TIMELINE },
        { id: 'counter-tl-1', code: TIMELINE },
        { id: 'counter-tl-2', code: TIMELINE },
      ]);
    });
  });

  // ─── Marker/defs uniqueness ─────────────────────────────────────────────
  describe('SVG marker and defs uniqueness', () => {
    it('sequence diagram markers are scoped per diagram', async () => {
      const container = await renderManyAndCheckIds([
        { id: 'marker-seq-0', code: SEQUENCE },
        { id: 'marker-seq-1', code: SEQUENCE },
      ]);

      // Check that arrowhead markers exist and are uniquely named
      const markers = [...container.querySelectorAll('marker[id]')];
      const markerIds = markers.map((m) => m.getAttribute('id'));
      expect(new Set(markerIds).size).toBe(markerIds.length);

      // Verify each diagram has its own set of markers
      const seq0Markers = markerIds.filter((id) => id!.startsWith('marker-seq-0'));
      const seq1Markers = markerIds.filter((id) => id!.startsWith('marker-seq-1'));
      expect(seq0Markers.length).toBeGreaterThan(0);
      expect(seq1Markers.length).toBeGreaterThan(0);
      expect(seq0Markers.length).toBe(seq1Markers.length);
    });

    it('flowchart edge markers are scoped per diagram', async () => {
      const flowWithEdgeLabels = `flowchart LR
        A -->|label 1| B
        B -->|label 2| C
        C -->|label 3| D`;
      const container = await renderManyAndCheckIds([
        { id: 'marker-flow-0', code: flowWithEdgeLabels },
        { id: 'marker-flow-1', code: flowWithEdgeLabels },
      ]);

      // All elements with IDs should be unique (already checked by assertNoDuplicateIds)
      // Additionally verify that markers exist
      const markers = [...container.querySelectorAll('marker[id]')];
      if (markers.length > 0) {
        const markerIds = markers.map((m) => m.getAttribute('id'));
        expect(new Set(markerIds).size).toBe(markerIds.length);
      }
    });

    it('C4 diagram markers are scoped per diagram', async () => {
      const container = await renderManyAndCheckIds([
        { id: 'marker-c4-0', code: C4_DIAGRAM },
        { id: 'marker-c4-1', code: C4_DIAGRAM },
      ]);

      const markers = [...container.querySelectorAll('marker[id]')];
      if (markers.length > 0) {
        const markerIds = markers.map((m) => m.getAttribute('id'));
        expect(new Set(markerIds).size).toBe(markerIds.length);
      }
    });
  });

  // ─── Flowchart-specific: lookUpDomId scoping ───────────────────────────
  describe('FlowDB lookUpDomId scoping under stress', () => {
    it('5 flowcharts with identical complex topologies have unique node IDs', async () => {
      const complexFlow = `flowchart TD
        A[Start] --> B{Branch}
        B -->|path1| C[Process 1]
        B -->|path2| D[Process 2]
        C --> E{Merge}
        D --> E
        E --> F[End]
        A -.-> G[Monitor]
        G ==> H[Alert]`;
      const diagrams = Array.from({ length: 5 }, (_, i) => ({
        id: `complex-flow-${i}`,
        code: complexFlow,
      }));
      await renderManyAndCheckIds(diagrams);
    });
  });

  // ─── ClassDB lookUpDomId scoping ────────────────────────────────────────
  describe('ClassDB lookUpDomId scoping under stress', () => {
    it('5 identical class diagrams with inheritance produce unique IDs', async () => {
      const diagrams = Array.from({ length: 5 }, (_, i) => ({
        id: `class-stress-${i}`,
        code: CLASS_DIAGRAM,
      }));
      await renderManyAndCheckIds(diagrams);
    });
  });

  // ─── Kanban pre-flight domId injection ──────────────────────────────────
  describe('Kanban domId injection under stress', () => {
    it('5 identical kanban boards produce unique IDs', async () => {
      const diagrams = Array.from({ length: 5 }, (_, i) => ({
        id: `kanban-stress-${i}`,
        code: KANBAN,
      }));
      await renderManyAndCheckIds(diagrams);
    });
  });

  // ─── Gantt CSS.escape correctness ───────────────────────────────────────
  describe('Gantt with special task IDs', () => {
    it('gantt tasks with dots in IDs produce unique scoped IDs', async () => {
      const ganttDots = `gantt
        dateFormat YYYY-MM-DD
        section v1.0
        Task v1.0.1 :t1, 2024-01-01, 10d
        Task v1.0.2 :t2, after t1, 10d`;
      await renderManyAndCheckIds([
        { id: 'gantt-dots-0', code: ganttDots },
        { id: 'gantt-dots-1', code: ganttDots },
      ]);
    });
  });

  // ─── State diagram with nested states ───────────────────────────────────
  describe('State diagram nesting stress', () => {
    it('two identical state diagrams with nested states produce unique IDs', async () => {
      const nestedState = `stateDiagram-v2
        [*] --> Active
        state Active {
          [*] --> Idle
          Idle --> Processing: start
          Processing --> Idle: done
          state Processing {
            [*] --> Step1
            Step1 --> Step2
            Step2 --> [*]
          }
        }
        Active --> [*]`;
      await renderManyAndCheckIds([
        { id: 'nested-state-0', code: nestedState },
        { id: 'nested-state-1', code: nestedState },
      ]);
    });
  });

  // ─── High cardinality: 20 diagrams ──────────────────────────────────────
  describe('High cardinality: 20 identical diagrams', () => {
    it('20 identical flowcharts produce zero duplicate IDs', async () => {
      const diagrams = Array.from({ length: 20 }, (_, i) => ({
        id: `hc-flow-${i}`,
        code: FLOWCHART,
      }));
      await renderManyAndCheckIds(diagrams);
    });

    it('20 identical sequence diagrams produce zero duplicate IDs', async () => {
      const diagrams = Array.from({ length: 20 }, (_, i) => ({
        id: `hc-seq-${i}`,
        code: SEQUENCE,
      }));
      await renderManyAndCheckIds(diagrams);
    });
  });
});
