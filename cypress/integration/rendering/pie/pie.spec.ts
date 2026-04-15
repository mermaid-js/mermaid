import { imgSnapshotTest, renderGraph } from '../../../helpers/util.ts';

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
      expect(maxWidthValue).to.be.within(590, 600); // depends on installed fonts: 596.2 on my PC, 597.5 on CI
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
      expect(width).to.be.within(590, 600); // depends on installed fonts: 596.2 on my PC, 597.5 on CI
      expect(svg).to.not.have.attr('style');
    });
  });

  it('should render a pie diagram when textPosition is set', () => {
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
  it('should render pie slices only for non-zero values but shows all legends', () => {
    imgSnapshotTest(
      `   pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 1
      `
    );
  });
  it('should render a pie diagram with readable title and legend in dark mode', () => {
    imgSnapshotTest(
      `pie title Sports in Sweden
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `,
      { theme: 'dark' }
    );
  });

  it('should render a pie diagram with a long title without clipping', () => {
    imgSnapshotTest(
      `pie title Weekly Grocery Consumption for a Family of 4
        "Vegetables": 25
        "Fruits": 5
        "Cheese": 5
        "Milk": 15
        "Eggs": 15
        "Meat": 30
        "Bread": 5
      `
    );
  });
});
