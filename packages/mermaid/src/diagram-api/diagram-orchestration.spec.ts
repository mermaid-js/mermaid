import { it, describe, expect } from 'vitest';
import { detectType } from './detectType.js';
import { addDiagrams } from './diagram-orchestration.js';

describe('diagram-orchestration', () => {
  it('should register diagrams', () => {
    expect(() => detectType('graph TD; A-->B')).toThrow();
    addDiagrams();
    expect(detectType('graph TD; A-->B')).toBe('flowchart');
  });

  describe('proper diagram types should be detetced', () => {
    beforeAll(() => {
      addDiagrams();
    });

    it.each([
      { text: 'graph TD;', expected: 'flowchart' },
      { text: 'flowchart TD;', expected: 'flowchart-v2' },
      { text: 'flowchart-v2 TD;', expected: 'flowchart-v2' },
      { text: 'flowchart-elk TD;', expected: 'flowchart-elk' },
      { text: 'error', expected: 'error' },
      { text: 'C4Context;', expected: 'c4' },
      { text: 'classDiagram', expected: 'class' },
      { text: 'classDiagram-v2', expected: 'classDiagram' },
      { text: 'erDiagram', expected: 'er' },
      { text: 'journey', expected: 'journey' },
      { text: 'gantt', expected: 'gantt' },
      { text: 'pie', expected: 'pie' },
      { text: 'tt', expected: 'tt' },
      { text: 'requirementDiagram', expected: 'requirement' },
      { text: 'info', expected: 'info' },
      { text: 'sequenceDiagram', expected: 'sequence' },
      { text: 'mindmap', expected: 'mindmap' },
      { text: 'timeline', expected: 'timeline' },
      { text: 'gitGraph', expected: 'gitGraph' },
      { text: 'stateDiagram', expected: 'state' },
      { text: 'stateDiagram-v2', expected: 'stateDiagram' },
    ])(
      'should $text be detected as $expected',
      ({ text, expected }: { text: string; expected: string }) => {
        expect(detectType(text)).toBe(expected);
      }
    );

    it('should detect proper flowchart type based on config', () => {
      // graph & dagre-d3 => flowchart
      expect(detectType('graph TD; A-->B')).toBe('flowchart');
      // graph & dagre-d3 => flowchart
      expect(detectType('graph TD; A-->B', { flowchart: { defaultRenderer: 'dagre-d3' } })).toBe(
        'flowchart'
      );
      // flowchart & dagre-d3 => error
      expect(() =>
        detectType('flowchart TD; A-->B', { flowchart: { defaultRenderer: 'dagre-d3' } })
      ).toThrowErrorMatchingInlineSnapshot(
        '"No diagram type detected matching given configuration for text: flowchart TD; A-->B"'
      );

      // graph & dagre-wrapper => flowchart-v2
      expect(
        detectType('graph TD; A-->B', { flowchart: { defaultRenderer: 'dagre-wrapper' } })
      ).toBe('flowchart-v2');
      // flowchart ==> flowchart-v2
      expect(detectType('flowchart TD; A-->B')).toBe('flowchart-v2');
      // flowchart && dagre-wrapper ==> flowchart-v2
      expect(
        detectType('flowchart TD; A-->B', { flowchart: { defaultRenderer: 'dagre-wrapper' } })
      ).toBe('flowchart-v2');
      // flowchart && elk ==> flowchart-elk
      expect(detectType('flowchart TD; A-->B', { flowchart: { defaultRenderer: 'elk' } })).toBe(
        'flowchart-elk'
      );
    });

    it('should not detect flowchart if pie contains flowchart', () => {
      expect(
        detectType(`pie title: "flowchart"
      flowchart: 1 "pie" pie: 2 "pie"`)
      ).toBe('pie');
    });
  });
});
