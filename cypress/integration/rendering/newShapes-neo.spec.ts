import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

const looks = ['neo'] as const;
const themes = ['neo'] as const;
const directions = ['TB', 'LR'] as const;
const newShapesSet1 = [
  'triangle',
  'sloped-rectangle',
  'horizontal-cylinder',
  'flipped-triangle',
  'hourglass',
] as const;
const newShapesSet2 = [
  'tagged-rectangle',
  'documents',
  'lightning-bolt',
  'filled-circle',
  'window-pane',
] as const;

const newShapesSet3 = [
  'curved-trapezoid',
  'bow-rect',
  'tagged-document',
  'divided-rectangle',
  'crossed-circle',
] as const;

const newShapesSet4 = [
  'document',
  'notched-pentagon',
  'lined-cylinder',
  'stacked-document',
  'half-rounded-rectangle',
] as const;

const newShapesSet5 = [
  'lined-document',
  'tagged-document',
  'brace-l',
  'comment',
  'braces',
  'brace-r',
] as const;

const newShapesSet6 = ['brace-r', 'braces'] as const;
// Aggregate all shape sets into a single array
const newShapesSets = [
  newShapesSet1,
  newShapesSet2,
  newShapesSet3,
  newShapesSet4,
  newShapesSet5,
  newShapesSet6,
];

looks.forEach((look) => {
  themes.forEach((theme) => {
    directions.forEach((direction) => {
      newShapesSets.forEach((newShapesSet) => {
        describe(`Test ${newShapesSet.join(', ')} in ${look} look and dir ${direction}`, () => {
          it(`without label`, () => {
            let flowchartCode = `flowchart ${direction}\n`;
            newShapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape} }\n`;
            });
            imgSnapshotTest(flowchartCode, { look, theme });
          });

          it(`with label`, () => {
            let flowchartCode = `flowchart ${direction}\n`;
            newShapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is a label for ${newShape} shape' }\n`;
            });
            imgSnapshotTest(flowchartCode, { look, theme });
          });

          it(`connect all shapes with each other`, () => {
            let flowchartCode = `flowchart ${direction}\n`;
            newShapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index}${index}@{ shape: ${newShape}, label: 'This is a label for ${newShape} shape' }\n`;
            });
            for (let i = 0; i < newShapesSet.length; i++) {
              for (let j = i + 1; j < newShapesSet.length; j++) {
                flowchartCode += `  n${i}${i} --> n${j}${j}\n`;
              }
            }
            imgSnapshotTest(flowchartCode, { look, theme });
          });

          it(`with very long label`, () => {
            let flowchartCode = `flowchart ${direction}\n`;
            newShapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is a very very very very very long long long label for ${newShape} shape' }\n`;
            });
            imgSnapshotTest(flowchartCode, { look, theme });
          });

          it(`with markdown htmlLabels:true`, () => {
            let flowchartCode = `flowchart ${direction}\n`;
            newShapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is **bold** </br>and <strong>strong</strong> for ${newShape} shape' }\n`;
            });
            imgSnapshotTest(flowchartCode, { look, theme });
          });

          it(`with markdown htmlLabels:false`, () => {
            let flowchartCode = `flowchart ${direction}\n`;
            newShapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is **bold** </br>and <strong>strong</strong> for ${newShape} shape' }\n`;
            });
            imgSnapshotTest(flowchartCode, {
              look,
              theme,
              htmlLabels: false,
              flowchart: { htmlLabels: false },
            });
          });

          it(`with styles`, () => {
            let flowchartCode = `flowchart ${direction}\n`;
            newShapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'new ${newShape} shape' }\n`;
              flowchartCode += `  style n${index}${index} fill:#f9f,stroke:#333,stroke-width:4px \n`;
            });
            imgSnapshotTest(flowchartCode, { look, theme });
          });

          it(`with classDef`, () => {
            let flowchartCode = `flowchart ${direction}\n`;
            flowchartCode += `  classDef customClazz fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5\n`;
            newShapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'new ${newShape} shape' }\n`;
              flowchartCode += `  n${index}${index}:::customClazz\n`;
            });
            imgSnapshotTest(flowchartCode, { look, theme });
          });
        });
      });
    });
  });
});

// Regression: neo-look node rects used to carry a hardcoded stroke="url(#gradient)" while
// no element with id="gradient" existed in the SVG — a dangling paint
// reference. Every url(#...) reference emitted in the rendered document
// (attributes and injected CSS) must resolve to a real element.
describe('neo look: SVG paint references', () => {
  it('should not emit dangling url(#...) references on node rects', () => {
    renderGraph(
      `flowchart TB
        A(Start) --> B[Process]
        B --> C(End)
      `,
      { look: 'neo', theme: 'neo' }
    );

    cy.get('svg').should((svg) => {
      const svgEl = svg.get(0);
      const doc = svgEl.ownerDocument;
      const refPattern = /url\(["']?#([^"')]+)["']?\)/g;
      const referencedIds: string[] = [];

      for (const el of [svgEl, ...svgEl.querySelectorAll('*')]) {
        for (const attr of el.attributes) {
          for (const match of attr.value.matchAll(refPattern)) {
            referencedIds.push(match[1]);
          }
        }
      }
      for (const styleEl of svgEl.querySelectorAll('style')) {
        for (const match of (styleEl.textContent ?? '').matchAll(refPattern)) {
          referencedIds.push(match[1]);
        }
      }

      // The neo theme uses gradients and drop-shadows, so references must exist
      expect(referencedIds).to.have.length.greaterThan(0);
      for (const id of referencedIds) {
        expect(doc.getElementById(id), `url(#${id}) should resolve to an element`).to.not.equal(
          null
        );
      }
    });
  });

  it('neo look node rects render with themed borders', () => {
    imgSnapshotTest(
      `flowchart TB
        A(Start) --> B[Process]
        B --> C(End)
      `,
      { look: 'neo', theme: 'neo' }
    );
  });
});
