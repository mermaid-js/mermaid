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

  it('should render a simple pie diagram with long title', () => {
    renderGraph(
      `pie title Sports in Sweden that are my favorite to watch
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).to.be.within(730, 750); // depends on installed fonts
    });
  });

  it('should render a simple pie diagram with long title and long labels', () => {
    renderGraph(
      `pie title Time usage on NETFLIX the last few movie nights
        "Time spent looking for movie": 90
        "Time spent watching it": 10
      `
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).to.be.within(900, 920); // depends on installed fonts
    });
  });

  it('should render a simple pie diagram that is centered with long title', () => {
    renderGraph(
      `pie title Sports in Sweden that are my favorite to watch
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `
    );
    cy.get('g')
      .eq(1)
      .should((g) => {
        const transform = g.attr('transform');
        expect(transform).to.match(/translate\(\d+(\.\d+)?,\d+(\.\d+)?\)/);

        const translateValues = transform.match(/translate\((\d+(\.\d+)?),(\d+(\.\d+)?)\)/);
        const translateX = parseFloat(translateValues[1]);

        expect(translateX).to.be.within(280, 300);
      });
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
      expect(maxWidthValue).to.be.within(590, 610); // depends on installed fonts: 596.2 on my PC, 597.5 on CI
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
      expect(width).to.be.within(590, 610); // depends on installed fonts: 596.2 on my PC, 597.5 on CI
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
