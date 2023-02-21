import { it, describe, expect } from 'vitest';
import { detectType } from './detectType';
import { addDiagrams } from './diagram-orchestration';

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
  });
});
