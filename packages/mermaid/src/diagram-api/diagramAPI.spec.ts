import { detectType } from './detectType';
import { getDiagram, registerDiagram } from './diagramAPI';
import { addDiagrams } from './diagram-orchestration';
import { DiagramDetector } from './types';
import { getDiagramFromText } from '../Diagram';

addDiagrams();
beforeAll(async () => {
  await getDiagramFromText('sequenceDiagram');
});

describe('DiagramAPI', () => {
  it('should return default diagrams', () => {
    expect(getDiagram('sequence')).not.toBeNull();
  });

  it('should throw error if diagram is not defined', () => {
    expect(() => getDiagram('loki')).toThrow();
  });

  it('should handle diagram registrations', () => {
    expect(() => getDiagram('loki')).toThrow();
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
