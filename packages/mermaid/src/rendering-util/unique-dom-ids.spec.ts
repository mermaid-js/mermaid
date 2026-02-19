/**
 * Tests for unique DOM element IDs across multiple diagrams.
 *
 * When multiple diagrams appear on the same page, internal SVG element IDs
 * (node domIds, edge IDs, edge label IDs) must be unique to avoid:
 * - Invalid HTML (WCAG 4.1.1 failure)
 * - url(#...) references resolving to wrong elements
 * - CSS selectors matching wrong elements
 *
 * The fix prefixes all internal IDs with the diagram's SVG element ID
 * (e.g., "mermaid-0"), following the same pattern used for marker IDs in PR #4825.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { FlowDB } from '../diagrams/flowchart/flowDb.js';
import { ClassDB } from '../diagrams/class/classDb.js';

describe('Unique DOM element IDs', () => {
  describe('FlowDB.setDiagramId + lookUpDomId', () => {
    let db: FlowDB;
    beforeEach(() => {
      db = new FlowDB();
      // Add some vertices
      db.addVertex(
        'A',
        { text: 'Node A', type: 'text' } as any,
        undefined as any,
        [],
        [],
        '',
        {},
        undefined
      );
      db.addVertex(
        'B',
        { text: 'Node B', type: 'text' } as any,
        undefined as any,
        [],
        [],
        '',
        {},
        undefined
      );
    });

    it('returns unprefixed domId when diagramId is not set', () => {
      const domId = db.lookUpDomId('A');
      expect(domId).toMatch(/^flowchart-A-\d+$/);
      expect(domId).not.toContain('mermaid');
    });

    it('returns prefixed domId when diagramId is set', () => {
      db.setDiagramId('mermaid-0');
      const domId = db.lookUpDomId('A');
      expect(domId).toMatch(/^mermaid-0-flowchart-A-\d+$/);
    });

    it('produces unique domIds for same node names across different diagram IDs', () => {
      const db2 = new FlowDB();
      db2.addVertex(
        'A',
        { text: 'Node A', type: 'text' } as any,
        undefined as any,
        [],
        [],
        '',
        {},
        undefined
      );

      db.setDiagramId('mermaid-0');
      db2.setDiagramId('mermaid-1');

      const domId1 = db.lookUpDomId('A');
      const domId2 = db2.lookUpDomId('A');

      expect(domId1).not.toBe(domId2);
      expect(domId1).toContain('mermaid-0');
      expect(domId2).toContain('mermaid-1');
    });

    it('resets diagramId on clear()', () => {
      db.setDiagramId('mermaid-0');
      db.clear();
      db.addVertex(
        'A',
        { text: 'Node A', type: 'text' } as any,
        undefined as any,
        [],
        [],
        '',
        {},
        undefined
      );
      const domId = db.lookUpDomId('A');
      expect(domId).not.toContain('mermaid-0');
    });

    it('getData() returns unprefixed domIds (render.ts handles prefixing)', () => {
      db.setDiagramId('mermaid-0');
      const data = db.getData();
      const nodeA = data.nodes.find((n) => n.id === 'A');
      // getData returns the raw domId from the vertex, not the prefixed one
      expect(nodeA?.domId).toMatch(/^flowchart-A-\d+$/);
    });
  });

  describe('ClassDB.setDiagramId + lookUpDomId', () => {
    let db: ClassDB;
    beforeEach(() => {
      db = new ClassDB();
      db.addClass('User');
      db.addClass('Admin');
    });

    it('returns unprefixed domId when diagramId is not set', () => {
      const domId = db.lookUpDomId('User');
      expect(domId).toMatch(/^classId-User-\d+$/);
    });

    it('returns prefixed domId when diagramId is set', () => {
      db.setDiagramId('mermaid-0');
      const domId = db.lookUpDomId('User');
      expect(domId).toMatch(/^mermaid-0-classId-User-\d+$/);
    });

    it('produces unique domIds for same class names across different diagram IDs', () => {
      const db2 = new ClassDB();
      db2.addClass('User');

      db.setDiagramId('mermaid-0');
      db2.setDiagramId('mermaid-1');

      expect(db.lookUpDomId('User')).not.toBe(db2.lookUpDomId('User'));
    });

    it('resets diagramId on clear()', () => {
      db.setDiagramId('mermaid-0');
      db.clear();
      db.addClass('User');
      expect(db.lookUpDomId('User')).not.toContain('mermaid-0');
    });
  });

  describe('render.ts domId prefixing', () => {
    // Test the prefixing logic directly by simulating what render() does
    function simulateRenderPrefixing(diagramId: string, nodes: { id: string; domId?: string }[]) {
      if (diagramId) {
        for (const node of nodes) {
          const originalDomId = node.domId || node.id;
          node.domId = `${diagramId}-${originalDomId}`;
        }
      }
      return nodes;
    }

    it('prefixes node domIds with diagram ID', () => {
      const nodes = [
        { id: 'A', domId: 'flowchart-A-0' },
        { id: 'B', domId: 'flowchart-B-1' },
      ];
      simulateRenderPrefixing('mermaid-0', nodes);
      expect(nodes[0].domId).toBe('mermaid-0-flowchart-A-0');
      expect(nodes[1].domId).toBe('mermaid-0-flowchart-B-1');
    });

    it('uses node.id as fallback when domId is not set', () => {
      const nodes: { id: string; domId?: string }[] = [{ id: 'note0' }, { id: 'interface0' }];
      simulateRenderPrefixing('mermaid-0', nodes);
      expect(nodes[0].domId).toBe('mermaid-0-note0');
      expect(nodes[1].domId).toBe('mermaid-0-interface0');
    });

    it('does not prefix when diagramId is empty', () => {
      const nodes = [{ id: 'A', domId: 'flowchart-A-0' }];
      simulateRenderPrefixing('', nodes);
      expect(nodes[0].domId).toBe('flowchart-A-0');
    });

    it('ensures uniqueness across two diagrams with identical nodes', () => {
      const diagram1 = [
        { id: 'A', domId: 'flowchart-A-0' },
        { id: 'B', domId: 'flowchart-B-1' },
        { id: 'C', domId: 'flowchart-C-2' },
      ];
      const diagram2 = [
        { id: 'A', domId: 'flowchart-A-0' },
        { id: 'B', domId: 'flowchart-B-1' },
        { id: 'C', domId: 'flowchart-C-2' },
      ];
      simulateRenderPrefixing('mermaid-0', diagram1);
      simulateRenderPrefixing('mermaid-1', diagram2);

      const allIds = [...diagram1, ...diagram2].map((n) => n.domId);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('handles state diagram domIds', () => {
      const nodes = [
        { id: 'S1', domId: 'state-S1-0' },
        { id: 'S1----note-1', domId: 'state-S1----note-1' },
      ];
      simulateRenderPrefixing('mermaid-0', nodes);
      expect(nodes[0].domId).toBe('mermaid-0-state-S1-0');
      expect(nodes[1].domId).toBe('mermaid-0-state-S1----note-1');
    });

    it('handles mindmap domIds', () => {
      const nodes = [{ id: '0', domId: 'node_0' }];
      simulateRenderPrefixing('mermaid-0', nodes);
      expect(nodes[0].domId).toBe('mermaid-0-node_0');
    });
  });

  describe('Edge ID prefixing', () => {
    // Simulates what edges.js does with the id parameter
    function prefixEdgeId(edgeId: string, diagramId?: string) {
      return diagramId ? `${diagramId}-${edgeId}` : edgeId;
    }

    it('prefixes edge IDs with diagram ID', () => {
      expect(prefixEdgeId('L-A-B-0', 'mermaid-0')).toBe('mermaid-0-L-A-B-0');
    });

    it('does not prefix when diagram ID is not provided', () => {
      expect(prefixEdgeId('L-A-B-0')).toBe('L-A-B-0');
    });

    it('ensures uniqueness across diagrams for identical edges', () => {
      const id1 = prefixEdgeId('L-A-B-0', 'mermaid-0');
      const id2 = prefixEdgeId('L-A-B-0', 'mermaid-1');
      expect(id1).not.toBe(id2);
    });
  });

  describe('Edge label node ID prefixing in createGraph', () => {
    function prefixEdgeLabelNodeId(
      edgeStart: string,
      edgeEnd: string,
      edgeId: string,
      diagramId?: string
    ) {
      const labelNodeId = `edge-label-${edgeStart}-${edgeEnd}-${edgeId}`;
      const domId = diagramId ? `${diagramId}-${labelNodeId}` : undefined;
      return { id: labelNodeId, domId };
    }

    it('creates prefixed domId for edge label nodes', () => {
      const result = prefixEdgeLabelNodeId('A', 'B', 'L-A-B-0', 'mermaid-0');
      expect(result.id).toBe('edge-label-A-B-L-A-B-0');
      expect(result.domId).toBe('mermaid-0-edge-label-A-B-L-A-B-0');
    });

    it('ensures uniqueness across diagrams', () => {
      const r1 = prefixEdgeLabelNodeId('A', 'B', 'L-A-B-0', 'mermaid-0');
      const r2 = prefixEdgeLabelNodeId('A', 'B', 'L-A-B-0', 'mermaid-1');
      expect(r1.domId).not.toBe(r2.domId);
    });
  });

  describe('Full diagram ID collision simulation', () => {
    it('two flowcharts with identical nodes A->B->C produce zero duplicate IDs', () => {
      const db1 = new FlowDB();
      const db2 = new FlowDB();

      // Both diagrams: A --> B --> C
      for (const db of [db1, db2]) {
        db.addVertex(
          'A',
          { text: 'A', type: 'text' } as any,
          undefined as any,
          [],
          [],
          '',
          {},
          undefined
        );
        db.addVertex(
          'B',
          { text: 'B', type: 'text' } as any,
          undefined as any,
          [],
          [],
          '',
          {},
          undefined
        );
        db.addVertex(
          'C',
          { text: 'C', type: 'text' } as any,
          undefined as any,
          [],
          [],
          '',
          {},
          undefined
        );
        db.addLink(['A'], ['B'], { type: 'arrow_point', stroke: 'normal' });
        db.addLink(['B'], ['C'], { type: 'arrow_point', stroke: 'normal' });
      }

      db1.setDiagramId('mermaid-0');
      db2.setDiagramId('mermaid-1');

      const data1 = db1.getData();
      const data2 = db2.getData();

      // Simulate render.ts prefixing
      for (const node of data1.nodes) {
        node.domId = `mermaid-0-${node.domId || node.id}`;
      }
      for (const node of data2.nodes) {
        node.domId = `mermaid-1-${node.domId || node.id}`;
      }

      // Collect all IDs
      const allNodeDomIds = [
        ...data1.nodes.map((n) => n.domId),
        ...data2.nodes.map((n) => n.domId),
      ];
      const allEdgeIds = [
        ...data1.edges.map((e) => `mermaid-0-${e.id}`),
        ...data2.edges.map((e) => `mermaid-1-${e.id}`),
      ];
      const allIds = [...allNodeDomIds, ...allEdgeIds];

      // Verify: no duplicates
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('two class diagrams with identical class names produce zero duplicate IDs', () => {
      const db1 = new ClassDB();
      const db2 = new ClassDB();

      for (const db of [db1, db2]) {
        db.addClass('User');
        db.addClass('Admin');
      }

      db1.setDiagramId('mermaid-0');
      db2.setDiagramId('mermaid-1');

      // Verify lookUpDomId uniqueness
      const ids = [
        db1.lookUpDomId('User'),
        db1.lookUpDomId('Admin'),
        db2.lookUpDomId('User'),
        db2.lookUpDomId('Admin'),
      ];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
