import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

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
  describe('title wrapping', () => {
    it('should render a pie chart with a short title', () => {
      cy.renderGraph(`
        pie title Short Title
        "A" : 60
        "B" : 40
      `);
    });
  
    it('should render a pie chart with a medium-length title that wraps into two lines', () => {
      cy.renderGraph(`
        pie title This is a medium title that should wrap nicely
        "A" : 50
        "B" : 30
        "C" : 20
      `);
    });
  
    it('should render a pie chart with a very long title that wraps into multiple lines without overlapping the pie', () => {
      cy.renderGraph(`
        pie title This is a very long pie chart title that should properly wrap into multiple lines and not overlap with the pie chart even if it is extremely verbose
        "A" : 45
        "B" : 35
        "C" : 20
      `);
    });
  
    it('should render a small pie chart with a long title', () => {
      cy.renderGraph(`
        %%{ init: { "themeVariables": { "pieOuterStrokeWidth": "1px" }, "pie": { "textPosition": 0.5 } } }%%
        pie title Small Pie with Long Title that should wrap
        "A" : 100
      `);
    });
  });
  
});
