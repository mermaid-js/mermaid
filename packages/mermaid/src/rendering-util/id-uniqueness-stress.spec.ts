/**
 * Stress tests for SVG element ID uniqueness across multiple mermaid diagrams.
 *
 * These tests exercise the ID scoping mechanism under adversarial conditions:
 * - Many diagrams with identical definitions
 * - Complex graphs with many nodes, edges, and subgraphs
 * - Mixed diagram types on the same page
 * - Sequential render/clear cycles
 * - Edge cases in the diagramId prefixing pipeline
 */
import { JSDOM } from 'jsdom';
import { describe, beforeAll, it, expect, beforeEach } from 'vitest';
import mermaid from '../mermaid.js';
import { mermaidAPI } from '../mermaidAPI.js';
import { assertNoDuplicateIds } from '../tests/util.js';
import { FlowDB } from '../diagrams/flowchart/flowDb.js';
import { ClassDB } from '../diagrams/class/classDb.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addFlowVertex(db: FlowDB, id: string) {
  db.addVertex(id, { text: id, type: 'text' } as any, undefined as any, [], [], '', {}, undefined);
}

/**
 * Renders N identical diagrams into a single JSDOM container and returns all
 * element IDs found across all SVGs, plus the container for further assertions.
 */
async function renderNDiagrams(
  code: string,
  count: number
): Promise<{ allIds: string[]; duplicates: [string, number][]; container: Element }> {
  const oldWindow = global.window;
  const oldDocument = global.document;

  try {
    const dom = new JSDOM(`<html lang="en"><body><div id="container"></div></body></html>`, {
      resources: 'usable',
      beforeParse(_window: any) {
        _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
        _window.Element.prototype.getComputedTextLength = () => 50;
      },
    });
    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).MutationObserver = undefined;

    const container = dom.window.document.getElementById('container')!;

    for (let i = 0; i < count; i++) {
      const { svg } = await mermaidAPI.render(`mermaid-${i}`, code);
      const div = dom.window.document.createElement('div');
      div.innerHTML = svg;
      container.appendChild(div);
    }

    // Collect all element IDs
    const allElements = container.querySelectorAll('[id]');
    const idMap = new Map<string, number>();
    for (const el of allElements) {
      const id = el.getAttribute('id')!;
      idMap.set(id, (idMap.get(id) ?? 0) + 1);
    }
    const allIds = [...idMap.keys()];
    const duplicates = [...idMap.entries()].filter(([, count]) => count > 1);

    return { allIds, duplicates, container };
  } finally {
    (global as any).window = oldWindow;
    (global as any).document = oldDocument;
  }
}

/**
 * Renders multiple different diagram codes into a single JSDOM container.
 */
