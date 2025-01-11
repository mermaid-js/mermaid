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
    expect(graph.type).toBe('flowchart-v2');
    const sequence = await Diagram.fromText(
      'sequenceDiagram; Alice->>+John: Hello John, how are you?'
    );
    expect(sequence).toBeInstanceOf(Diagram);
    expect(sequence.type).toBe('sequence');
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
      'flowchart-elk',
      (str) => str.startsWith('flowchart-elk'),
      () => Promise.resolve(getDummyDiagram('flowchart-elk', title))
    );
    const diagram = await Diagram.fromText('flowchart-elk TD; A-->B');
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
    await expect(Diagram.fromText('sequenceDiagram; A-->B')).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      [Error: Parse error on line 1:
      ...quenceDiagram; A-->B
      -----------------------^
      Expecting 'TXT', got 'NEWLINE']
    `);
  });

  test('should throw the right error for unregistered diagrams', async () => {
    await expect(Diagram.fromText('thor TD; A-->B')).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UnknownDiagramError: No diagram type detected matching given configuration for text: thor TD; A-->B]`
    );
  });

  test('should consider entity codes when present in diagram defination', async () => {
    const diagram = await Diagram.fromText(`sequenceDiagram
    A->>B: I #9829; you!
    B->>A: I #9829; you #infin; times more!`);
    // @ts-ignore: we need to add types for sequenceDb which will be done in separate PR
    const messages = diagram.db?.getMessages?.();
    if (!messages) {
      throw new Error('Messages not found!');
    }

    expect(messages[0].message).toBe('I ﬂ°°9829¶ß you!');
    expect(messages[1].message).toBe('I ﬂ°°9829¶ß you ﬂ°infin¶ß times more!');
  });
});
