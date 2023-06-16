import { imgSnapshotTest, renderGraph } from '../../helpers/util.js';

describe('pie chart', () => {
  it('should render a simple pie diagram', () => {
    imgSnapshotTest(
      `pie title Sports in Sweden
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `
    );
  });

  it('should render a simple pie diagram with long labels', () => {
    imgSnapshotTest(
      `pie title NETFLIX
        "Time spent looking for movie": 90
        "Time spent watching it": 10
      `
    );
  });

  it('should render a simple pie diagram with capital letters for labels', () => {
    imgSnapshotTest(
      `pie title What Voldemort doesn't have?
        "FRIENDS": 2
        "FAMILY": 3
        "NOSE": 45
      `
    );
  });

  it('should render a pie diagram when useMaxWidth is true (default)', () => {
    renderGraph(
      `pie title Sports in Sweden
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `,
      { pie: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).to.eq(984);
    });
  });

  it('should render a pie diagram when useMaxWidth is false', () => {
    renderGraph(
      `pie title Sports in Sweden
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `,
      { pie: { useMaxWidth: false } }
    );
    cy.get('svg').should((svg) => {
      const width = parseFloat(svg.attr('width'));
      expect(width).to.eq(984);
      expect(svg).to.not.have.attr('style');
    });
  });

  it('should render a pie diagram when textPosition is setted', () => {
    imgSnapshotTest(
      `pie
        "Dogs": 50
        "Cats": 25
      `,
      { logLevel: 1, pie: { textPosition: 0.9 } }
    );
  });

  it('should render a pie diagram with showData', () => {
    imgSnapshotTest(
      `pie showData
        "Dogs": 50
        "Cats": 25
      `
    );
  });
});
