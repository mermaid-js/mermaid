import { imgSnapshotTest, renderGraph } from '../../helpers/util.js';

describe('Pie Chart', () => {
  it('should render a simple pie diagram', () => {
    imgSnapshotTest(
      `
    pie title Sports in Sweden
       "Bandy" : 40
       "Ice-Hockey" : 80
       "Football" : 90
      `,
      {}
    );
    cy.get('svg');
  });
  it('should render a simple pie diagram with long labels', () => {
    imgSnapshotTest(
      `
      pie title NETFLIX
         "Time spent looking for movie" : 90
         "Time spent watching it" : 10
        `,
      {}
    );
    cy.get('svg');
  });
  it('should render a simple pie diagram with capital letters for labels', () => {
    imgSnapshotTest(
      `
      pie title What Voldemort doesn't have?
         "FRIENDS" : 2
         "FAMILY" : 3
         "NOSE" : 45
        `,
      {}
    );
    cy.get('svg');
  });
  it('should render a pie diagram when useMaxWidth is true (default)', () => {
    renderGraph(
      `
    pie title Sports in Sweden
       "Bandy" : 40
       "Ice-Hockey" : 80
       "Football" : 90
      `,
      { pie: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      // expect(svg).to.have.attr('height');
      // const height = parseFloat(svg.attr('height'));
      // expect(height).to.eq(450);
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).to.eq(984);
    });
  });
  it('should render a pie diagram when useMaxWidth is false', () => {
    renderGraph(
      `
    pie title Sports in Sweden
       "Bandy" : 40
       "Ice-Hockey" : 80
       "Football" : 90
      `,
      { pie: { useMaxWidth: false } }
    );
    cy.get('svg').should((svg) => {
      // const height = parseFloat(svg.attr('height'));
      const width = parseFloat(svg.attr('width'));
      // expect(height).to.eq(450);
      expect(width).to.eq(984);
      expect(svg).to.not.have.attr('style');
    });
  });

  it('should render a pie diagram with given outside stroke width', () => {
    renderGraph(
      `
    pie title Sports in Sweden
       "Bandy" : 40
       "Ice-Hockey" : 80
       "Football" : 90
      `,
      { pie: { outerBorderWidth: 5 } }
    );
    cy.get('.pieOuterCircle').should((circle) => {
      const strokeWidth = parseFloat(circle.attr('stroke-width'));
      expect(strokeWidth).to.eq(5);
    });
  });

  it('should render a pie diagram when text-position is set', () => {
    imgSnapshotTest(
      `
        pie
          "Dogs": 50
          "Cats": 25
        `,
      { logLevel: 1, pie: { textPosition: 0.9 } }
    );
    cy.get('svg');
  });
});
