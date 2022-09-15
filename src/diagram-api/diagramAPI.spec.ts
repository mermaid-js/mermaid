import { detectType } from './detectType';
import { getDiagram, registerDiagram } from './diagramAPI';
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
