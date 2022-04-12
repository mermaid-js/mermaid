import { imgSnapshotTest, renderGraph } from '../../helpers/util.js';

describe('Requirement diagram', () => {
  it('sample', () => {
    imgSnapshotTest(
      `
    requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    functionalRequirement test_req2 {
    id: 1.1
    text: the second test text.
    risk: low
    verifymethod: inspection
    }

    performanceRequirement test_req3 {
    id: 1.2
    text: the third test text.
    risk: medium
    verifymethod: demonstration
    }

    element test_entity {
    type: simulation
    }

    element test_entity2 {
    type: word doc
    docRef: reqs/test_entity
    }


    test_entity - satisfies -> test_req2
    test_req - traces -> test_req2
    test_req - contains -> test_req3
    test_req <- copies - test_entity2
      `,
      {}
    );
    cy.get('svg');
  });

  it('should render accessibility tags', function () {
    const expectedTitle = 'Gantt Diagram';
    const expectedAccDescription = 'Tasks for Q4';
    renderGraph(
      `
    requirementDiagram
    title: ${expectedTitle}
    accDescription: ${expectedAccDescription}

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    functionalRequirement test_req2 {
    id: 1.1
    text: the second test text.
    risk: low
    verifymethod: inspection
    }

    performanceRequirement test_req3 {
    id: 1.2
    text: the third test text.
    risk: medium
    verifymethod: demonstration
    }

    element test_entity {
    type: simulation
    }

    element test_entity2 {
    type: word doc
    docRef: reqs/test_entity
    }


    test_entity - satisfies -> test_req2
    test_req - traces -> test_req2
    test_req - contains -> test_req3
    test_req <- copies - test_entity2
      `,
      {}
    );
    cy.get('svg').should((svg) => {
      const el = svg.get(0);
      const children = Array.from(el.children);

      const titleEl = children.find(function (node) {
        return node.tagName === 'title';
      });
      const descriptionEl = children.find(function (node) {
        return node.tagName === 'desc';
      });

      expect(titleEl).to.exist;
      expect(titleEl.textContent).to.equal(expectedTitle);
      expect(descriptionEl).to.exist;
      expect(descriptionEl.textContent).to.equal(expectedAccDescription);
    });
  });
});
