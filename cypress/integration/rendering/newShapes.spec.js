import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('newShapes', () => {
  it('1: should render new triangle shape', () => {
    imgSnapshotTest(
      `flowchart
          BTF --> ADT@{ shape: triangle, label:"This is Sample Label" }@
        `
    );
  });

  it('2: should render new slopedRect shape', () => {
    imgSnapshotTest(
      `flowchart
          GS --> AQ@{ shape: slopedRect, label:"This is Final Label" }@
          RE --> AQ
        `,
      {}
    );
  });
  it('3: should render new tiltedCylinder shape', () => {
    imgSnapshotTest(
      `flowchart
          KS --> AC@{ shape: tiltedCylinder, label:"This is Final Label" }@
          RE --> AC
        `,
      {}
    );
  });
  it('4: should render new flippedTriangle shape', () => {
    imgSnapshotTest(
      `flowchart
          FS --> AD@{ shape: flippedTriangle, label:"This is Final Label" }@
          FE --> AD
        `,
      {}
    );
  });
  it('5: should render new hourGlass shape', () => {
    imgSnapshotTest(
      `flowchart
          MS --> AE@{ shape: hourglass, label:"This is Final Label" }@
          ME --> AE
        `,
      {}
    );
  });
  it('6: should render new taggedRect shape', () => {
    imgSnapshotTest(
      `flowchart
          KS --> AC@{ shape: taggedRect, label:"This is Final Label" }@
          RE --> AC
        `,
      {}
    );
  });
  it('7: should render new multiRect shape', () => {
    imgSnapshotTest(
      `flowchart
          DS --> AF@{ shape: multiRect, label:"This is Final Label" }@
          DE --> AF
        `,
      {}
    );
  });
  it('8: should render new FlowChart for New Shapes', () => {
    renderGraph(
      `
    flowchart
    A@{ shape: stateStart }@
    B@{ shape: crossedCircle, label: "Start Defining Test Case" }@
    C@{ shape: tiltedCylinder, label: "write your Test Case"}@
    D@{ shape: flippedTriangle, label: "new Test Case"}@
    E@{ shape: waveRectangle, label: "Execute Test Case" }@
    F@{ shape: hourglass , label: "add test case"}@
    G@{ shape: taggedRect, label: "execute new test case"}@
    H@{ shape: slopedRect, label: "Test Passed?" }@
    I@{ shape: bowTieRect, label: "Pass" }@
    J@{ shape: dividedRect, label: "Log Defect" }@
    K@{ shape: curvedTrapezoid, label: "End" }@
    L@{ shape: multiRect, label: "coming soon"}@
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F -->|Yes| G
    G -->|No| H
    H --> I
    I --> J
    J --> K
    K --> L
      `,
      { flowchart: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      const style = svg.attr('style');
      expect(svg).to.have.attr('width', '100%');
      // use within because the absolute value can be slightly different depending on the environment ±5%
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).to.be.within(250 * 0.95 - 1, 250 * 1.05);
    });
  });
});
