/**
 * Test current parser feature coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import flowParser from './flowParser.ts';
import { FlowDB } from '../flowDb.js';

describe('Parser Feature Coverage', () => {
  let flowDb: FlowDB;

  beforeEach(() => {
    flowDb = new FlowDB();
    flowParser.yy = flowDb;
    flowDb.clear();
  });

  describe('Node Shapes', () => {
    it('should parse square node A[Square]', () => {
      const result = flowParser.parse('graph TD\nA[Square]');
      expect(result).toBeDefined();
      
      const vertices = flowDb.getVertices();
      expect(vertices.has('A')).toBe(true);
      
      const nodeA = vertices.get('A');
      console.log('Node A:', nodeA);
      // Should have square shape and text "Square"
    });

    it('should parse round node B(Round)', () => {
      const result = flowParser.parse('graph TD\nB(Round)');
      expect(result).toBeDefined();
      
      const vertices = flowDb.getVertices();
      expect(vertices.has('B')).toBe(true);
      
      const nodeB = vertices.get('B');
      console.log('Node B:', nodeB);
      // Should have round shape and text "Round"
    });

    it('should parse diamond node C{Diamond}', () => {
      const result = flowParser.parse('graph TD\nC{Diamond}');
      expect(result).toBeDefined();
      
      const vertices = flowDb.getVertices();
      expect(vertices.has('C')).toBe(true);
      
      const nodeC = vertices.get('C');
      console.log('Node C:', nodeC);
      // Should have diamond shape and text "Diamond"
    });
  });

  describe('Subgraphs', () => {
    it('should parse basic subgraph', () => {
      const result = flowParser.parse(`graph TD
        subgraph test
          A --> B
        end`);
      expect(result).toBeDefined();
      
      const subgraphs = flowDb.getSubGraphs();
      console.log('Subgraphs:', subgraphs);
      expect(subgraphs.length).toBe(1);
      
      const vertices = flowDb.getVertices();
      expect(vertices.has('A')).toBe(true);
      expect(vertices.has('B')).toBe(true);
    });
  });

  describe('Styling', () => {
    it('should parse style statement', () => {
      const result = flowParser.parse(`graph TD
        A --> B
        style A fill:#f9f,stroke:#333,stroke-width:4px`);
      expect(result).toBeDefined();
      
      const vertices = flowDb.getVertices();
      const nodeA = vertices.get('A');
      console.log('Styled Node A:', nodeA);
      // Should have styling applied
    });
  });

  describe('Complex Patterns', () => {
    it('should parse multiple statements', () => {
      const result = flowParser.parse(`graph TD
        A --> B
        B --> C
        C --> D`);
      expect(result).toBeDefined();
      
      const vertices = flowDb.getVertices();
      const edges = flowDb.getEdges();
      
      expect(vertices.size).toBe(4);
      expect(edges.length).toBe(3);
      
      console.log('Vertices:', Array.from(vertices.keys()));
      console.log('Edges:', edges.map(e => `${e.start} -> ${e.end}`));
    });
  });
});
