import { describe, test, expect } from 'vitest';
import { Diagram, getDiagramFromText } from './Diagram.js';
import { addDetector } from './diagram-api/detectType.js';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';

addDiagrams();

describe('diagram detection', () => {
  test('should detect inbuilt diagrams', async () => {
    const graph = (await getDiagramFromText('graph TD; A-->B')) as Diagram;
    expect(graph).toBeInstanceOf(Diagram);
    expect(graph.type).toBe('flowchart-v2');
    const sequence = (await getDiagramFromText(
      'sequenceDiagram; Alice->>+John: Hello John, how are you?'
    )) as Diagram;
    expect(sequence).toBeInstanceOf(Diagram);
    expect(sequence.type).toBe('sequence');
  });

  test('should detect external diagrams', async () => {
    addDetector(
      'loki',
      (str) => str.startsWith('loki'),
      0,
      () =>
        Promise.resolve({
          id: 'loki',
          diagram: {
            db: {},
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
        })
    );
    const diagram = (await getDiagramFromText('loki TD; A-->B')) as Diagram;
    expect(diagram).toBeInstanceOf(Diagram);
    expect(diagram.type).toBe('loki');
  });

  test('should allow external diagrams to override internal ones with same ID', async () => {
    addDetector(
      'flowchart-elk',
      (str) => str.startsWith('flowchart-elk'),
      1,
      () =>
        Promise.resolve({
          id: 'flowchart-elk',
          diagram: {
            db: {
              getDiagramTitle: () => 'overridden',
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
        })
    );
    const diagram = (await getDiagramFromText('flowchart-elk TD; A-->B')) as Diagram;
    expect(diagram).toBeInstanceOf(Diagram);
    expect(diagram.db.getDiagramTitle?.()).toBe('overridden');
  });

  test('should throw the right error for incorrect diagram', async () => {
    await expect(getDiagramFromText('graph TD; A-->')).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Parse error on line 2:
      graph TD; A-->
      --------------^
      Expecting 'AMP', 'COLON', 'PIPE', 'TESTSTR', 'DOWN', 'DEFAULT', 'NUM', 'COMMA', 'NODE_STRING', 'BRKT', 'MINUS', 'MULT', 'UNICODE_TEXT', got 'EOF'"
    `);
    await expect(getDiagramFromText('sequenceDiagram; A-->B')).rejects
      .toThrowErrorMatchingInlineSnapshot(`
"Parse error on line 1:
...quenceDiagram; A-->B
-----------------------^
Expecting 'TXT', got 'NEWLINE'"
		`);
  });

  test('should throw the right error for unregistered diagrams', async () => {
    await expect(getDiagramFromText('thor TD; A-->B')).rejects.toThrowErrorMatchingInlineSnapshot(
      '"No diagram type detected matching given configuration for text: thor TD; A-->B"'
    );
  });

  test('should consider entity codes when present in diagram defination', async () => {
    const diagram = await getDiagramFromText(`sequenceDiagram
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
