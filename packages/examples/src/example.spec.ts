import mermaid from 'mermaid';
import { diagramData } from './index.js';
const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');
const originalGetComputedTextLength = Object.getOwnPropertyDescriptor(
  SVGElement.prototype,
  'getComputedTextLength'
);

describe('examples', () => {
  beforeAll(async () => {
    // To trigger the diagram registration
    await mermaid.registerExternalDiagrams([]);
    Object.defineProperty(SVGElement.prototype, 'getBBox', {
      configurable: true,
      value: () => ({ x: 0, y: 0, width: 200, height: 100 }),
    });
    Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
      configurable: true,
      value: () => 200,
    });
  });

  afterAll(() => {
    if (originalGetBBox) {
      Object.defineProperty(SVGElement.prototype, 'getBBox', originalGetBBox);
    } else {
      Reflect.deleteProperty(SVGElement.prototype, 'getBBox');
    }
    if (originalGetComputedTextLength) {
      Object.defineProperty(
        SVGElement.prototype,
        'getComputedTextLength',
        originalGetComputedTextLength
      );
    } else {
      Reflect.deleteProperty(SVGElement.prototype, 'getComputedTextLength');
    }
  });

  it('should have examples for each diagrams', () => {
    // Diagrams that are never offered as a starting point.
    const skippedDiagrams = [
      'error',
      'info',
      '---',
      // Beta, and deliberately not announced: no entry in the examples registry
      // and no sidebar link until the syntax is declared stable.
      'agentflow',
    ];
    // Legacy ids whose examples live under their v2 id. Every other diagram,
    // including ones that reuse another diagram's parser or renderer, needs
    // its own entry: editors list examples per diagram id.
    const coveredBy: Record<string, string> = {
      class: 'classDiagram',
      graph: 'flowchart-v2',
      'flowchart-elk': 'flowchart-v2',
      flowchart: 'flowchart-v2',
      state: 'stateDiagram',
    };
    const diagrams = mermaid
      .getRegisteredDiagramsMetadata()
      .filter((d) => !skippedDiagrams.includes(d.id));
    expect(diagrams.length).toBeGreaterThan(0);
    for (const diagram of diagrams) {
      const id = coveredBy[diagram.id] ?? diagram.id;
      const data = diagramData.find((d) => d.id === id)!;
      expect(data, `Example for ${diagram.id} is not defined`).toBeDefined();
      expect(data.examples.length).toBeGreaterThan(0);
      expect(data.examples.filter((e) => e.isDefault).length).toBe(1);
    }
  });

  const usecaseExamples = diagramData.find(({ id }) => id === 'usecase')!.examples;

  for (const [index, example] of usecaseExamples.entries()) {
    it(`should parse and render the use-case registry example "${example.title}"`, async () => {
      mermaid.initialize({ flowchart: { htmlLabels: false } });
      try {
        const diagramId = `usecase-example-${index}`;
        await expect(mermaid.parse(example.code)).resolves.toBeTruthy();

        const { svg } = await mermaid.render(diagramId, example.code);
        const rendered = document.createElement('div');
        rendered.innerHTML = svg;
        expect(rendered.querySelector('svg')).not.toBeNull();
        expect(rendered.querySelectorAll('[data-usecase-kind]').length).toBeGreaterThan(0);
      } finally {
        mermaid.initialize({});
      }
    });
  }
  describe('should have valid examples', () => {
    for (const diagram of diagramData) {
      for (const example of diagram.examples) {
        it(`${diagram.name}: ${example.title}`, async () => {
          await expect(
            mermaid.parse(example.code),
            `Example "${example.title}" of ${diagram.id} does not parse`
          ).resolves.toBeTruthy();
        });
      }
    }
  });
});
