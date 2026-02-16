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

  it('should initialize with a left margin of 150px for user journeys', () => {
    renderGraph(
      `
      ---
      config:
        journey:
          maxLabelWidth: 320
      ---
      journey
        title User Journey Example
        section Onboarding
            Sign Up: 5:
            Browse Features: 3:
            Use Core Functionality: 4:
        section Engagement
            Browse Features: 3
            Use Core Functionality: 4
      `,
      { journey: { useMaxWidth: true } }
    );

    let diagramStartX;

    cy.contains('foreignobject', 'Sign Up').then(($diagram) => {
      diagramStartX = parseFloat($diagram.attr('x'));
      expect(diagramStartX).to.be.closeTo(150, 2);
    });
  });

  it('should maintain sufficient space between legend and diagram when legend labels are longer', () => {
    renderGraph(
      `journey
      title  Web hook life cycle
      section Darkoob
        Make preBuilt:5: Darkoob user
        register slug : 5: Darkoob userf deliberately increasing the size of this label to check if distance between legend and diagram is  maintained
        Map slug to a Prebuilt Job:5: Darkoob user
      section External Service
        set Darkoob slug as hook for an Event : 5 : admin Exjjjnjjjj qwerty
        listen to the events : 5 :  External Service
        call darkoob endpoint : 5 : External Service
      section Darkoob
        check for inputs : 5 : DarkoobAPI
        run the prebuilt job : 5 : DarkoobAPI
        `,
      { journey: { useMaxWidth: true } }
    );

    let LabelEndX, diagramStartX;

    // Get right edge of the legend
    cy.contains('tspan', 'Darkoob userf').then((textBox) => {
      const bbox = textBox[0].getBBox();
      LabelEndX = bbox.x + bbox.width;
    });

    // Get left edge of the diagram
    cy.contains('foreignobject', 'Make preBuilt').then((rect) => {
      diagramStartX = parseFloat(rect.attr('x'));
    });

    // Assert right edge of the diagram is greater than or equal to the right edge of the label
    cy.then(() => {
      expect(diagramStartX).to.be.gte(LabelEndX);
    });
  });

  it('should wrap a single long word with hyphenation', () => {
    renderGraph(
      `
      ---
      config:
        journey:
          maxLabelWidth: 100
      ---
      journey
        title Long Word Test
        section Test
          VeryLongWord: 5: Supercalifragilisticexpialidocious
      `,
      { journey: { useMaxWidth: true } }
    );

    // Verify that the line ends with a hyphen, indicating proper hyphenation for words exceeding maxLabelWidth.
    cy.get('tspan').then((tspans) => {
      const hasHyphen = [...tspans].some((t) => t.textContent.trim().endsWith('-'));
      return expect(hasHyphen).to.be.true;
    });
  });

  it('should wrap text on whitespace without adding hyphens', () => {
    renderGraph(
      `
      ---
      config:
        journey:
          maxLabelWidth: 200
      ---
      journey
        title Whitespace Test
        section Test
          TextWithSpaces: 5: Gustavo Fring is played by Giancarlo Esposito and is a character in Breaking Bad.
      `,
      { journey: { useMaxWidth: true } }
    );

    // Verify that none of the text spans end with a hyphen.
    cy.get('tspan').each(($el) => {
      const text = $el.text();
      expect(text.trim()).not.to.match(/-$/);
    });
  });

  it('should wrap long labels into multiple lines, keep them under max width, and maintain margins', () => {
    renderGraph(
      `
      ---
      config:
        journey:
          maxLabelWidth: 320
      ---
      journey
        title User Journey Example
        section Onboarding
            Sign Up: 5: This is a long label that will be split into multiple lines to test the wrapping functionality
            Browse Features: 3: This is another long label that will be split into multiple lines to test the wrapping functionality
            Use Core Functionality: 4: This is yet another long label that will be split into multiple lines to test the wrapping functionality
        section Engagement
            Browse Features: 3
            Use Core Functionality: 4
      `,
      { journey: { useMaxWidth: true } }
    );

    let diagramStartX, maxLineWidth;

    // Get the diagram's left edge x-coordinate
    cy.contains('foreignobject', 'Sign Up')
      .then(($diagram) => {
        diagramStartX = parseFloat($diagram.attr('x'));
      })
      .then(() => {
        cy.get('text.legend').then(($lines) => {
          // Check that there are multiple lines
          expect($lines.length).to.be.equal(9);

          // Check that all lines are under the maxLabelWidth
          $lines.each((index, el) => {
            const bbox = el.getBBox();
            expect(bbox.width).to.be.lte(320);
            maxLineWidth = Math.max(maxLineWidth || 0, bbox.width);
          });

          /** The expected margin between the diagram and the legend is 150px, as defined by
           *  conf.leftMargin in user-journey-config.js
           */
          expect(diagramStartX - maxLineWidth).to.be.closeTo(150, 2);
        });
      });
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
