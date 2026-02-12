import { describe, test, expect } from 'vitest';
import { Diagram } from './Diagram.js';
import { addDetector } from './diagram-api/detectType.js';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import type { DiagramLoader } from './diagram-api/types.js';

addDiagrams();

const getDummyDiagram = (id: string, title?: string): Awaited<ReturnType<DiagramLoader>> => {
  return {
    id,
    diagram: {
      db: {
        getDiagramTitle: () => title ?? id,
      },
      parser: {
        parse: () => {
          // no-op
        },
      },
      renderer: {
        draw: () => {
          // no-op
        },
      },
      styles: {},
    },
  };
};

describe('diagram detection', () => {
  test('should detect inbuilt diagrams', async () => {
    const graph = await Diagram.fromText('graph TD; A-->B');
    expect(graph).toBeInstanceOf(Diagram);
    expect(graph.type).toBe('flowchart-elk');
    const flowchart = await Diagram.fromText('flowchart TD; A-->B');
    expect(flowchart).toBeInstanceOf(Diagram);
    expect(flowchart.type).toBe('flowchart-elk');
  });

  test('should detect external diagrams', async () => {
    addDetector(
      'loki',
      (str) => str.startsWith('loki'),
      () => Promise.resolve(getDummyDiagram('loki'))
    );
    const diagram = await Diagram.fromText('loki TD; A-->B');
    expect(diagram).toBeInstanceOf(Diagram);
    expect(diagram.type).toBe('loki');
  });

  test('should allow external diagrams to override internal ones with same ID', async () => {
    const title = 'overridden';
    addDetector(
      'custom-test',
      (str) => str.startsWith('custom-test'),
      () => Promise.resolve(getDummyDiagram('custom-test', title))
    );
    const diagram = await Diagram.fromText('custom-test TD; A-->B');
    expect(diagram).toBeInstanceOf(Diagram);
    expect(diagram.db.getDiagramTitle?.()).toBe(title);
  });

  test('should throw the right error for incorrect diagram', async () => {
    await expect(Diagram.fromText('graph TD; A-->')).rejects.toThrowErrorMatchingInlineSnapshot(`
      [Error: Parse error on line 2:
      graph TD; A-->
      --------------^
      Expecting 'AMP', 'COLON', 'PIPE', 'TESTSTR', 'DOWN', 'DEFAULT', 'NUM', 'COMMA', 'NODE_STRING', 'BRKT', 'MINUS', 'MULT', 'UNICODE_TEXT', got 'EOF']
    `);
    await expect(Diagram.fromText('flowchart TD; A-->')).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      [Error: Parse error on line 2:
      flowchart TD; A-->
      ------------------^
      Expecting 'AMP', 'COLON', 'PIPE', 'TESTSTR', 'DOWN', 'DEFAULT', 'NUM', 'COMMA', 'NODE_STRING', 'BRKT', 'MINUS', 'MULT', 'UNICODE_TEXT', got 'EOF']
    `);
  });

  test('should throw the right error for unregistered diagrams', async () => {
    await expect(Diagram.fromText('thor TD; A-->B')).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UnknownDiagramError: No diagram type detected matching given configuration for text: thor TD; A-->B]`
    );
  });

  test('should consider entity codes when present in diagram definition', async () => {
    const diagram = await Diagram.fromText(`graph TD
    A["I #9829; you!"] --> B["I #9829; you #infin; times more!"]`);
    // @ts-ignore: getVertices is defined on flowchart db
    const vertices = diagram.db?.getVertices?.();
    if (!vertices) {
      throw new Error('Vertices not found!');
    }

    expect(vertices.get('A')?.text).toContain('ﬂ°°9829¶ß');
    expect(vertices.get('B')?.text).toContain('ﬂ°infin¶ß');
  });
});
