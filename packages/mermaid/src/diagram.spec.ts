import { describe, test, expect } from 'vitest';
import { Diagram, getDiagramFromText } from './Diagram.ts';
import { addDetector } from './diagram-api/detectType.ts';
import { addDiagrams } from './diagram-api/diagram-orchestration.ts';

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
      () =>
        Promise.resolve({
          id: 'loki',
          diagram: {
            db: {},
            parser: {
              parse: () => {
                // no-op
              },
              parser: {
                yy: {},
              },
            },
            renderer: {},
            styles: {},
          },
        })
    );
    const diagram = (await getDiagramFromText('loki TD; A-->B')) as Diagram;
    expect(diagram).toBeInstanceOf(Diagram);
    expect(diagram.type).toBe('loki');
  });

  test('should throw the right error for incorrect diagram', async () => {
    await expect(getDiagramFromText('graph TD; A-->')).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Parse error on line 2:
      graph TD; A-->
      --------------^
      Expecting 'AMP', 'ALPHA', 'COLON', 'PIPE', 'TESTSTR', 'DOWN', 'DEFAULT', 'NUM', 'COMMA', 'MINUS', 'BRKT', 'DOT', 'PUNCTUATION', 'UNICODE_TEXT', 'PLUS', 'EQUALS', 'MULT', 'UNDERSCORE', got 'EOF'"
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
});
