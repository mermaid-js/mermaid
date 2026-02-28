/**
 * Tests that internal SVG element IDs are unique when multiple diagrams
 * share a page, preventing url(#...) cross-references and WCAG 4.1.1 failures.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlowDB } from '../diagrams/flowchart/flowDb.js';
import { ClassDB } from '../diagrams/class/classDb.js';
import { insertEdge } from './rendering-elements/edges.js';

function addFlowVertex(db: FlowDB, id: string) {
  db.addVertex(id, { text: id, type: 'text' } as any, undefined as any, [], [], '', {}, undefined);
}

describe('Unique DOM element IDs', () => {
  describe('FlowDB.setDiagramId + lookUpDomId', () => {
    let db: FlowDB;
    beforeEach(() => {
      db = new FlowDB();
      addFlowVertex(db, 'A');
      addFlowVertex(db, 'B');
    });

    it('always prefixes domId with diagramId', () => {
      db.setDiagramId('mermaid-0');
      expect(db.lookUpDomId('A')).toMatch(/^mermaid-0-flowchart-A-\d+$/);
    });

    it('produces unique domIds for same node across different diagram IDs', () => {
      const db2 = new FlowDB();
      addFlowVertex(db2, 'A');

      db.setDiagramId('mermaid-0');
      db2.setDiagramId('mermaid-1');

      expect(db.lookUpDomId('A')).not.toBe(db2.lookUpDomId('A'));
      expect(db.lookUpDomId('A')).toContain('mermaid-0');
      expect(db2.lookUpDomId('A')).toContain('mermaid-1');
    });

    it('resets diagramId on clear()', () => {
      db.setDiagramId('mermaid-0');
      db.clear();
      addFlowVertex(db, 'A');
      // After clear, diagramId is empty so no prefix is applied
      expect(db.lookUpDomId('A')).not.toContain('mermaid-0');
    });
  });

  describe('ClassDB.setDiagramId + lookUpDomId', () => {
    let db: ClassDB;
    beforeEach(() => {
      db = new ClassDB();
      db.addClass('User');
      db.addClass('Admin');
    });

    it('always prefixes domId with diagramId', () => {
      db.setDiagramId('mermaid-0');
      expect(db.lookUpDomId('User')).toMatch(/^mermaid-0-classId-User-\d+$/);
    });

    it('produces unique domIds for same class across different diagram IDs', () => {
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
      // After clear, diagramId is empty so no prefix is applied
      expect(db.lookUpDomId('User')).not.toContain('mermaid-0');
    });
  });

  describe('FlowDB.lookUpDomId fallback prefixing', () => {
    it('prefixes the fallback ID for unknown vertices when diagramId is set', () => {
      const db = new FlowDB();
      addFlowVertex(db, 'A');
      db.setDiagramId('mermaid-0');

      // 'nonexistent' is not in the vertex map, so lookUpDomId returns the fallback
      const result = db.lookUpDomId('nonexistent');
      expect(result).toBe('mermaid-0-nonexistent');
    });

    it('two diagrams with subgraph-like IDs not in vertex map produce unique fallbacks', () => {
      const db1 = new FlowDB();
      const db2 = new FlowDB();

      db1.setDiagramId('mermaid-0');
      db2.setDiagramId('mermaid-1');

      // These simulate looking up subgraph/cluster IDs that aren't in the vertex map
      expect(db1.lookUpDomId('subgraph1')).toBe('mermaid-0-subgraph1');
      expect(db2.lookUpDomId('subgraph1')).toBe('mermaid-1-subgraph1');
      expect(db1.lookUpDomId('subgraph1')).not.toBe(db2.lookUpDomId('subgraph1'));
    });
  });

  describe('Defensive guards', () => {
    it('insertEdge throws when diagramId is missing', () => {
      const edge = { id: 'test-edge', arrowTypeStart: '', arrowTypeEnd: '' };
      expect(() => {
        insertEdge(null, edge, null, 'flowchart', null, null, undefined);
      }).toThrow('insertEdge: missing diagramId');
    });

    it('insertEdge throws when diagramId is empty string', () => {
      const edge = { id: 'test-edge', arrowTypeStart: '', arrowTypeEnd: '' };
      expect(() => {
        insertEdge(null, edge, null, 'flowchart', null, null, '');
      }).toThrow('insertEdge: missing diagramId');
    });
  });

  describe('Full collision simulation', () => {
    it('two flowcharts with identical nodes A->B->C produce zero duplicate IDs', () => {
      const db1 = new FlowDB();
      const db2 = new FlowDB();

      for (const db of [db1, db2]) {
        addFlowVertex(db, 'A');
        addFlowVertex(db, 'B');
        addFlowVertex(db, 'C');
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

      const allIds = [
        ...data1.nodes.map((n) => n.domId),
        ...data2.nodes.map((n) => n.domId),
        ...data1.edges.map((e) => `mermaid-0-${e.id}`),
        ...data2.edges.map((e) => `mermaid-1-${e.id}`),
      ];

      expect(new Set(allIds).size).toBe(allIds.length);
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

      const ids = [
        db1.lookUpDomId('User'),
        db1.lookUpDomId('Admin'),
        db2.lookUpDomId('User'),
        db2.lookUpDomId('Admin'),
      ];
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
