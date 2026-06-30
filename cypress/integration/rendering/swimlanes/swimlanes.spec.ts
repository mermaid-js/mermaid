import { imgSnapshotTest, renderGraph } from '../../../helpers/util.ts';

const SWIMLANE_FIXTURE_DIR = 'cypress/platform/dev-diagrams/layout-tests/swimlanes';

const readSwimlaneFixtures = (): string[] => {
  const fixtures = Cypress.env('swimlaneFixtures');
  return Array.isArray(fixtures) && fixtures.every((fixture) => typeof fixture === 'string')
    ? fixtures
    : [];
};

const SWIMLANE_FIXTURES = readSwimlaneFixtures();

// A representative subset additionally rendered in handdrawn/rough mode. Swimlanes
// inherits rough rendering from the flowchart node shapes and the shared cluster
// renderer (both branch on `look === 'handDrawn'`); these snapshots exercise that
// path. Kept small to limit snapshot churn — a decision diamond, edge labels, and
// a wide multi-lane top-to-bottom diagram.
const HANDDRAWN_FIXTURES = [
  '4-car-fun-sales-tb.mmd',
  '9-edge-labels.mmd',
  'intake-review-complete.mmd',
];

const shapeSelector = 'rect, polygon, ellipse, circle, path';
const edgePathSelector = 'g.edgePath path.path, g.edgePath path';

const asStandaloneSwimlanes = (source: string): string => {
  // Every swimlanes layout-test fixture declares the standalone `swimlanes`
  // diagram type directly, so it is rendered as-is. This guard keeps that
  // invariant — a fixture authored as flowchart/graph would fail here.
  expect(source, 'fixture should declare the standalone swimlane diagram type').to.match(
    /^\s*swimlane-beta\s/m
  );
  return source;
};

// Swimlanes fixtures render with SVG labels (htmlLabels:false) for stable
// cross-browser text, and natural width so the whole diagram is captured.
const swimlanesFlowchartConfig = { htmlLabels: false, useMaxWidth: false } as const;

// Capture an Argos visual-regression snapshot of a swimlanes diagram. Named
// after the enclosing test. Used for the fixture sweep so the suite can catch
// rendering regressions, not just structural ones.
const snapshotSwimlanes = (
  graph: string,
  options: Parameters<typeof imgSnapshotTest>[1] = {}
): void => {
  const { flowchart, ...rest } = options;
  imgSnapshotTest(graph, {
    logLevel: 0,
    ...rest,
    flowchart: {
      ...swimlanesFlowchartConfig,
      ...flowchart,
    },
  });
};

// Render without a screenshot — used by the behaviour tests below that assert on
// the DOM/CSS rather than the rendered pixels.
const renderSwimlanes = (
  graph: string,
  name: string,
  options: Parameters<typeof renderGraph>[1] = {}
): void => {
  const { flowchart, ...rest } = options;
  renderGraph(graph, {
    screenshot: false,
    logLevel: 0,
    name,
    ...rest,
    flowchart: {
      ...swimlanesFlowchartConfig,
      ...flowchart,
    },
  });
};

const assertStandaloneSwimlanesRendered = (): void => {
  cy.get('svg').should('have.attr', 'aria-roledescription', 'swimlane');
  cy.get('svg .error-icon').should('not.exist');
  cy.get('g.cluster.swimlane').its('length').should('be.greaterThan', 0);
  // Nodes are `g.node` in the classic look and `g.rough-node` in handdrawn/rough.
  cy.get('g.node, g.rough-node').its('length').should('be.greaterThan', 0);
};

const nodeShape = (label: string): Cypress.Chainable<JQuery<HTMLElement>> => {
  return cy.contains('g.node', label).find(shapeSelector).first();
};

