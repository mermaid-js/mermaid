import { imgSnapshotTest } from '../../helpers/util';

const looks = ['classic', 'handDrawn'] as const;
const directions = [
  'TB',
  //'BT',
  'LR',
  //'RL'
] as const;

const shapesSet1 = ['text', 'card', 'lin-rect', 'diamond', 'hexagon'] as const;

// removing labelRect, need have alias for it
const shapesSet2 = ['rounded', 'rect', 'start', 'stop'] as const;

const shapesSet3 = ['fork', 'choice', 'note', 'stadium', 'odd'] as const;

const shapesSet4 = ['subroutine', 'cylinder', 'circle', 'doublecircle', 'odd'] as const;

const shapesSet5 = ['anchor', 'lean-r', 'lean-l', 'trap-t', 'trap-b'] as const;

// Aggregate all shape sets into a single array
const shapesSets = [shapesSet1, shapesSet2, shapesSet3, shapesSet4, shapesSet5] as const;

looks.forEach((look) => {
  directions.forEach((direction) => {
    shapesSets.forEach((shapesSet) => {
      describe(`Test ${shapesSet.join(', ')} in ${look} look and dir ${direction}`, () => {
        it(`without label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          shapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape} }\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          shapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is a label for ${newShape} shape' }\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`connect all shapes with each other`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          shapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index}${index}@{ shape: ${newShape}, label: 'This is a label for ${newShape} shape' }\n`;
          });
          for (let i = 0; i < shapesSet.length; i++) {
            for (let j = i + 1; j < shapesSet.length; j++) {
              flowchartCode += `  n${i}${i} --> n${j}${j}\n`;
            }
          }
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with very long label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          shapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is a very very very very very long long long label for ${newShape} shape' }\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with markdown htmlLabels:true`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          shapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is **bold** </br>and <strong>strong</strong> for ${newShape} shape' }\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with markdown htmlLabels:false`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          shapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is **bold** </br>and <strong>strong</strong> for ${newShape} shape' }\n`;
          });
          imgSnapshotTest(flowchartCode, {
            look,
            htmlLabels: false,
            flowchart: { htmlLabels: false },
          });
        });

        it(`with styles`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          shapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'new ${newShape} shape' }\n`;
            flowchartCode += `  style n${index}${index} fill:#f9f,stroke:#333,stroke-width:4px \n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with classDef`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          flowchartCode += `  classDef customClazz fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5\n`;
          shapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'new ${newShape} shape' }\n`;
            flowchartCode += `  n${index}${index}:::customClazz\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });
      });
    });
  });
});
