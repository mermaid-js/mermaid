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
  it('renders short title without shrink or wrap', () => {
    imgSnapshotTest(`
      pie
        title Short
        "A" : 60
        "B" : 40
    `);
  });

  it('should render a pie chart with a medium-length title', () => {
    renderGraph(
      `pie title Distribution of Pets in Urban Areas
        "Dogs": 50
        "Cats": 30
        "Birds": 20
      `
    );
    cy.get('svg').should('exist');
    cy.get('text').contains('Distribution of Pets in Urban Areas').should('exist');
  });

  it('should render a pie chart with a long title without clipping', () => {
    renderGraph(
      `pie title Analysis of the Distribution of Various Pet Species Across Different Metropolitan Regions
        "Dogs": 50
        "Cats": 30
        "Birds": 20
      `
    );
    cy.get('.pieTitleText tspan').then(($tspans) => {
      const titleText = [...$tspans].map((el) => el.textContent).join(' ');
      expect(titleText).to.include('Analysis of the Distribution');
    });
  });
});
