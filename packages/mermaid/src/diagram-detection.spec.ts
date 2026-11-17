import { it, describe, expect } from 'vitest';
import { detectType } from '@mermaid-js/core/diagram-api/detectType.js';
import './mermaid.js';

describe('the diagrams that mermaid registers', () => {
  describe('proper diagram types should be detected', () => {
    it('routes both graph and flowchart to the unified flowchart', () => {
      // `graph` and `flowchart` are the same diagram. They used to differ only when a
      // renderer was configured, which is why `graph` had a legacy id of its own.
      expect(detectType('graph TD; A-->B')).toBe('flowchart-v2');
      expect(detectType('flowchart TD; A-->B')).toBe('flowchart-v2');
    });

    it('keeps flowchart-elk as its own explicit keyword', () => {
      // The only remaining way to ask for ELK by diagram type. Everything else asks with
      // `layout: elk`.
      expect(detectType('flowchart-elk TD; A-->B')).toBe('flowchart-elk');
      expect(detectType('swimlane-beta TD; A-->B')).toBe('swimlane');
    });

    it('routes classDiagram and stateDiagram to their unified diagrams', () => {
      expect(detectType('classDiagram')).toBe('classDiagram');
      expect(detectType('classDiagram-v2')).toBe('classDiagram');
      expect(detectType('stateDiagram\n  [*] --> A')).toBe('stateDiagram');
      expect(detectType('stateDiagram-v2\n  [*] --> A')).toBe('stateDiagram');
    });

    it('does not mistake other diagram types for a flowchart', () => {
      // These carried a `flowchart.defaultRenderer` block for years, which did nothing for
      // them except trip a side effect in the flowchart detector.
      expect(detectType('mindmap\n  root\n    Photograph\n      Waterfall')).toBe('mindmap');
      expect(
        detectType(`
          classDiagram
            class Person {
              +String name
              -Int id
            }
          `)
      ).toBe('classDiagram');
      expect(
        detectType(`
          erDiagram
            p[Photograph] {
              varchar(12) jobId
              date dateCreated
            }
          `)
      ).toBe('er');
    });
  });
});
