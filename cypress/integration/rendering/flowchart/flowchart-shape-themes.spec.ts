import { imgSnapshotTest } from '../../../helpers/util';

const looks = ['neo'] as const;
const themes = ['neo', 'neo-dark', 'redux', 'redux-dark'] as const;
const directions = ['TB'] as const;

// New shapes sets
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

// Old shapes sets
const oldShapesSet1 = ['text', 'card', 'lin-rect', 'diamond', 'hexagon'] as const;

const oldShapesSet2 = ['rounded', 'rect', 'start', 'stop'] as const;

const oldShapesSet3 = ['fork', 'choice', 'note', 'stadium', 'odd'] as const;

const oldShapesSet4 = ['subroutine', 'cylinder', 'circle', 'doublecircle', 'odd'] as const;

const oldShapesSet5 = ['anchor', 'lean-r', 'lean-l', 'trap-t', 'trap-b'] as const;

// Combine all shapes
const allShapes = [
  newShapesSet1,
  newShapesSet2,
  newShapesSet3,
  newShapesSet4,
  newShapesSet5,
  oldShapesSet1,
  oldShapesSet2,
  oldShapesSet3,
  oldShapesSet4,
  oldShapesSet5,
] as const;

looks.forEach((look) => {
  themes.forEach((theme) => {
    directions.forEach((direction) => {
      allShapes.forEach((shapesSet, setIndex) => {
        describe(`Test all shapes connected with each other in ${look} look, ${theme} theme and dir ${direction} - set ${setIndex + 1}`, () => {
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
            imgSnapshotTest(flowchartCode, { look, theme });
            console.log('flowchartCode', flowchartCode);
          });
        });
      });
    });
  });
});
