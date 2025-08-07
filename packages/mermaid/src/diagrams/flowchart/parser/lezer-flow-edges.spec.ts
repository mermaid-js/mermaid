/**
 * Lezer-based flowchart parser tests for edge handling
 * Migrated from flow-edges.spec.js to test Lezer parser compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import flowParser from './flowParser.ts';
import { FlowDB } from '../flowDb.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

const keywords = [
  'graph',
  'flowchart',
  'flowchart-elk',
  'style',
  'default',
  'linkStyle',
  'interpolate',
  'classDef',
  'class',
  'href',
  'call',
  'click',
  '_self',
  '_blank',
  '_parent',
  '_top',
  'end',
  'subgraph',
  'kitty',
];

const doubleEndedEdges = [
  { edgeStart: 'x--', edgeEnd: '--x', stroke: 'normal', type: 'double_arrow_cross' },
  { edgeStart: 'x==', edgeEnd: '==x', stroke: 'thick', type: 'double_arrow_cross' },
  { edgeStart: 'x-.', edgeEnd: '.-x', stroke: 'dotted', type: 'double_arrow_cross' },
  { edgeStart: 'o--', edgeEnd: '--o', stroke: 'normal', type: 'double_arrow_circle' },
  { edgeStart: 'o==', edgeEnd: '==o', stroke: 'thick', type: 'double_arrow_circle' },
  { edgeStart: 'o-.', edgeEnd: '.-o', stroke: 'dotted', type: 'double_arrow_circle' },
  { edgeStart: '<--', edgeEnd: '-->', stroke: 'normal', type: 'double_arrow_point' },
  { edgeStart: '<==', edgeEnd: '==>', stroke: 'thick', type: 'double_arrow_point' },
  { edgeStart: '<-.', edgeEnd: '.->', stroke: 'dotted', type: 'double_arrow_point' },
];

const regularEdges = [
  { edgeStart: '--', edgeEnd: '--x', stroke: 'normal', type: 'arrow_cross' },
  { edgeStart: '==', edgeEnd: '==x', stroke: 'thick', type: 'arrow_cross' },
  { edgeStart: '-.', edgeEnd: '.-x', stroke: 'dotted', type: 'arrow_cross' },
  { edgeStart: '--', edgeEnd: '--o', stroke: 'normal', type: 'arrow_circle' },
  { edgeStart: '==', edgeEnd: '==o', stroke: 'thick', type: 'arrow_circle' },
  { edgeStart: '-.', edgeEnd: '.-o', stroke: 'dotted', type: 'arrow_circle' },
  { edgeStart: '--', edgeEnd: '-->', stroke: 'normal', type: 'arrow_point' },
  { edgeStart: '==', edgeEnd: '==>', stroke: 'thick', type: 'arrow_point' },
  { edgeStart: '-.', edgeEnd: '.->', stroke: 'dotted', type: 'arrow_point' },

  { edgeStart: '--', edgeEnd: '----x', stroke: 'normal', type: 'arrow_cross' },
  { edgeStart: '==', edgeEnd: '====x', stroke: 'thick', type: 'arrow_cross' },
  { edgeStart: '-.', edgeEnd: '...-x', stroke: 'dotted', type: 'arrow_cross' },
  { edgeStart: '--', edgeEnd: '----o', stroke: 'normal', type: 'arrow_circle' },
  { edgeStart: '==', edgeEnd: '====o', stroke: 'thick', type: 'arrow_circle' },
  { edgeStart: '-.', edgeEnd: '...-o', stroke: 'dotted', type: 'arrow_circle' },
  { edgeStart: '--', edgeEnd: '---->', stroke: 'normal', type: 'arrow_point' },
  { edgeStart: '==', edgeEnd: '====>', stroke: 'thick', type: 'arrow_point' },
  { edgeStart: '-.', edgeEnd: '...->', stroke: 'dotted', type: 'arrow_point' },
];

describe('[Lezer Edges] when parsing', () => {
  beforeEach(() => {
    flowParser.parser.yy = new FlowDB();
    flowParser.parser.yy.clear();
  });

  it('should handle open ended edges', () => {
    const result = flowParser.parser.parse('graph TD;A---B;');
    const edges = flowParser.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_open');
  });

  it('should handle cross ended edges', () => {
    const result = flowParser.parser.parse('graph TD;A--xB;');
    const edges = flowParser.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_cross');
  });

  it('should handle circle ended edges', () => {
    const result = flowParser.parser.parse('graph TD;A--oB;');
    const edges = flowParser.parser.yy.getEdges();

    expect(edges[0].type).toBe('arrow_circle');
  });

  describe('edges with ids', () => {
    describe('open ended edges with ids and labels', () => {
      regularEdges.forEach((edgeType) => {
        it(`should handle ${edgeType.stroke} ${edgeType.type} with no text`, () => {
          const result = flowParser.parser.parse(
            `flowchart TD;\nA e1@${edgeType.edgeStart}${edgeType.edgeEnd} B;`
          );
          const vert = flowParser.parser.yy.getVertices();
          const edges = flowParser.parser.yy.getEdges();
          expect(vert.get('A')?.id).toBe('A');
          expect(vert.get('B')?.id).toBe('B');
          expect(edges.length).toBe(1);
          expect(edges[0].id).toBe('e1');
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe(`${edgeType.type}`);
          expect(edges[0].text).toBe('');
          expect(edges[0].stroke).toBe(`${edgeType.stroke}`);
        });
      });
    });

    describe('double ended edges with ids and labels', () => {
      doubleEndedEdges.forEach((edgeType) => {
        it(`should handle ${edgeType.stroke} ${edgeType.type} with text`, () => {
          const result = flowParser.parser.parse(
            `flowchart TD;\nA e1@${edgeType.edgeStart} label ${edgeType.edgeEnd} B;`
          );
          const vert = flowParser.parser.yy.getVertices();
          const edges = flowParser.parser.yy.getEdges();
          expect(vert.get('A')?.id).toBe('A');
          expect(vert.get('B')?.id).toBe('B');
          expect(edges.length).toBe(1);
          expect(edges[0].id).toBe('e1');
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe(`${edgeType.type}`);
          expect(edges[0].text).toBe('label');
          expect(edges[0].stroke).toBe(`${edgeType.stroke}`);
        });
      });
    });
  });

  describe('edges', () => {
    doubleEndedEdges.forEach((edgeType) => {
      it(`should handle ${edgeType.stroke} ${edgeType.type} with no text`, () => {
        const result = flowParser.parser.parse(
          `graph TD;\nA ${edgeType.edgeStart}${edgeType.edgeEnd} B;`
        );

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe(`${edgeType.type}`);
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe(`${edgeType.stroke}`);
      });

      it(`should handle ${edgeType.stroke} ${edgeType.type} with text`, () => {
        const result = flowParser.parser.parse(
          `graph TD;\nA ${edgeType.edgeStart} text ${edgeType.edgeEnd} B;`
        );

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe(`${edgeType.type}`);
        expect(edges[0].text).toBe('text');
        expect(edges[0].stroke).toBe(`${edgeType.stroke}`);
      });

      it.each(keywords)(
        `should handle ${edgeType.stroke} ${edgeType.type} with %s text`,
        (keyword) => {
          const result = flowParser.parser.parse(
            `graph TD;\nA ${edgeType.edgeStart} ${keyword} ${edgeType.edgeEnd} B;`
          );

          const vert = flowParser.parser.yy.getVertices();
          const edges = flowParser.parser.yy.getEdges();

          expect(vert.get('A')?.id).toBe('A');
          expect(vert.get('B')?.id).toBe('B');
          expect(edges.length).toBe(1);
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe(`${edgeType.type}`);
          expect(edges[0].text).toBe(`${keyword}`);
          expect(edges[0].stroke).toBe(`${edgeType.stroke}`);
        }
      );
    });
  });

  it('should handle multiple edges', () => {
    const result = flowParser.parser.parse(
      'graph TD;A---|This is the 123 s text|B;\nA---|This is the second edge|B;'
    );
    const vert = flowParser.parser.yy.getVertices();
    const edges = flowParser.parser.yy.getEdges();

    expect(vert.get('A')?.id).toBe('A');
    expect(vert.get('B')?.id).toBe('B');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_open');
    expect(edges[0].text).toBe('This is the 123 s text');
    expect(edges[0].stroke).toBe('normal');
    expect(edges[0].length).toBe(1);
    expect(edges[1].start).toBe('A');
    expect(edges[1].end).toBe('B');
    expect(edges[1].type).toBe('arrow_open');
    expect(edges[1].text).toBe('This is the second edge');
    expect(edges[1].stroke).toBe('normal');
    expect(edges[1].length).toBe(1);
  });

  describe('edge length', () => {
    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal edges with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA -${'-'.repeat(length)}- B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal labelled edges with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA -- Label -${'-'.repeat(length)}- B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal edges with arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA -${'-'.repeat(length)}> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal labelled edges with arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA -- Label -${'-'.repeat(length)}> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal edges with double arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA <-${'-'.repeat(length)}> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle normal labelled edges with double arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA <-- Label -${'-'.repeat(length)}> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('normal');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick edges with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA =${'='.repeat(length)}= B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick labelled edges with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA == Label =${'='.repeat(length)}= B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick edges with arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA =${'='.repeat(length)}> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick labelled edges with arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA == Label =${'='.repeat(length)}> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick edges with double arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA <=${'='.repeat(length)}> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle thick labelled edges with double arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA <== Label =${'='.repeat(length)}> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('thick');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted edges with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA -${'.'.repeat(length)}- B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted labelled edges with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA -. Label ${'.'.repeat(length)}- B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_open');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted edges with arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA -${'.'.repeat(length)}-> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted labelled edges with arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA -. Label ${'.'.repeat(length)}-> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted edges with double arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA <-${'.'.repeat(length)}-> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }

    for (let length = 1; length <= 3; ++length) {
      it(`should handle dotted edges with double arrows with length ${length}`, () => {
        const result = flowParser.parser.parse(`graph TD;\nA <-. Label ${'.'.repeat(length)}-> B;`);

        const vert = flowParser.parser.yy.getVertices();
        const edges = flowParser.parser.yy.getEdges();

        expect(vert.get('A')?.id).toBe('A');
        expect(vert.get('B')?.id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('double_arrow_point');
        expect(edges[0].text).toBe('Label');
        expect(edges[0].stroke).toBe('dotted');
        expect(edges[0].length).toBe(length);
      });
    }
  });
});
