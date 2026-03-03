import { imgSnapshotTest, renderGraph } from '../../helpers/util';

describe('Ishikawa diagram', () => {
  it('1: should render a simple ishikawa diagram', () => {
    imgSnapshotTest(
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `
    );
  });

  it('2: should render with many causes on both sides', () => {
    imgSnapshotTest(
      `ishikawa-beta
    Manufacturing Defect
        Machine
            Worn tooling
            Calibration
        Method
            Missing step
        Material
            Contamination
            Wrong grade
        Manpower
            Insufficient training
      `
    );
  });

  it('3: should render with deeply nested causes', () => {
    imgSnapshotTest(
      `ishikawa-beta
    Server Outage
        Hardware
            Disk
                Bad sectors
                Full capacity
            Memory
                Leak detected
        Software
            Bug
                Race condition
      `
    );
  });

  it('4: should render with a single cause', () => {
    imgSnapshotTest(
      `ishikawa-beta
    Problem
        Cause A
      `
    );
  });

  it('5: should render with no children (root only)', () => {
    imgSnapshotTest(
      `ishikawa-beta
    Problem
      `
    );
  });

  it('6: should render with handDrawn look', () => {
    imgSnapshotTest(
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { look: 'handDrawn' }
    );
  });

  it('7: should render with forest theme', () => {
    imgSnapshotTest(
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { theme: 'forest' }
    );
  });

  it('8: should render with dark theme', () => {
    imgSnapshotTest(
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { theme: 'dark' }
    );
  });

  it('9: should render with custom diagramPadding', () => {
    imgSnapshotTest(
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { ishikawa: { diagramPadding: 50 } }
    );
  });

  it('10: should render when useMaxWidth is true', () => {
    renderGraph(
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { ishikawa: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
    });
  });

  it('11: should render when useMaxWidth is false', () => {
    renderGraph(
      `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
      `,
      { ishikawa: { useMaxWidth: false } }
    );
    cy.get('svg').should((svg) => {
      const width = parseFloat(svg.attr('width')!);
      expect(width).to.be.greaterThan(0);
      const height = parseFloat(svg.attr('height')!);
      expect(height).to.be.greaterThan(0);
      expect(svg).to.not.have.attr('style');
    });
  });

  it('12: should render a very deep nested diagram', () => {
    imgSnapshotTest(
      `ishikawa-beta
    Very deep
    Cause 1
      1-1
      1-2
      1-3
          1-3-1
          1-3-2
          1-3-3
          1-3-4
    Cause 2
      2-1
        2-1-1
        2-1-2
      2-2
        2-2-1
        2-2-2
          2-2-2-1
            2-2-2-1-1
            2-2-2-1-2
              2-2-2-1-2-1
          2-2-2-1
      2-3
        2-3-1
    Cause 3
       3-1
         3-1-1
            3-1-1-1
              3-1-1-1-1
                3-1-1-1-1-1
                  3-1-1-1-1-1-1
    Cause 4
        4-1
          4-1-1
          4-1-2
          4-1-3
          4-1-4
          4-1-5
          4-1-6
          4-1-7
          4-1-8
        4-2
          4-2-1
          4-2-2
    Cause 5
        5-1
    Cause 6
        6-1
        6-2
        6-3
        6-4
        6-5
        6-6
      `
    );
  });
});
