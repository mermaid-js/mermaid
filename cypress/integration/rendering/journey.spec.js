/* eslint-env jest */
import { imgSnapshotTest, renderGraph } from '../../helpers/util.js';

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
title Adding journey diagram functionality to mermaid
section Order from website
    `,
      { journey: { useMaxWidth: true } }
    );
    cy.get('svg')
      .should((svg) => {
        expect(svg).to.have.attr('width', '100%');
        expect(svg).to.have.attr('height');
        const height = parseFloat(svg.attr('height'));
        expect(height).to.eq(20);
        const style = svg.attr('style');
        expect(style).to.match(/^max-width: [\d.]+px;$/);
        const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
        expect(maxWidthValue).to.eq(400);
      });
  });

  it('should render a user journey diagram when useMaxWidth is false', () => {
    renderGraph(
      `journey
title Adding journey diagram functionality to mermaid
section Order from website
    `,
      { journey: { useMaxWidth: false } }
    );
    cy.get('svg')
      .should((svg) => {
        const height = parseFloat(svg.attr('height'));
        const width = parseFloat(svg.attr('width'));
        expect(height).to.eq(20);
        expect(width).to.eq(400);
        expect(svg).to.not.have.attr('style');
      });
  });
});
