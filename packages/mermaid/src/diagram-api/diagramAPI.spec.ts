import { detectType, DiagramDetector } from './detectType';
import { getDiagram, registerDiagram, registerDetector } from './diagramAPI';
import { addDiagrams } from './diagram-orchestration';

addDiagrams();

describe('DiagramAPI', () => {
  it('should return default diagrams', () => {
    expect(getDiagram('sequence')).not.toBeNull();
  });

  it('should throw error if diagram is not defined', () => {
    expect(() => getDiagram('loki')).toThrow();
  });

  it('should handle diagram registrations', () => {
    expect(() => getDiagram('loki')).toThrow();
    expect(() => detectType('loki diagram')).not.toThrow(); // TODO: #3391
    const detector: DiagramDetector = (str: string) => {
      return str.match('loki') !== null;
    };
    registerDetector('loki', detector, '');
    registerDiagram(
      'loki',
      {
        db: {},
        parser: {},
        renderer: {},
        styles: {},
      },
      (text: string) => text.includes('loki')
    );
    expect(getDiagram('loki')).not.toBeNull();
    expect(detectType('loki diagram')).toBe('loki');
  });
});
