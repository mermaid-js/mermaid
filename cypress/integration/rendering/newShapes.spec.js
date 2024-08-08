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
  it('3: should render new FlowChart for New Shapes', () => {
    renderGraph(
      `
    flowchart
    A@{ shape: stateStart }@
    B@{ shape: crossedCircle, label: "Start Defining Test Case" }@
    E@{ shape: waveRectangle, label: "Execute Test Case" }@
    F@{ shape: slopedRect, label: "Test Passed?" }@
    G@{ shape: bowTieRect, label: "Pass" }@
    H@{ shape: dividedRect, label: "Log Defect" }@
    I@{ shape: curvedTrapezoid, label: "End" }@
    
    A --> B
    B --> E
    E --> F
    F -->|Yes| G
    F -->|No| H
    G --> I
    H --> I
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
