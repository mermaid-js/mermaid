import { it, describe, expect } from 'vitest';
import { detectType } from './detectType.js';
import { addDiagrams } from './diagram-orchestration.js';

describe('diagram-orchestration', () => {
  it('should register diagrams', () => {
    expect(() => detectType('graph TD; A-->B')).toThrow();
    addDiagrams();
    expect(detectType('graph TD; A-->B')).toBe('flowchart');
  });

  describe('proper diagram types should be detected', () => {
    beforeAll(() => {
      addDiagrams();
    });

    it.each([
      { text: 'graph TD;', expected: 'flowchart' },
      { text: 'flowchart TD;', expected: 'flowchart-v2' },
      { text: 'flowchart-v2 TD;', expected: 'flowchart-v2' },
      { text: 'flowchart-elk TD;', expected: 'flowchart-elk' },
      { text: 'error', expected: 'error' },
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
        `[UnknownDiagramError: No diagram type detected matching given configuration for text: flowchart TD; A-->B]`
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

    it('should detect proper diagram when defaultRenderer is elk for flowchart', () => {
      expect(
        detectType('flowchart TD; A-->B', {
          flowchart: { defaultRenderer: 'elk' },
        })
      ).toBe('flowchart-elk');
      expect(
        detectType('graph TD; A-->B', {
          flowchart: { defaultRenderer: 'elk' },
        })
      ).toBe('flowchart-elk');
    });
  });
});
