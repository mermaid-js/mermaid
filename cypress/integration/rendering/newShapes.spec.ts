import { imgSnapshotTest } from '../../helpers/util.ts';

const looks = ['classic'] as const;
const directions = ['TB'] as const;
const newShapesSet1 = [
  'triangle',
  'sloped-rect',
  'tilted-cylinder',
  'flipped-triangle',
  'hourglass',
] as const;
const newShapesSet2 = [
  'tagged-rect',
  'multi-rect',
  'lightning-bolt',
  'filled-circle',
  'window-pane',
] as const;

const newShapesSet3 = [
  'curved-trapezoid',
  'bow-tie-rect',
  'wave-edge-rect',
  'divided-rectangle',
  'crossed-circle',
] as const;

const newShapesSet4 = [
  'wave-rectangle',
  'notched-pentagon',
  'lined-cylinder',
  'multi-wave-edged-rectangle',
  'half-rounded-rect',
] as const;

const newShapesSet5 = [
  'lined-wave-edged-rect',
  'tagged-wave-edged-rectangle',
  'brace-l',
  'curved-trapezoid',
  'wave-rectangle',
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
  directions.forEach((direction) => {
    newShapesSets.forEach((newShapesSet) => {
      describe(`Test ${newShapesSet.join(', ')} in ${look} look and dir ${direction}`, () => {
        it(`without label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}{ shape: ${newShape} }\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}{ shape: ${newShape}, label: 'This is a label for ${newShape} shape' }\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`connect all shapes with each other`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index}${index}{ shape: ${newShape}, label: 'This is a label for ${newShape} shape' }\n`;
          });
          for (let i = 0; i < newShapesSet.length; i++) {
            for (let j = i + 1; j < newShapesSet.length; j++) {
              flowchartCode += `  n${i}${i} --> n${j}${j}\n`;
            }
          }
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with very long label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}{ shape: ${newShape}, label: 'This is a very very very very very long long long label for ${newShape} shape' }\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with markdown htmlLabels:true`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}{ shape: ${newShape}, label: 'This is **bold** </br>and <strong>strong</strong> for ${newShape} shape' }\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with markdown htmlLabels:false`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}{ shape: ${newShape}, label: 'This is **bold** </br>and <strong>strong</strong> for ${newShape} shape' }\n`;
          });
          imgSnapshotTest(flowchartCode, {
            look,
            htmlLabels: false,
            flowchart: { htmlLabels: false },
          });
        });

        it(`with styles`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}{ shape: ${newShape}, label: 'new ${newShape} shape' }\n`;
            flowchartCode += `  style n${index}${index} fill:#f9f,stroke:#333,stroke-width:4px \n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with classDef`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          flowchartCode += `  classDef customClazz fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}{ shape: ${newShape}, label: 'new ${newShape} shape' }\n`;
            flowchartCode += `  n${index}${index}:::customClazz\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });
      });
    });
  });
});
