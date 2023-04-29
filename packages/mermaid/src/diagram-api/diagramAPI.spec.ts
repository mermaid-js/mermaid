import { detectType } from './detectType.js';
import { getDiagram, registerDiagram } from './diagramAPI.js';
import { addDiagrams } from './diagram-orchestration.js';
import { DiagramDetector } from './types.js';
import { getDiagramFromText } from '../Diagram.js';
import { it, describe, expect, beforeAll } from 'vitest';

addDiagrams();
beforeAll(async () => {
  await getDiagramFromText('sequenceDiagram');
});

describe('DiagramAPI', () => {
  it('should return default diagrams', () => {
    expect(getDiagram('sequence')).not.toBeNull();
  });

  it('should throw error if diagram is not defined', () => {
    expect(() => getDiagram('loki')).toThrowErrorMatchingInlineSnapshot(
      '"Diagram loki not found."'
    );
  });

  it('should handle diagram registrations', () => {
    expect(() => getDiagram('loki')).toThrowErrorMatchingInlineSnapshot(
      '"Diagram loki not found."'
    );
    expect(() => detectType('loki diagram')).toThrowErrorMatchingInlineSnapshot(
      '"No diagram type detected matching given configuration for text: loki diagram"'
    );
    const detector: DiagramDetector = (str: string) => {
      return str.match('loki') !== null;
    };
    registerDiagram(
      'loki',
      {
        db: {},
        parser: {},
        renderer: {},
        styles: {},
      },
      detector
    );
    expect(getDiagram('loki')).not.toBeNull();
    expect(detectType('loki diagram')).toBe('loki');
  });
});
