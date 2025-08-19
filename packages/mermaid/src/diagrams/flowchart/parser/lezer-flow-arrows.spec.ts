/**
 * Lezer-based flowchart parser tests for arrow patterns
 * Migrated from flow-arrows.spec.js to test Lezer parser compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import flowParser from './flowParser.ts';
import { FlowDB } from '../flowDb.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('[Lezer Arrows] when parsing', () => {
  beforeEach(() => {
    flowParser.parser.yy = new FlowDB();
    flowParser.parser.yy.clear();
  });

  it('should handle a nodes and edges', () => {
    const result = flowParser.parser.parse('graph TD;\nA-->B;');

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it("should handle angle bracket ' > ' as direction LR", () => {
    const result = flowParser.parser.parse('graph >;A-->B;');

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();
    const direction = flowParser.parser.yy.getDirection();

    expect(direction).toBe('LR');

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it("should handle angle bracket ' < ' as direction RL", () => {
    const result = flowParser.parser.parse('graph <;A-->B;');

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();
    const direction = flowParser.parser.yy.getDirection();

    expect(direction).toBe('RL');

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it("should handle caret ' ^ ' as direction BT", () => {
    const result = flowParser.parser.parse('graph ^;A-->B;');

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();
    const direction = flowParser.parser.yy.getDirection();

    expect(direction).toBe('BT');

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].length).toBe(1);
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it("should handle lower-case 'v' as direction TB", () => {
    const result = flowParser.parser.parse('graph v;A-->B;');

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();
    const direction = flowParser.parser.yy.getDirection();

    expect(direction).toBe('TB');

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it('should handle a nodes and edges and a space between link and node', () => {
    const result = flowParser.parser.parse('graph TD;A --> B;');

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it('should handle a nodes and edges, a space between link and node and each line ending without semicolon', () => {
    const result = flowParser.parser.parse('graph TD\nA --> B\n style e red');

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  it('should handle statements ending without semicolon', () => {
    const result = flowParser.parser.parse('graph TD\nA-->B\nB-->C');

    const vertices = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vertices.get('A')?.id).toBe('A');
    expect(vertices.get('B')?.id).toBe('B');
    expect(edges.length).toBe(2);
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
  });

  describe('it should handle multi directional arrows', () => {
    describe('point', () => {
      it('should handle double edged nodes and edges', () => {
        const result = flowParser.parser.parse('graph TD;\nA<-->B;');

        const vertices = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vertices.get('A')?.id).toBe('A');
        expect(vertices.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes with text', () => {
        const result = flowParser.parser.parse('graph TD;\nA<-- text -->B;');

        const vertices = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vertices.get('A')?.id).toBe('A');
        expect(vertices.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes and edges on thick arrows', () => {
        const result = flowParser.parser.parse('graph TD;\nA<==>B;');

        const vertices = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vertices.get('A')?.id).toBe('A');
        expect(vertices.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes with text on thick arrows', () => {
        const result = flowParser.parser.parse('graph TD;\nA<== text ==>B;');

        const vertices = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vertices.get('A')?.id).toBe('A');
        expect(vertices.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes and edges on dotted arrows', () => {
        const result = flowParser.parser.parse('graph TD;\nA<-.->B;');

        const vertices = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vertices.get('A')?.id).toBe('A');
        expect(vertices.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(1);
      });

      it('should handle double edged nodes with text on dotted arrows', () => {
        const result = flowParser.parser.parse('graph TD;\nA<-. text .->B;');

        const vertices = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vertices.get('A')?.id).toBe('A');
        expect(vertices.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(1);
      });
    });
  });
});
