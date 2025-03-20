import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

const testOptions = [
  { description: '', options: { logLevel: 1 } },
  { description: 'ELK: ', options: { logLevel: 1, layout: 'elk' } },
  { description: 'HD: ', options: { logLevel: 1, look: 'handDrawn' } },
];

describe('Requirement Diagram Unified', () => {
  testOptions.forEach(({ description, options }) => {
    it(`${description}should render a simple Requirement diagram`, () => {
      imgSnapshotTest(
        `
    requirementDiagram
        requirement test_req {
        id: 1
        text: the test text.
        risk: high
        verifymethod: test
        }

        element test_entity {
        type: simulation
        }

        test_entity - satisfies -> test_req
        `,
        options
      );
    });

    it(`${description}should render a simple Requirement diagram without htmlLabels`, () => {
      imgSnapshotTest(
        `
    requirementDiagram
        requirement test_req {
        id: 1
        text: the test text.
        risk: high
        verifymethod: test
        }

        element test_entity {
        type: simulation
        }

        test_entity - satisfies -> test_req
        `,
        { ...options, htmlLabels: false }
      );
    });

    it(`${description}should render a not-so-simple Requirement diagram`, () => {
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

        interfaceRequirement test_req4 {
        id: 1.2.1
        text: the fourth test text.
        risk: medium
        verifymethod: analysis
        }

        physicalRequirement test_req5 {
        id: 1.2.2
        text: the fifth test text.
        risk: medium
        verifymethod: analysis
        }

        designConstraint test_req6 {
        id: 1.2.3
        text: the sixth test text.
        risk: medium
        verifymethod: analysis
        }

        element test_entity {
        type: simulation
        }

        element test_entity2 {
        type: word doc
        docRef: reqs/test_entity
        }

        element test_entity3 {
        type: "test suite"
        docRef: github.com/all_the_tests
        }


        test_entity - satisfies -> test_req2
        test_req - traces -> test_req2
        test_req - contains -> test_req3
        test_req3 - contains -> test_req4
        test_req4 - derives -> test_req5
        test_req5 - refines -> test_req6
        test_entity3 - verifies -> test_req5
        test_req <- copies - test_entity2
        `,
        options
      );
    });

    it(`${description}should render a not-so-simple Requirement diagram without htmlLabels`, () => {
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

        interfaceRequirement test_req4 {
        id: 1.2.1
        text: the fourth test text.
        risk: medium
        verifymethod: analysis
        }

        physicalRequirement test_req5 {
        id: 1.2.2
        text: the fifth test text.
        risk: medium
        verifymethod: analysis
        }

        designConstraint test_req6 {
        id: 1.2.3
        text: the sixth test text.
        risk: medium
        verifymethod: analysis
        }

        element test_entity {
        type: simulation
        }

        element test_entity2 {
        type: word doc
        docRef: reqs/test_entity
        }

        element test_entity3 {
        type: "test suite"
        docRef: github.com/all_the_tests
        }


        test_entity - satisfies -> test_req2
        test_req - traces -> test_req2
        test_req - contains -> test_req3
        test_req3 - contains -> test_req4
        test_req4 - derives -> test_req5
        test_req5 - refines -> test_req6
        test_entity3 - verifies -> test_req5
        test_req <- copies - test_entity2
        `,
        { ...options, htmlLabels: false }
      );
    });

    it(`${description}should render multiple Requirement diagrams`, () => {
      imgSnapshotTest(
        [
          `
    requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req
    `,
          `
    requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req
    `,
        ],
        options
      );
    });

    it(`${description}should render a Requirement diagram with empty information`, () => {
      imgSnapshotTest(
        `
    requirementDiagram
        requirement test_req {
        }
        element test_entity {
        }
        `,
        options
      );
    });

    it(`${description}should render requirements and elements with and without information`, () => {
      renderGraph(
        `
    requirementDiagram
        requirement test_req {
            id: 1
            text: the test text.
            risk: high
            verifymethod: test
        }
        element test_entity {
        }
        `,
        options
      );
    });

    it(`${description}should render requirements and elements with long and short text`, () => {
      renderGraph(
        `
    requirementDiagram
        requirement test_req {
            id: 1
            text: the test text that is long and takes up a lot of space.
            risk: high
            verifymethod: test
        }
        element test_entity_name_that_is_extra_long {
        }
        `,
        options
      );
    });

    it(`${description}should render requirements and elements with long and short text without htmlLabels`, () => {
      renderGraph(
        `
      requirementDiagram
          requirement test_req {
              id: 1
              text: the test text that is long and takes up a lot of space.
              risk: high
              verifymethod: test
          }
          element test_entity_name_that_is_extra_long {
          }
          `,
        { ...options, htmlLabels: false }
      );
    });

    it(`${description}should render requirements and elements with quoted text for spaces`, () => {
      renderGraph(
        `
      requirementDiagram
          requirement "test req name with spaces" {
              id: 1
              text: the test text that is long and takes up a lot of space.
              risk: high
              verifymethod: test
          }
          element "test entity name that is extra long with spaces" {
          }
          `,
        options
      );
    });

    it(`${description}should render requirements and elements with markdown text`, () => {
      renderGraph(
        `
      requirementDiagram
          requirement "__my bolded name__" {
              id: 1
              text: "**Bolded text** _italicized text_"
              risk: high
              verifymethod: test
          }
          element "*my italicized name*" {
            type: "**Bolded type** _italicized type_"
            docref: "*Italicized* __Bolded__"
          }
          `,
        options
      );
    });

    it(`${description}should render requirements and elements with markdown text without htmlLabels`, () => {
      renderGraph(
        `
      requirementDiagram
          requirement "__my bolded name__" {
              id: 1
              text: "**Bolded text** _italicized text_"
              risk: high
              verifymethod: test
          }
          element "*my italicized name*" {
            type: "**Bolded type** _italicized type_"
            docref: "*Italicized* __Bolded__"
          }
          `,
        { ...options, htmlLabels: false }
      );
    });

    it(`${description}should render a simple Requirement diagram with a title`, () => {
      imgSnapshotTest(
        `---
  title: simple Requirement diagram
  ---
    requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req
  `,
        options
      );
    });

    it(`${description}should render a Requirement diagram with TB direction`, () => {
      imgSnapshotTest(
        `
    requirementDiagram
    direction TB

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req
        `,
        options
      );
    });

    it(`${description}should render a Requirement diagram with BT direction`, () => {
      imgSnapshotTest(
        `
      requirementDiagram
      direction BT
  
      requirement test_req {
      id: 1
      text: the test text.
      risk: high
      verifymethod: test
      }
  
      element test_entity {
      type: simulation
      }
  
      test_entity - satisfies -> test_req
          `,
        options
      );
    });

    it(`${description}should render a Requirement diagram with LR direction`, () => {
      imgSnapshotTest(
        `
      requirementDiagram
      direction LR
  
      requirement test_req {
      id: 1
      text: the test text.
      risk: high
      verifymethod: test
      }
  
      element test_entity {
      type: simulation
      }
  
      test_entity - satisfies -> test_req
          `,
        options
      );
    });

    it(`${description}should render a Requirement diagram with RL direction`, () => {
      imgSnapshotTest(
        `
      requirementDiagram
      direction RL
  
      requirement test_req {
      id: 1
      text: the test text.
      risk: high
      verifymethod: test
      }
  
      element test_entity {
      type: simulation
      }
  
      test_entity - satisfies -> test_req
          `,
        options
      );
    });

    it(`${description}should render requirements and elements with styles applied from style statement`, () => {
      imgSnapshotTest(
        `
    requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req

    style test_req,test_entity fill:#f9f,stroke:blue, color:grey, font-weight:bold
        `,
        options
      );
    });

    it(`${description}should render requirements and elements with styles applied from style statement without htmlLabels`, () => {
      imgSnapshotTest(
        `
      requirementDiagram
  
      requirement test_req {
      id: 1
      text: the test text.
      risk: high
      verifymethod: test
      }
  
      element test_entity {
      type: simulation
      }
  
      test_entity - satisfies -> test_req
  
      style test_req,test_entity fill:#f9f,stroke:blue, color:grey, font-weight:bold
          `,
        { ...options, htmlLabels: false }
      );
    });

    it(`${description}should render requirements and elements with styles applied from class statement`, () => {
      imgSnapshotTest(
        `
requirementDiagram
  
      requirement test_req {
      id: 1
      text: the test text.
      risk: high
      verifymethod: test
      }
  
      element test_entity {
      type: simulation
      }
  
      test_entity - satisfies -> test_req
      classDef bold font-weight: bold
      classDef blue stroke:lightblue, color: #0000FF
      class test_entity bold
      class test_req blue, bold
        `,
        options
      );
    });

    it(`${description}should render requirements and elements with styles applied from class statement without htmlLabels`, () => {
      imgSnapshotTest(
        `
  requirementDiagram
    
        requirement test_req {
        id: 1
        text: the test text.
        risk: high
        verifymethod: test
        }
    
        element test_entity {
        type: simulation
        }
    
        test_entity - satisfies -> test_req
        classDef bold font-weight: bold
        classDef blue stroke:lightblue, color: #0000FF
        class test_entity bold
        class test_req blue, bold
          `,
        { ...options, htmlLabels: false }
      );
    });

    it(`${description}should render requirements and elements with styles applied from classes with shorthand syntax`, () => {
      imgSnapshotTest(
        `
  requirementDiagram
    
        requirement test_req:::blue {
        id: 1
        text: the test text.
        risk: high
        verifymethod: test
        }
    
        element test_entity {
        type: simulation
        }
    
        test_entity - satisfies -> test_req
        classDef bold font-weight: bold
        classDef blue stroke:lightblue, color: #0000FF
        test_entity:::bold
          `,
        options
      );
    });

    it(`${description}should render requirements and elements with styles applied from classes with shorthand syntax without htmlLabels`, () => {
      imgSnapshotTest(
        `
  requirementDiagram
    
        requirement test_req:::blue {
        id: 1
        text: the test text.
        risk: high
        verifymethod: test
        }
    
        element test_entity {
        type: simulation
        }
    
        test_entity - satisfies -> test_req
        classDef bold font-weight: bold
        classDef blue stroke:lightblue, color: #0000FF
        test_entity:::bold
          `,
        { ...options, htmlLabels: false }
      );
    });

    it(`${description}should render requirements and elements with styles applied from the default class and other styles`, () => {
      imgSnapshotTest(
        `
requirementDiagram
  
      requirement test_req:::blue {
      id: 1
      text: the test text.
      risk: high
      verifymethod: test
      }
  
      element test_entity {
      type: simulation
      }
  
      test_entity - satisfies -> test_req
      classDef blue stroke:lightblue, color:blue
      classDef default fill:pink
      style test_entity color:green
        `,
        options
      );
    });

    it(`${description}should render requirements and elements with styles applied from the default class and other styles without htmlLabels`, () => {
      imgSnapshotTest(
        `
  requirementDiagram
    
        requirement test_req:::blue {
        id: 1
        text: the test text.
        risk: high
        verifymethod: test
        }
    
        element test_entity {
        type: simulation
        }
    
        test_entity - satisfies -> test_req
        classDef blue stroke:lightblue, color:blue
        classDef default fill:pink
        style test_entity color:green
          `,
        { ...options, htmlLabels: false }
      );
    });

    it(`${description}should render a Requirement diagram with a theme`, () => {
      imgSnapshotTest(
        `
---
  theme: forest
---
  requirementDiagram
    
        requirement test_req:::blue {
        id: 1
        text: the test text.
        risk: high
        verifymethod: test
        }
    
        element test_entity {
        type: simulation
        }
    
        test_entity - satisfies -> test_req
          `,
        options
      );
    });
  });
});
