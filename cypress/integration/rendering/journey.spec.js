import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('User journey diagram', () => {
  it('Simple test', () => {
    imgSnapshotTest(
      `journey
title Adding journey diagram functionality to mermaid
section Order from website
    `,
      {}
    );
  });

  it('should render a user journey chart', () => {
    imgSnapshotTest(
      `
    journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 3: Me
      `,
      {}
    );
  });

  it('should render a user journey diagram when useMaxWidth is true (default)', () => {
    renderGraph(
      `journey
title E-Commerce
section Order from website
  Add to cart: 5: Me
section Checkout from website
  Add payment details: 5: Me
    `,
      { journey: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      expect(svg).to.have.attr('height');
      // const height = parseFloat(svg.attr('height'));
      // expect(height).to.eq(565);
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).to.eq(700);
    });
  });

  it('should render a user journey diagram when useMaxWidth is false', () => {
    imgSnapshotTest(
      `journey
title E-Commerce
section Order from website
  Add to cart: 5: Me
section Checkout from website
  Add payment details: 5: Me
    `,
      { journey: { useMaxWidth: false } }
    );
  });

  it('should throw an error if the task score is not an integer', () => {
    expect(() => {
      renderGraph(
        `journey
              accTitle: simple journey demo
              accDescr: 2 main sections: work and home, each with just a few tasks
        
            section Go to work
              Make tea: Hello: Me
              Go upstairs: 3: Me
            section Go home
              Go downstairs: 5: Me
              Sit down: 2: Me`
      );
    }).to.throw('Score must be an integer between 0 and 5');
  });

  it('should throw an error if the task score is less than 0', () => {
    expect(() => {
      renderGraph(
        `journey
              accTitle: simple journey demo
              accDescr: 2 main sections: work and home, each with just a few tasks
        
            section Go to work
              Make tea: -10: Me
              Go upstairs: 3: Me
            section Go home
              Go downstairs: 5: Me
              Sit down: 2: Me`
      );
    }).to.throw('Score must be an integer between 0 and 5');
  });

  it('should throw an error if the task score is greater than 5', () => {
    expect(() => {
      renderGraph(
        `journey
              accTitle: simple journey demo
              accDescr: 2 main sections: work and home, each with just a few tasks
        
            section Go to work
              Make tea: 23: Me
              Go upstairs: 3: Me
            section Go home
              Go downstairs: 5: Me
              Sit down: 2: Me`
      );
    }).to.throw('Score must be an integer between 0 and 5');
  });
});
