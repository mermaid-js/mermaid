import { imgSnapshotTest } from '../../helpers/util.ts';

// Define the looks and shape sets using readonly tuples to ensure type safety
const looks = ['classic', 'handDrawn'] as const;
const directions = ['TB', 'BT', 'LR', 'RL'] as const;
const newShapesSet1 = [
  'triangle',
  'slopedRect',
  'tiltedCylinder',
  'flippedTriangle',
  'hourglass',
] as const;
const newShapesSet2 = [
  'taggedRect',
  'multiRect',
  'lightningBolt',
  'filledCircle',
  'windowPane',
] as const;

const newShapesSet3 = [
  'halfRoundedRectangle',
  'curvedTrapezoid',
  'bowTieRect',
  'dividedRect',
  'crossedCircle',
] as const;

const newShapesSet4 = [
  'waveRectangle',
  'trapezoidalPentagon',
  'linedCylinder',
  'waveEdgedRectangle',
  'multiWaveEdgedRectangle',
] as const;

const newShapesSet5 = ['linedWaveEdgedRect', 'taggedWaveEdgedRectangle'];

// Aggregate all shape sets into a single array
const newShapesSets = [
  newShapesSet1,
  newShapesSet2,
  newShapesSet3,
  newShapesSet4,
  newShapesSet5,
] as const;

looks.forEach((look) => {
  directions.forEach((direction) => {
    newShapesSets.forEach((newShapesSet) => {
      describe(`Test ${newShapesSet.join(', ')} in ${look} look and dir ${direction}`, () => {
        it(`without label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape} }@\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is a label' }@\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with very long label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is a very very very very very long long long label' }@\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with markdown htmlLabels:true`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is **bold** </br>and <strong>strong</strong>' }@\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with markdown htmlLabels:false`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'This is **bold** </br>and <strong>strong</strong>' }@\n`;
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
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'new shape' }@\n`;
            flowchartCode += `  style n${index}${index} fill:#f9f,stroke:#333,stroke-width:4px \n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with classDef`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          flowchartCode += `  classDef customClazz fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5\n`;
          newShapesSet.forEach((newShape, index) => {
            flowchartCode += `  n${index} --> n${index}${index}@{ shape: ${newShape}, label: 'new shape' }@\n`;
            flowchartCode += `  n${index}${index}:::customClazz\n`;
          });
          imgSnapshotTest(flowchartCode, { look });
        });
      });
    });
  });
});

// describe('Test for new shape set 1', () => {
//   it('1: should render new shape', () => {
//     imgSnapshotTest(
//       `flowchart
//           A --> A1@{ shape: triangle, label:"This is Sample Label" }@
//         `
//     );
//   });

//   it('2: should render new slopedRect shape', () => {
//     imgSnapshotTest(
//       `flowchart
//           GS --> AQ@{ shape: slopedRect, label:"This is Final Label" }@
//           RE --> AQ
//         `,
//       {}
//     );
//   });
// });

// describe('newShapes', () => {
//   it('1: should render new triangle shape', () => {
//     imgSnapshotTest(
//       `flowchart
//           BTF --> ADT@{ shape: triangle, label:"This is Sample Label" }@
//         `
//     );
//   });

//   it('2: should render new slopedRect shape', () => {
//     imgSnapshotTest(
//       `flowchart
//           GS --> AQ@{ shape: slopedRect, label:"This is Final Label" }@
//           RE --> AQ
//         `,
//       {}
//     );
//   });
//   it('3: should render new tiltedCylinder shape', () => {
//     imgSnapshotTest(
//       `flowchart
//           KS --> AC@{ shape: tiltedCylinder, label:"This is Final Label" }@
//           RE --> AC
//         `,
//       {}
//     );
//   });
//   it('4: should render new flippedTriangle shape', () => {
//     imgSnapshotTest(
//       `flowchart
//           FS --> AD@{ shape: flippedTriangle, label:"This is Final Label" }@
//           FE --> AD
//         `,
//       {}
//     );
//   });
//   it('5: should render new hourGlass shape', () => {
//     imgSnapshotTest(
//       `flowchart
//           MS --> AE@{ shape: hourglass, label:"This is Final Label" }@
//           ME --> AE
//         `,
//       {}
//     );
//   });
//   it('6: should render new taggedRect shape', () => {
//     imgSnapshotTest(
//       `flowchart
//           KS --> AC@{ shape: taggedRect, label:"This is Final Label" }@
//           RE --> AC
//         `,
//       {}
//     );
//   });
//   it('7: should render new multiRect shape', () => {
//     imgSnapshotTest(
//       `flowchart
//           DS --> AF@{ shape: multiRect, label:"This is Final Label" }@
//           DE --> AF
//         `,
//       {}
//     );
//   });
//   it('8: should render new FlowChart for New Shapes', () => {
//     renderGraph(
//       `
//     flowchart
//     A@{ shape: stateStart }@
//     B@{ shape: crossedCircle, label: "Start Defining Test Case" }@
//     C@{ shape: tiltedCylinder, label: "write your Test Case"}@
//     D@{ shape: flippedTriangle, label: "new Test Case"}@
//     E@{ shape: waveRectangle, label: "Execute Test Case" }@
//     F@{ shape: hourglass , label: "add test case"}@
//     G@{ shape: taggedRect, label: "execute new test case"}@
//     H@{ shape: slopedRect, label: "Test Passed?" }@
//     I@{ shape: bowTieRect, label: "Pass" }@
//     J@{ shape: dividedRect, label: "Log Defect" }@
//     K@{ shape: curvedTrapezoid, label: "End" }@
//     L@{ shape: multiRect, label: "coming soon"}@

//     A --> B
//     B --> C
//     C --> D
//     D --> E
//     E --> F
//     F -->|Yes| G
//     G -->|No| H
//     H --> I
//     I --> J
//     J --> K
//     K --> L
//       `,
//       { flowchart: { useMaxWidth: true } }
//     );
//     cy.get('svg').should((svg) => {
//       const style = svg.attr('style');
//       expect(svg).to.have.attr('width', '100%');
//       // use within because the absolute value can be slightly different depending on the environment ±5%
//       expect(style).to.match(/^max-width: [\d.]+px;$/);
//       const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
//       expect(maxWidthValue).to.be.within(250 * 0.95 - 1, 250 * 1.05);
//     });
//   });
// });