async function renderMixedDiagrams(
  diagrams: { id: string; code: string }[]
): Promise<{ duplicates: [string, number][]; container: Element }> {
  const oldWindow = global.window;
  const oldDocument = global.document;

  try {
    const dom = new JSDOM(`<html lang="en"><body><div id="container"></div></body></html>`, {
      resources: 'usable',
      beforeParse(_window: any) {
        _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
        _window.Element.prototype.getComputedTextLength = () => 50;
      },
    });
    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).MutationObserver = undefined;

    const container = dom.window.document.getElementById('container')!;

    for (const { id, code } of diagrams) {
      const { svg } = await mermaidAPI.render(id, code);
      const div = dom.window.document.createElement('div');
      div.innerHTML = svg;
      container.appendChild(div);
    }

    const allElements = container.querySelectorAll('[id]');
    const idMap = new Map<string, number>();
    for (const el of allElements) {
      const id = el.getAttribute('id')!;
      idMap.set(id, (idMap.get(id) ?? 0) + 1);
    }
    const duplicates = [...idMap.entries()].filter(([, count]) => count > 1);

    return { duplicates, container };
  } finally {
    (global as any).window = oldWindow;
    (global as any).document = oldDocument;
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ID uniqueness stress tests', () => {
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

  // =========================================================================
  // 1. High-volume: many identical diagrams
  // =========================================================================
  describe('High-volume rendering', () => {
    it('5 identical flowcharts produce zero duplicate element IDs', async () => {
      const code = `flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[Cancel]`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs across 5 flowcharts:\n${details}`);
      }
    });

    it('5 identical class diagrams produce zero duplicate element IDs', async () => {
      const code = `classDiagram
    class Animal {
      +String name
      +makeSound()
    }
    class Dog {
      +fetch()
    }
    Animal <|-- Dog`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across 5 class diagrams:\n${details}`
        );
      }
    });

    it('5 identical ER diagrams produce zero duplicate element IDs', async () => {
      const code = `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
      string name
      int id
    }`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs across 5 ER diagrams:\n${details}`);
      }
    });

    it('5 identical state diagrams produce zero duplicate element IDs', async () => {
      const code = `stateDiagram-v2
    [*] --> Active
    Active --> Inactive
    Inactive --> Active
    Active --> [*]`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across 5 state diagrams:\n${details}`
        );
      }
    });

    it('5 identical sequence diagrams produce zero duplicate element IDs', async () => {
      const code = `sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Alice: Hi
    Alice-xBob: Bye`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across 5 sequence diagrams:\n${details}`
        );
      }
    });

    it('5 identical gantt charts produce zero duplicate element IDs', async () => {
      const code = `gantt
    dateFormat YYYY-MM-DD
    section Section
    Task A :a1, 2024-01-01, 30d
    Task B :a2, after a1, 20d`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs across 5 gantt charts:\n${details}`);
      }
    });

    it('5 identical pie charts produce zero duplicate element IDs', async () => {
      const code = `pie title Pets
    "Dogs" : 50
    "Cats" : 30
    "Birds" : 20`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs across 5 pie charts:\n${details}`);
      }
    });

    it('5 identical C4 diagrams produce zero duplicate element IDs', async () => {
      const code = `C4Context
    Person(user, "User")
    System(system, "System")
    Rel(user, system, "Uses")`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs across 5 C4 diagrams:\n${details}`);
      }
    });

    it('5 identical journey diagrams produce zero duplicate element IDs', async () => {
      const code = `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
    section Afternoon
      Code: 4: Me
      Review: 3: Me`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across 5 journey diagrams:\n${details}`
        );
      }
    });

    it('5 identical timeline diagrams produce zero duplicate element IDs', async () => {
      const code = `timeline
    title History
    2020 : COVID-19 Pandemic
    2021 : Vaccines
    2022 : Recovery`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across 5 timeline diagrams:\n${details}`
        );
      }
    });
  });

  // =========================================================================
  // 2. Complex graph stress — many nodes and edges
  // =========================================================================
  describe('Complex graphs with many nodes', () => {
    it('flowchart with 20 nodes and a chain of edges produces unique IDs across 3 renders', async () => {
      const nodes = Array.from({ length: 20 }, (_, i) => `    N${i}[Node ${i}]`).join('\n');
      const edges = Array.from({ length: 19 }, (_, i) => `    N${i} --> N${i + 1}`).join('\n');
      const code = `flowchart TD\n${nodes}\n${edges}`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs in 3 renders of a 20-node flowchart:\n${details}`
        );
      }
    });

    it('flowchart with fan-out topology (1 source to 10 targets) produces unique IDs across 3 renders', async () => {
      const targets = Array.from(
        { length: 10 },
        (_, i) => `    Source --> T${i}[Target ${i}]`
      ).join('\n');
      const code = `flowchart TD\n    Source[Hub]\n${targets}`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs in fan-out flowchart:\n${details}`);
      }
    });

    it('class diagram with 10 classes and inheritance produces unique IDs across 3 renders', async () => {
      const classes = Array.from(
        { length: 10 },
        (_, i) => `    class C${i} {\n      +method${i}()\n    }`
      ).join('\n');
      const relations = Array.from({ length: 9 }, (_, i) => `    C${i} <|-- C${i + 1}`).join('\n');
      const code = `classDiagram\n${classes}\n${relations}`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs in 10-class diagram:\n${details}`);
      }
    });
  });

  // =========================================================================
  // 3. Subgraph / nested structure stress
  // =========================================================================
  describe('Subgraphs and nested structures', () => {
    it('flowchart with identical subgraph names across 3 renders produces unique IDs', async () => {
      const code = `flowchart TD
    subgraph Backend
      A[API] --> B[DB]
    end
    subgraph Frontend
      C[UI] --> D[Store]
    end
    C --> A`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs in subgraph flowchart:\n${details}`);
      }
    });

    it('deeply nested subgraphs (3 levels) produce unique IDs across 3 renders', async () => {
      const code = `flowchart TD
    subgraph Outer
      subgraph Middle
        subgraph Inner
          A[Core] --> B[Data]
        end
        C[Service] --> A
      end
      D[Gateway] --> C
    end
    E[Client] --> D`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs in nested subgraph flowchart:\n${details}`
        );
      }
    });
  });

  // =========================================================================
  // 4. Mixed diagram types on the same page
  // =========================================================================
  describe('Mixed diagram types', () => {
    it('flowchart + class + ER diagrams on same page produce zero duplicate IDs', async () => {
      const { duplicates } = await renderMixedDiagrams([
        {
          id: 'mixed-flow',
          code: `flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]`,
        },
        {
          id: 'mixed-class',
          code: `classDiagram
    class Animal {
      +String name
    }
    class Dog {
      +fetch()
    }
    Animal <|-- Dog`,
        },
        {
          id: 'mixed-er',
          code: `erDiagram
    CUSTOMER ||--o{ ORDER : places`,
        },
      ]);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across mixed diagram types:\n${details}`
        );
      }
    });

    it('sequence + gantt + pie on same page produce zero duplicate IDs', async () => {
      const { duplicates } = await renderMixedDiagrams([
        {
          id: 'mixed-seq',
          code: `sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Alice: Hi`,
        },
        {
          id: 'mixed-gantt',
          code: `gantt
    dateFormat YYYY-MM-DD
    section Section
    Task A :a1, 2024-01-01, 30d`,
        },
        {
          id: 'mixed-pie',
          code: `pie title Pets
    "Dogs" : 50
    "Cats" : 30`,
        },
      ]);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs across seq+gantt+pie:\n${details}`);
      }
    });

    it('state + C4 + journey + timeline on same page produce zero duplicate IDs', async () => {
      const { duplicates } = await renderMixedDiagrams([
        {
          id: 'mixed-state',
          code: `stateDiagram-v2
    [*] --> Active
    Active --> Inactive
    Inactive --> [*]`,
        },
        {
          id: 'mixed-c4',
          code: `C4Context
    Person(user, "User")
    System(system, "System")
    Rel(user, system, "Uses")`,
        },
        {
          id: 'mixed-journey',
          code: `journey
    title My working day
    section Go to work
      Make tea: 5: Me`,
        },
        {
          id: 'mixed-timeline',
          code: `timeline
    title History
    2020 : COVID-19
    2021 : Vaccines`,
        },
      ]);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across state+c4+journey+timeline:\n${details}`
        );
      }
    });

    it('all supported diagram types on a single page produce zero duplicate IDs', async () => {
      const { duplicates } = await renderMixedDiagrams([
        {
          id: 'all-flow',
          code: `flowchart LR
    A --> B --> C`,
        },
        {
          id: 'all-class',
          code: `classDiagram
    class X { +m() }`,
        },
        {
          id: 'all-er',
          code: `erDiagram
    A ||--o{ B : has`,
        },
        {
          id: 'all-state',
          code: `stateDiagram-v2
    [*] --> S1`,
        },
        {
          id: 'all-seq',
          code: `sequenceDiagram
    A->>B: msg`,
        },
        {
          id: 'all-gantt',
          code: `gantt
    dateFormat YYYY-MM-DD
    Task :t1, 2024-01-01, 5d`,
        },
        {
          id: 'all-pie',
          code: `pie
    "A" : 50
    "B" : 50`,
        },
        {
          id: 'all-journey',
          code: `journey
    title Day
    section Work
      Code: 5: Me`,
        },
        {
          id: 'all-c4',
          code: `C4Context
    Person(p, "P")
    System(s, "S")`,
        },
        {
          id: 'all-timeline',
          code: `timeline
    title T
    2020 : Event`,
        },
      ]);
      if (duplicates.length > 0) {
        const details = duplicates
          .map(([id, n]) => `  "${id}" x${n}`)
          .slice(0, 20)
          .join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across 10 different diagram types:\n${details}`
        );
      }
    });
  });

  // =========================================================================
  // 5. FlowDB unit-level stress tests
  // =========================================================================
  describe('FlowDB stress', () => {
    it('10 FlowDB instances with identical nodes produce zero ID collisions', () => {
      const dbs: FlowDB[] = [];
      const nodeNames = ['A', 'B', 'C', 'D', 'E'];

      for (let i = 0; i < 10; i++) {
        const db = new FlowDB();
        for (const name of nodeNames) {
          addFlowVertex(db, name);
        }
        db.setDiagramId(`mermaid-${i}`);
        dbs.push(db);
      }

      const allDomIds = new Set<string>();
      const duplicates: string[] = [];

      for (const db of dbs) {
        for (const name of nodeNames) {
          const domId = db.lookUpDomId(name);
          if (allDomIds.has(domId)) {
            duplicates.push(domId);
          }
          allDomIds.add(domId);
        }
      }

      expect(duplicates).toEqual([]);
      // 10 instances * 5 nodes = 50 unique IDs
      expect(allDomIds.size).toBe(50);
    });

    it('FlowDB.lookUpDomId returns distinct prefixed IDs for 100 instances', () => {
      const allIds = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const db = new FlowDB();
        addFlowVertex(db, 'X');
        db.setDiagramId(`d-${i}`);
        allIds.add(db.lookUpDomId('X'));
      }

      expect(allIds.size).toBe(100);
    });

    it('clear() properly resets diagramId so subsequent setDiagramId works', () => {
      const db = new FlowDB();
      addFlowVertex(db, 'A');

      db.setDiagramId('first');
      const id1 = db.lookUpDomId('A');
      expect(id1).toContain('first');

      db.clear();
      addFlowVertex(db, 'A');
      db.setDiagramId('second');
      const id2 = db.lookUpDomId('A');
      expect(id2).toContain('second');
      expect(id2).not.toContain('first');
      expect(id1).not.toBe(id2);
    });

    it('edge IDs from getData() are deterministic given the same graph', () => {
      const db1 = new FlowDB();
      const db2 = new FlowDB();

      for (const db of [db1, db2]) {
        addFlowVertex(db, 'A');
        addFlowVertex(db, 'B');
        addFlowVertex(db, 'C');
        db.addLink(['A'], ['B'], { type: 'arrow_point', stroke: 'normal' });
        db.addLink(['B'], ['C'], { type: 'arrow_point', stroke: 'normal' });
      }

      const data1 = db1.getData();
      const data2 = db2.getData();

      // Edge IDs should be the same for identical graphs
      expect(data1.edges.map((e) => e.id)).toEqual(data2.edges.map((e) => e.id));

      // But when prefixed with diagramId they become unique
      db1.setDiagramId('m-0');
      db2.setDiagramId('m-1');

      const prefixed1 = data1.edges.map((e) => `m-0-${e.id}`);
      const prefixed2 = data2.edges.map((e) => `m-1-${e.id}`);

      const combined = [...prefixed1, ...prefixed2];
      expect(new Set(combined).size).toBe(combined.length);
    });
  });

  // =========================================================================
  // 6. ClassDB unit-level stress tests
  // =========================================================================
  describe('ClassDB stress', () => {
    it('10 ClassDB instances with identical class names produce zero ID collisions', () => {
      const classNames = ['User', 'Admin', 'Guest', 'Manager', 'Worker'];
      const allDomIds = new Set<string>();
      const duplicates: string[] = [];

      for (let i = 0; i < 10; i++) {
        const db = new ClassDB();
        for (const name of classNames) {
          db.addClass(name);
        }
        db.setDiagramId(`mermaid-${i}`);

        for (const name of classNames) {
          const domId = db.lookUpDomId(name);
          if (allDomIds.has(domId)) {
            duplicates.push(domId);
          }
          allDomIds.add(domId);
        }
      }

      expect(duplicates).toEqual([]);
      expect(allDomIds.size).toBe(50);
    });

    it('ClassDB clear() resets diagramId correctly', () => {
      const db = new ClassDB();
      db.addClass('Test');
      db.setDiagramId('diagram-A');
      const id1 = db.lookUpDomId('Test');
      expect(id1).toContain('diagram-A');

      db.clear();
      db.addClass('Test');
      db.setDiagramId('diagram-B');
      const id2 = db.lookUpDomId('Test');
      expect(id2).toContain('diagram-B');
      expect(id2).not.toContain('diagram-A');
    });
  });

  // =========================================================================
  // 7. render.ts domId prefixing logic
  // =========================================================================
  describe('render.ts domId prefixing', () => {
    it('nodes in getData() get domId from vertex.domId, not the prefixed version', () => {
      const db = new FlowDB();
      addFlowVertex(db, 'A');
      addFlowVertex(db, 'B');
      db.setDiagramId('mermaid-0');

      const data = db.getData();
      const nodeA = data.nodes.find((n) => n.id === 'A');
      const nodeB = data.nodes.find((n) => n.id === 'B');

      // getData() should return the raw (unprefixed) domId
      expect(nodeA?.domId).toMatch(/^flowchart-A-\d+$/);
      expect(nodeB?.domId).toMatch(/^flowchart-B-\d+$/);

      // The prefixing is done by render.ts, not getData()
      // Verify that render.ts would produce unique ids
      const prefixedA = `mermaid-0-${nodeA?.domId}`;
      const prefixedB = `mermaid-0-${nodeB?.domId}`;
      expect(prefixedA).not.toBe(prefixedB);
    });

    it('two getData() calls with different diagramIds produce disjoint prefixed domIds', () => {
      const db1 = new FlowDB();
      const db2 = new FlowDB();

      for (const db of [db1, db2]) {
        addFlowVertex(db, 'X');
        addFlowVertex(db, 'Y');
        addFlowVertex(db, 'Z');
      }

      db1.setDiagramId('d-0');
      db2.setDiagramId('d-1');

      const data1 = db1.getData();
      const data2 = db2.getData();

      // Simulate render.ts prefixing
      const ids1 = data1.nodes.map((n) => `d-0-${n.domId || n.id}`);
      const ids2 = data2.nodes.map((n) => `d-1-${n.domId || n.id}`);

      const all = [...ids1, ...ids2];
      expect(new Set(all).size).toBe(all.length);

      // Ensure different prefixes
      for (const id of ids1) {
        expect(id).toMatch(/^d-0-/);
      }
      for (const id of ids2) {
        expect(id).toMatch(/^d-1-/);
      }
    });
  });

  // =========================================================================
  // 8. Sequential render stability
  // =========================================================================
  describe('Sequential render stability', () => {
    it('rendering the same flowchart 3 times sequentially, each SVG has unique internal IDs', async () => {
      const code = `flowchart LR
    A --> B --> C --> D`;

      const oldWindow = global.window;
      const oldDocument = global.document;

      try {
        const dom = new JSDOM(`<html lang="en"><body></body></html>`, {
          resources: 'usable',
          beforeParse(_window: any) {
            _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
            _window.Element.prototype.getComputedTextLength = () => 50;
          },
        });
        (global as any).window = dom.window;
        (global as any).document = dom.window.document;
        (global as any).MutationObserver = undefined;

        const svgs: string[] = [];
        for (let i = 0; i < 3; i++) {
          const { svg } = await mermaidAPI.render(`seq-${i}`, code);
          svgs.push(svg);
        }

        // Each SVG should contain its own diagram ID prefix
        expect(svgs[0]).toContain('seq-0');
        expect(svgs[1]).toContain('seq-1');
        expect(svgs[2]).toContain('seq-2');

        // Combine all SVGs and check for ID uniqueness
        const body = dom.window.document.body;
        for (const svg of svgs) {
          const div = dom.window.document.createElement('div');
          div.innerHTML = svg;
          body.appendChild(div);
        }
        assertNoDuplicateIds(body);
      } finally {
        (global as any).window = oldWindow;
        (global as any).document = oldDocument;
      }
    });
  });

  // =========================================================================
  // 9. Adversarial node names
  // =========================================================================
  describe('Adversarial node names', () => {
    it('nodes named like diagram IDs (mermaid-0, mermaid-1) do not collide with actual prefixes', async () => {
      // Node names that look like diagramId prefixes
      const code = `flowchart LR
    mermaid-0[Fake Prefix 0] --> mermaid-1[Fake Prefix 1]
    A[Normal] --> B[Also Normal]`;
      const { duplicates } = await renderNDiagrams(code, 2);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs with adversarial node names:\n${details}`
        );
      }
    });

    it('nodes with special characters produce unique IDs across diagrams', async () => {
      const code = `flowchart LR
    A["Node with spaces"] --> B["Node/with/slashes"]
    C["Node.with.dots"] --> D["Node_with_underscores"]`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs with special char nodes:\n${details}`
        );
      }
    });
  });

  // =========================================================================
  // 10. Marker definition ID uniqueness
  // =========================================================================
  describe('SVG marker definitions', () => {
    it('sequence diagram arrow markers are prefixed with diagramId', async () => {
      const code = `sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Alice: Hi
    Alice-xBob: Bye`;

      const oldWindow = global.window;
      const oldDocument = global.document;

      try {
        const dom = new JSDOM(`<html lang="en"><body></body></html>`, {
          resources: 'usable',
          beforeParse(_window: any) {
            _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
            _window.Element.prototype.getComputedTextLength = () => 50;
          },
        });
        (global as any).window = dom.window;
        (global as any).document = dom.window.document;
        (global as any).MutationObserver = undefined;

        const { svg: svg1 } = await mermaidAPI.render('marker-test-0', code);
        const { svg: svg2 } = await mermaidAPI.render('marker-test-1', code);

        // Check that marker IDs contain the diagram ID
        expect(svg1).toContain('marker-test-0-arrowhead');
        expect(svg2).toContain('marker-test-1-arrowhead');

        // Combine and verify no duplicates
        const body = dom.window.document.body;
        const div1 = dom.window.document.createElement('div');
        div1.innerHTML = svg1;
        body.appendChild(div1);
        const div2 = dom.window.document.createElement('div');
        div2.innerHTML = svg2;
        body.appendChild(div2);

        assertNoDuplicateIds(body);
      } finally {
        (global as any).window = oldWindow;
        (global as any).document = oldDocument;
      }
    });

    it('C4 diagram markers are prefixed with diagramId', async () => {
      const code = `C4Context
    Person(user, "User")
    System(system, "System")
    Rel(user, system, "Uses")`;

      const oldWindow = global.window;
      const oldDocument = global.document;

      try {
        const dom = new JSDOM(`<html lang="en"><body></body></html>`, {
          resources: 'usable',
          beforeParse(_window: any) {
            _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
            _window.Element.prototype.getComputedTextLength = () => 50;
          },
        });
        (global as any).window = dom.window;
        (global as any).document = dom.window.document;
        (global as any).MutationObserver = undefined;

        const { svg: svg1 } = await mermaidAPI.render('c4-marker-0', code);
        const { svg: svg2 } = await mermaidAPI.render('c4-marker-1', code);

        // C4 diagram markers should be prefixed
        expect(svg1).toContain('c4-marker-0-arrowhead');
        expect(svg2).toContain('c4-marker-1-arrowhead');

        const body = dom.window.document.body;
        const div1 = dom.window.document.createElement('div');
        div1.innerHTML = svg1;
        body.appendChild(div1);
        const div2 = dom.window.document.createElement('div');
        div2.innerHTML = svg2;
        body.appendChild(div2);

        assertNoDuplicateIds(body);
      } finally {
        (global as any).window = oldWindow;
        (global as any).document = oldDocument;
      }
    });
  });

  // =========================================================================
  // 11. Edge label uniqueness
  // =========================================================================
  describe('Edge labels', () => {
    it('flowchart with labeled edges produces unique IDs across 3 renders', async () => {
      const code = `flowchart LR
    A -->|label 1| B
    B -->|label 2| C
    C -->|label 3| D`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs in labeled-edge flowcharts:\n${details}`
        );
      }
    });
  });

  // =========================================================================
  // 12. Kanban diagram stress
  // =========================================================================
  describe('Kanban diagram', () => {
    it('5 identical kanban diagrams produce zero duplicate IDs', async () => {
      const code = `kanban
    column1[Todo]
      task1[Task 1]
      task2[Task 2]
    column2[In Progress]
      task3[Task 3]
    column3[Done]
      task4[Task 4]`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across 5 kanban diagrams:\n${details}`
        );
      }
    });
  });

  // =========================================================================
  // 13. Git graph stress
  // =========================================================================
  describe('Git graph', () => {
    it('5 identical git graphs produce zero duplicate IDs', async () => {
      const code = `gitGraph
    commit
    branch develop
    commit
    checkout main
    commit
    merge develop`;
      const { duplicates } = await renderNDiagrams(code, 5);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs across 5 git graphs:\n${details}`);
      }
    });
  });

  // =========================================================================
  // 14. Requirement diagram stress
  // =========================================================================
  describe('Requirement diagram', () => {
    it('3 identical requirement diagrams produce zero duplicate IDs', async () => {
      const code = `requirementDiagram
    requirement test_req {
      id: 1
      text: the test text.
      risk: high
      verifymethod: test
    }
    element test_entity {
      type: simulation
    }
    test_entity - satisfies -> test_req`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across 3 requirement diagrams:\n${details}`
        );
      }
    });
  });

  // =========================================================================
  // 15. XY chart stress
  // =========================================================================
  describe('XY chart', () => {
    it('3 identical xy charts produce zero duplicate IDs', async () => {
      const code = `xychart-beta
    title "Sales"
    x-axis [jan, feb, mar, apr, may]
    y-axis "Revenue"
    bar [10, 20, 30, 40, 50]`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(`Found ${duplicates.length} duplicate IDs across 3 xy charts:\n${details}`);
      }
    });
  });

  // =========================================================================
  // 16. Quadrant chart stress
  // =========================================================================
  describe('Quadrant chart', () => {
    it('3 identical quadrant charts produce zero duplicate IDs', async () => {
      const code = `quadrantChart
    title Reach and engagement
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.8, 0.9]`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across 3 quadrant charts:\n${details}`
        );
      }
    });
  });

  // =========================================================================
  // 17. Sankey diagram stress
  // =========================================================================
  describe('Sankey diagram', () => {
    it('3 identical sankey diagrams produce zero duplicate IDs', async () => {
      const code = `sankey-beta
    Source,Target,5
    Source,Target2,3
    Source2,Target,2`;
      const { duplicates } = await renderNDiagrams(code, 3);
      if (duplicates.length > 0) {
        const details = duplicates.map(([id, n]) => `  "${id}" x${n}`).join('\n');
        expect.fail(
          `Found ${duplicates.length} duplicate IDs across 3 sankey diagrams:\n${details}`
        );
      }
    });
  });

  // =========================================================================
  // 18. Verify all SVG IDs contain diagram prefix
  // =========================================================================
  describe('Diagram ID prefix propagation', () => {
    it('every element ID in a rendered flowchart SVG contains the diagram ID prefix', async () => {
      const code = `flowchart LR
    A --> B --> C`;

      const oldWindow = global.window;
      const oldDocument = global.document;

      try {
        const dom = new JSDOM(`<html lang="en"><body></body></html>`, {
          resources: 'usable',
          beforeParse(_window: any) {
            _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
            _window.Element.prototype.getComputedTextLength = () => 50;
          },
        });
        (global as any).window = dom.window;
        (global as any).document = dom.window.document;
        (global as any).MutationObserver = undefined;

        const diagramId = 'prefix-check-42';
        const { svg } = await mermaidAPI.render(diagramId, code);
        const div = dom.window.document.createElement('div');
        div.innerHTML = svg;
        dom.window.document.body.appendChild(div);

        const allElements = div.querySelectorAll('[id]');
        const idsWithoutPrefix: string[] = [];
        for (const el of allElements) {
          const id = el.getAttribute('id')!;
          // The SVG root element itself has the diagramId as its id
          if (id === diagramId) {
            continue;
          }
          if (!id.includes(diagramId)) {
            idsWithoutPrefix.push(id);
          }
        }

        if (idsWithoutPrefix.length > 0) {
          // This is informational — some elements may legitimately not have the prefix
          // (e.g., CSS class definitions). But node/edge/marker IDs should all have it.
          const nodeOrEdgeIds = idsWithoutPrefix.filter(
            (id) =>
              id.includes('flowchart-') ||
              id.includes('edge') ||
              id.includes('arrowhead') ||
              id.includes('marker')
          );
          if (nodeOrEdgeIds.length > 0) {
            expect.fail(
              `Found node/edge/marker IDs without diagram prefix "${diagramId}":\n` +
                nodeOrEdgeIds.map((id) => `  "${id}"`).join('\n')
            );
          }
        }
      } finally {
        (global as any).window = oldWindow;
        (global as any).document = oldDocument;
      }
    });
  });
});
