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
      //expect(maxWidthValue).to.eq(700);
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

  it('should maintain consistent distance between widest legend label and diagram', () => {
    renderGraph(
      `journey
    title  Web hook life cycle
    section Darkoob 
        Make preBuilt:5: Darkoob user 
        register slug : 5: Darkoob userf
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

    let rightEdgeXInitial,
      leftEdgeXInitial,
      rightEdgeXFinal,
      leftEdgeXFinal,
      initialDifference,
      finalDifference;

    cy.contains('tspan', 'admin Exjjjnjjjj qwerty').then((textBox) => {
      const bbox = textBox[0].getBBox();
      const rightEdge = bbox.x + bbox.width;
      console.warn(rightEdge);
    });

    cy.get(':nth-child(14) > switch > foreignobject').then((rect) => {
      console.warn(rect);
      //const leftEdgeXInitial = rect.left;
      // cy.log(`Left edge x-coordinate: ${leftEdgeXInitial}`);
      // initialDifference = leftEdgeXInitial - rightEdgeXInitial;
      // cy.log(`Initial Difference: ${initialDifference}`);
    });

    // renderGraph(
    //   `journey
    // title  Web hook life cycle
    // section Darkoob
    //     Make preBuilt:5: Darkoob user
    //     register slug : 5: Darkoob userf deliberately increasing the size of this label to check if distance between legend and diagram is  maintained
    //   Map slug to a Prebuilt Job:5: Darkoob user
    // section External Service
    //   set Darkoob slug as hook for an Event : 5 : admin Exjjjnjjjj qwerty
    //   listen to the events : 5 :  External Service
    //   call darkoob endpoint : 5 : External Service
    // section Darkoob
    //     check for inputs : 5 : DarkoobAPI
    //     run the prebuilt job : 5 : DarkoobAPI
    //   `,
    //     { journey: { useMaxWidth: true } }
    //   );

    // cy.contains('tspan', 'Darkoob userf deliberately increasing the size of this label to check if distance between legend and diagram is  maintained')
    //   .invoke('getBBox')
    //   .then((bbox) => {
    //     rightEdgeXFinal = bbox.x + bbox.width;
    //     cy.log(`Right edge x-coordinate final: ${rightEdgeXFinal}`);
    //   });

    // cy.contains('div.label', 'Make preBuilt')
    //   .invoke('getBoundingClientRect')
    //   .then((rect) => {
    //     leftEdgeXFinal = rect.left;
    //     cy.log(`Left edge x-coordinate final: ${leftEdgeXFinal}`);
    //     finalDifference = leftEdgeXFinal - rightEdgeXFinal;
    //     cy.log(`Final Difference: ${finalDifference}`);
    //   });

    // expect(initialDifference).toEqual(finalDifference);
  });
});
