import { test } from '@playwright/test';

import { imgSnapshotTest } from '../helpers/util.ts';

const looks = ['neo'] as const;
const themes = ['neo'] as const;
const directions = ['TB', 'LR'] as const;

const shapesSet1 = ['text', 'card', 'lin-rect', 'diamond', 'hexagon'] as const;

// removing labelRect, need have alias for it
const shapesSet2 = ['rounded', 'rect', 'start', 'stop'] as const;

const shapesSet3 = ['fork', 'choice', 'note', 'stadium', 'odd'] as const;

const shapesSet4 = ['subroutine', 'cylinder', 'circle', 'doublecircle', 'odd'] as const;

const shapesSet5 = ['anchor', 'lean-r', 'lean-l', 'trap-t', 'trap-b'] as const;

// Aggregate all shape sets into a single array
const shapesSets = [shapesSet1, shapesSet2, shapesSet3, shapesSet4, shapesSet5] as const;

looks.forEach((look) => {
  themes.forEach((theme) => {
    directions.forEach((direction) => {
      shapesSets.forEach((shapesSet) => {
        test.describe(`Test ${shapesSet.join(', ')} in ${look} look and dir ${direction}`, () => {
          test(`without label`, async ({ page }, testInfo) => {
            let flowchartCode = `flowchart ${direction}\n`;
            shapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape} }\n`;
            });
            await imgSnapshotTest(page, testInfo, flowchartCode, { look, theme });
          });

          test(`with label`, async ({ page }, testInfo) => {
            let flowchartCode = `flowchart ${direction}\n`;
            shapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is a label for ${newShape} shape' }\n`;
            });
            await imgSnapshotTest(page, testInfo, flowchartCode, { look, theme });
          });

          test(`connect all shapes with each other`, async ({ page }, testInfo) => {
            let flowchartCode = `flowchart ${direction}\n`;
            shapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index}${index}@{ shape: ${newShape}, label: 'This is a label for ${newShape} shape' }\n`;
            });
            for (let i = 0; i < shapesSet.length; i++) {
              for (let j = i + 1; j < shapesSet.length; j++) {
                flowchartCode += `  n${i}${i} --> n${j}${j}\n`;
              }
            }
            await imgSnapshotTest(page, testInfo, flowchartCode, { look, theme });
          });

          test(`with very long label`, async ({ page }, testInfo) => {
            let flowchartCode = `flowchart ${direction}\n`;
            shapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is a very very very very very long long long label for ${newShape} shape' }\n`;
            });
            await imgSnapshotTest(page, testInfo, flowchartCode, { look, theme });
          });

          test(`with markdown htmlLabels:true`, async ({ page }, testInfo) => {
            let flowchartCode = `flowchart ${direction}\n`;
            shapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is **bold** </br>and <strong>strong</strong> for ${newShape} shape' }\n`;
            });
            await imgSnapshotTest(page, testInfo, flowchartCode, { look, theme });
          });

          test(`with markdown htmlLabels:false`, async ({ page }, testInfo) => {
            let flowchartCode = `flowchart ${direction}\n`;
            shapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is **bold** </br>and <strong>strong</strong> for ${newShape} shape' }\n`;
            });
            await imgSnapshotTest(page, testInfo, flowchartCode, {
              look,
              theme,
              htmlLabels: false,
              flowchart: { htmlLabels: false },
            });
          });

          test(`with styles`, async ({ page }, testInfo) => {
            let flowchartCode = `flowchart ${direction}\n`;
            shapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'new ${newShape} shape' }\n`;
              flowchartCode += `  style n${index}${index} fill:#f9f,stroke:#333,stroke-width:4px \n`;
            });
            await imgSnapshotTest(page, testInfo, flowchartCode, { look, theme });
          });

          test(`with classDef`, async ({ page }, testInfo) => {
            let flowchartCode = `flowchart ${direction}\n`;
            flowchartCode += `  classDef customClazz fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5\n`;
            shapesSet.forEach((newShape, index) => {
              flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'new ${newShape} shape' }\n`;
              flowchartCode += `  n${index}${index}:::customClazz\n`;
            });
            await imgSnapshotTest(page, testInfo, flowchartCode, { look, theme });
          });
        });
      });
    });
  });
});
