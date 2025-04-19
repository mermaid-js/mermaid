import mermaid from 'mermaid';
import { diagramData } from './index.js';

describe('examples', () => {
  beforeAll(async () => {
    // To trigger the diagram registration
    await mermaid.registerExternalDiagrams([]);
  });

  it('should have examples for each diagrams', () => {
    const skippedDiagrams = [
      // These diagrams have no examples
      'error',
      'info',
      '---',
      // These diagrams have v2 versions, with examples
      'class',
      'graph',
      'flowchart-elk',
      'flowchart',
      'state',
    ];
    const diagrams = mermaid
      .getRegisteredDiagramsMetadata()
      .filter((d) => !skippedDiagrams.includes(d.id));
    expect(diagrams.length).toBeGreaterThan(0);
    for (const diagram of diagrams) {
      const data = diagramData.find((d) => d.id === diagram.id)!;
      expect(data).toBeDefined();
      expect(data.examples.length).toBeGreaterThan(0);
      expect(data.examples.filter((e) => e.isDefault).length).toBe(1);
    }
  });
});
