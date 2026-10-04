/**
 * Element-mapping tests for the agentflow parser (v0.8.1).
 *
 * Verifies that the JISON action blocks populate `elementMappings` via the
 * `addVertexMapping` / `addEdgeMapping` / `addSubgraphMapping` /
 * `addConnectorMapping` hooks, that the reported positions land on the
 * right line numbers, and that `setFrontmatterLineOffset` shifts positions
 * into original-source space.
 *
 * Corresponding infrastructure lives in `agentflowDb.ts` and the grammar
 * action blocks in `agentflow.jison`.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow element mappings', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  // ──────────────────────────────────────────────────────────────
  // supportsInlinePositions presence
  // ──────────────────────────────────────────────────────────────

  describe('DB surface', () => {
    it('opts into source-faithful parsing so Diagram.ts keeps comments and offsets', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      expect(db.preserveCommentsWhenParsing).toBe(true);
      expect(typeof db.setFrontmatterLineOffset).toBe('function');
    });

    it('starts with an empty element-mappings list', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      expect(db.getElementMappings()).toHaveLength(0);
      expect(db.getMappingStats().totalElements).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Vertex positions
  // ──────────────────────────────────────────────────────────────

  describe('vertex positions', () => {
    it('captures a position for a plain labelled vertex', () => {
      agentflow.parser.parse(`agentflow-beta TB
  a["Alpha"]
  b --> a`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const a = db.getElementById('a');
      expect(a).toBeDefined();
      expect(a!.type).toBe('vertex');
      // `a["Alpha"]` lives on source line 2.
      expect(a!.position.startLine).toBe(2);
      expect(a!.position.endLine).toBe(2);
    });

    it('captures vertices for inline shapes', () => {
      agentflow.parser.parse(`agentflow-beta TB
  a["sq"]
  c{"diamond"}
  d[/"trap"/]
  f --> a`);
      const db = agentflow.parser.yy as AgentFlowDB;
      for (const id of ['a', 'c', 'd']) {
        const m = db.getElementById(id);
        expect(m, `expected mapping for ${id}`).toBeDefined();
        expect(m!.type).toBe('vertex');
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Edge positions
  // ──────────────────────────────────────────────────────────────

  describe('edge positions', () => {
    it('captures a position for an edge statement', () => {
      agentflow.parser.parse(`agentflow-beta TB
  a --> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const edges = db.getElementMappings().filter((m) => m.type === 'edge');
      expect(edges.length).toBeGreaterThanOrEqual(1);
      // Edge lives on source line 2.
      expect(edges.some((e) => e.position.startLine === 2)).toBe(true);
    });

    it('captures separate mappings for sequential edge statements', () => {
      agentflow.parser.parse(`agentflow-beta TB
  a --> b
  b --> c
  c --> d`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const edges = db.getElementMappings().filter((m) => m.type === 'edge');
      expect(edges).toHaveLength(3);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Subgraph / container positions
  // ──────────────────────────────────────────────────────────────

  describe('container positions', () => {
    it('captures a position spanning from keyword to end for a flow container', () => {
      agentflow.parser.parse(`agentflow-beta TB
  flow pipeline["Pipeline"]
    a --> b
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const pipeline = db.getElementById('pipeline');
      expect(pipeline).toBeDefined();
      expect(pipeline!.type).toBe('subgraph');
      // Container opener is line 2, `end` is line 4.
      expect(pipeline!.position.startLine).toBe(2);
      expect(pipeline!.position.endLine).toBe(4);
    });

    it('captures positions for nested flow containers', () => {
      agentflow.parser.parse(`agentflow-beta TB
  flow outer["Outer"]
    flow inner["Inner"]
      n1 --> n2
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      for (const id of ['outer', 'inner']) {
        const m = db.getElementById(id);
        expect(m, `expected subgraph mapping for ${id}`).toBeDefined();
        expect(m!.type).toBe('subgraph');
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Frontmatter offset
  // ──────────────────────────────────────────────────────────────

  describe('frontmatter offset', () => {
    it('shifts positions by the frontmatter line offset', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      // Simulate the preprocessor telling the DB about 3 frontmatter lines.
      db.setFrontmatterLineOffset(3);
      agentflow.parser.parse(`agentflow-beta TB
  a --> b`);
      const a = db.getElementById('a');
      expect(a).toBeDefined();
      // Post-frontmatter `a` is on parse line 2, which maps to source line 5.
      expect(a!.position.startLine).toBe(5);
      expect(a!.position.endLine).toBe(5);
    });

    it('reports un-shifted positions when no frontmatter offset is set', () => {
      agentflow.parser.parse(`agentflow-beta TB
  a --> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const a = db.getElementById('a');
      expect(a!.position.startLine).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Lookup helpers
  // ──────────────────────────────────────────────────────────────

  describe('lookup helpers', () => {
    it('getElementsOnLine returns all mappings that intersect a given line', () => {
      agentflow.parser.parse(`agentflow-beta TB
  a --> b
  c --> d`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const onLine2 = db.getElementsOnLine(2);
      // Line 2 covers `a`, `b`, and the edge between them.
      expect(onLine2.length).toBeGreaterThanOrEqual(2);
      expect(onLine2.some((m) => m.type === 'vertex' && m.id === 'a')).toBe(true);
    });

    it('getElementAtPosition prefers the innermost span', () => {
      agentflow.parser.parse(`agentflow-beta TB
  flow pipeline["Pipeline"]
    inner --> next
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      // A position inside the pipeline container but on the `inner` vertex
      // should return the vertex, not the enclosing container.
      const inner = db.getElementById('inner');
      expect(inner).toBeDefined();
      const hit = db.getElementAtPosition(inner!.position.startLine, inner!.position.startColumn);
      expect(hit?.id).toBe('inner');
      expect(hit?.type).toBe('vertex');
    });

    it('getMappingStats reports counts per statement type', () => {
      agentflow.parser.parse(`agentflow-beta TB
  flow p["P"]
    a --> b
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const stats = db.getMappingStats();
      expect(stats.vertices).toBeGreaterThanOrEqual(2); // a, b
      expect(stats.edges).toBeGreaterThanOrEqual(1);
      expect(stats.subgraphs).toBe(1);
      expect(stats.totalElements).toBe(
        stats.vertices + stats.edges + stats.subgraphs + stats.connectors + stats.attachments
      );
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Reset behaviour
  // ──────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('clear() drops element mappings and the frontmatter offset', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      db.setFrontmatterLineOffset(4);
      agentflow.parser.parse(`agentflow-beta TB
  a --> b`);
      expect(db.getElementMappings().length).toBeGreaterThan(0);
      expect(db.getElementById('a')!.position.startLine).toBe(6); // 2 + offset 4

      db.clear();
      expect(db.getElementMappings()).toHaveLength(0);

      // Re-parse on the SAME instance. Constructing a fresh AgentFlowDB here
      // would have passed whether or not clear() reset the offset.
      db.setGen('gen-2');
      agentflow.parser.parse(`agentflow-beta TB
  c --> d`);
      expect(db.getElementById('c')!.position.startLine).toBe(2);
    });
  });
});
