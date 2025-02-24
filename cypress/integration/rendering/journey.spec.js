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

  it('should correctly render the user journey diagram title with the specified styling', () => {
    renderGraph(
      `---
config:
  journey:
    titleColor: "#2900A5"
    titleFontFamily: "Times New Roman"
    titleFontSize: "5rem"
---

journey
    title User Journey Example
    section Onboarding
        Sign Up: 5: John, Shahir
        Complete Profile: 4: John
    section Engagement
        Browse Features: 3: John
        Use Core Functionality: 4: John
    section Retention
        Revisit Application: 5: John
        Invite Friends: 3: John

        size: 2rem
    `
    );

    cy.get('text').contains('User Journey Example').as('title');
    cy.get('@title').then(($title) => {
      expect($title).to.have.attr('fill', '#2900A5');
      expect($title).to.have.attr('font-family', 'Times New Roman');
      expect($title).to.have.attr('font-size', '5rem');
    });
  });
});
