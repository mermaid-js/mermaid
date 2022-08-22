import { detectType } from './detectType';
import { getDiagram, registerDiagram } from './diagramAPI';

describe('DiagramAPI', () => {
  it('should return default diagrams', () => {
    expect(getDiagram('sequence')).not.toBeNull();
  });

  it('should throw error if diagram is not defined', () => {
    expect(() => getDiagram('loki')).toThrow();
  });

  it('should handle diagram registrations', () => {
    expect(() => getDiagram('loki')).toThrow();
    // TODO Q: Shouldn't this be throwing an error?
    expect(detectType('loki diagram')).toBe('flowchart');
    registerDiagram(
      'loki',
      {
        db: {},
        parser: {},
        renderer: {},
      },
      (text: string) => text.includes('loki')
    );
    expect(getDiagram('loki')).not.toBeNull();
    expect(detectType('loki diagram')).toBe('loki');
  });
});