describe('Swimlanes diagram', () => {
  it('covers every swimlanes layout-test fixture', () => {
    expect(SWIMLANE_FIXTURES.length, 'generated swimlane fixture inventory').to.be.greaterThan(0);
    cy.task('listSwimlaneFixtures').should('deep.equal', SWIMLANE_FIXTURES);
  });

  SWIMLANE_FIXTURES.forEach((fixture) => {
    it(`renders ${fixture} as a standalone swimlanes diagram`, () => {
      cy.readFile(`${SWIMLANE_FIXTURE_DIR}/${fixture}`, 'utf8').then((source) => {
        snapshotSwimlanes(asStandaloneSwimlanes(source));
        assertStandaloneSwimlanesRendered();
      });
    });
  });

  describe('handdrawn (rough) look', () => {
    HANDDRAWN_FIXTURES.forEach((fixture) => {
      it(`renders ${fixture} in handdrawn look`, () => {
        cy.readFile(`${SWIMLANE_FIXTURE_DIR}/${fixture}`, 'utf8').then((source) => {
          snapshotSwimlanes(asStandaloneSwimlanes(source), { look: 'handDrawn' });
          assertStandaloneSwimlanesRendered();
        });
      });
    });
  });

  it('defaults to the swimlanes layout without an explicit layout config', () => {
    renderSwimlanes(
      `swimlane-beta LR
        subgraph Intake
          A[Request]
        end
        subgraph Delivery
          B[Build]
        end
        A --> B
      `,
      'swimlanes-default-layout'
    );

    assertStandaloneSwimlanesRendered();
    cy.get('g.cluster.swimlane').should('have.length', 2);
  });

  it('applies custom theme variables', () => {
    renderSwimlanes(
      `swimlane-beta LR
        subgraph ThemeLane
          A[Themed node]
          B[Next node]
        end
        A --> B
      `,
      'swimlanes-custom-theme',
      {
        theme: 'base',
        themeVariables: {
          mainBkg: '#ffe1ef',
          nodeBorder: '#225577',
          lineColor: '#118844',
        },
      }
    );

    assertStandaloneSwimlanesRendered();
    nodeShape('Themed node').should(($shape) => {
      expect($shape.css('fill')).to.eq('rgb(255, 225, 239)');
      expect($shape.css('stroke')).to.eq('rgb(34, 85, 119)');
    });
    cy.get(edgePathSelector)
      .first()
      .should(($path) => {
        expect($path.css('stroke')).to.eq('rgb(17, 136, 68)');
      });
  });

  it('applies flowchart style and linkStyle statements', () => {
    renderSwimlanes(
      `swimlane-beta LR
        subgraph StyledLane
          A[Styled node]
          B[Linked node]
        end
        A --> B
        style A fill:#ff99cc,stroke:#003366,stroke-width:5px,color:#111111
        linkStyle 0 stroke:#ff6600,stroke-width:5px
      `,
      'swimlanes-style-statements'
    );

    assertStandaloneSwimlanesRendered();
    nodeShape('Styled node').should(($shape) => {
      expect($shape.css('fill')).to.eq('rgb(255, 153, 204)');
      expect($shape.css('stroke')).to.eq('rgb(0, 51, 102)');
      expect($shape.css('stroke-width')).to.eq('5px');
    });
    cy.get(edgePathSelector)
      .first()
      .should(($path) => {
        expect($path.css('stroke')).to.eq('rgb(255, 102, 0)');
        expect($path.css('stroke-width')).to.eq('5px');
      });
  });

  it('applies classDef and class statements', () => {
    renderSwimlanes(
      `swimlane-beta LR
        subgraph ClassLane
          A[Classed node]
          B[Default node]
        end
        A --> B
        classDef highlighted fill:#bbf,stroke:#f66,stroke-width:4px,color:#000000
        class A highlighted
      `,
      'swimlanes-classdef'
    );

    assertStandaloneSwimlanesRendered();
    cy.contains('g.node.highlighted', 'Classed node').should('exist');
    nodeShape('Classed node').should(($shape) => {
      expect($shape.css('fill')).to.eq('rgb(187, 187, 255)');
      expect($shape.css('stroke')).to.eq('rgb(255, 102, 102)');
      expect($shape.css('stroke-width')).to.eq('4px');
    });
  });

  it('puts nodes without an explicit subgraph into a default swimlane', () => {
    renderSwimlanes(
      `swimlane-beta LR
        subgraph OwnedLane
          A[Owned node]
        end
        Loose[Loose node] --> A
      `,
      'swimlanes-default-lane'
    );

    assertStandaloneSwimlanesRendered();
    cy.get('g.cluster.swimlane[data-id="__swimlane_default__"]').should('exist');
    cy.contains('g.node', 'Loose node').should('exist');
  });
});
