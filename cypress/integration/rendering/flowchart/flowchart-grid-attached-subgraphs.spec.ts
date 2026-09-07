import { renderGraph } from '../../../helpers/util.ts';

const gridAttachedSubgraphs = { layout: 'grid-attached-subgraphs', screenshot: false } as const;

const DEPLOY_PIPELINE = `flowchart TD
  A[Start Build] --> B[Compile Source]
  B --> C[Test Suite]
  C --> D{Tests Passed?}
  D -->|No| E[Notify Developer]
  E --> A
  D -->|Yes| F[Build Docker Image]

  subgraph Deploy Pipeline
    F --> G[Deploy to Staging]
    G --> H[Run Integration Tests]
    H --> I{Tests Passed?}
    I -->|No| J[Rollback & Alert]
    I -->|Yes| K[Deploy to Production]
  end

  K --> L([Success])
`;

describe('Flowchart grid-attached-subgraphs', () => {
  it('frames only its declared sparse subgraph members', () => {
    renderGraph(
      `flowchart TD
        A --- B
        A --- C
        B --- D
        C --- D
        D --- E
        D --- F
        E --- G
        F --- G
        A --- A1 --- A11
        A1 --- A12
        A --- A2 --- A21
        A2 --- A22
        F --- F1 --- F11
        F1 --- F12
        F --- F2 --- F21
        G --- G1 --- G11
        G1 --- G12
        subgraph Subgraph
          D
          A11
          G12
        end
      `,
      gridAttachedSubgraphs
    );

    cy.get('svg g.cluster').should('have.length', 1);
    cy.get('svg').then(($svg) => {
      const frame = $svg.find('g.cluster')[0].getBoundingClientRect();
      const members = new Set(['D', 'A11', 'G12']);
      const foreignInside = [...$svg.find('g.node')]
        .filter((node) => !members.has(node.textContent?.trim() ?? ''))
        .filter((node) => overlaps(frame, node.getBoundingClientRect()))
        .map((node) => node.textContent?.trim());

      expect(foreignInside, 'nodes claimed by the subgraph frame').to.deep.equal([]);
    });
  });

  it('keeps compacted bridge labels on their routes and connects the Yes arrow', () => {
    renderGraph(DEPLOY_PIPELINE, gridAttachedSubgraphs);

    cy.get('svg path[data-id="L_D_E_0"]').then(($path) => {
      const route = $path[0].getBoundingClientRect();
      cy.get('svg g.label[data-id="L_D_E_0"]').then(($label) => {
        const label = $label[0].getBoundingClientRect();
        const centreY = label.top + label.height / 2;

        // D--E moves with the compacted upstream region. The No label has to
        // move with its line, not remain at the bridge's former coordinates.
        expect(centreY, 'No label is centred on D--E').to.be.closeTo(
          route.top + route.height / 2,
          1
        );
        expect(label.left + label.width / 2, 'No label lies along D--E').to.be.within(
          route.left - 1,
          route.right + 1
        );
      });
    });

    cy.get('svg path[data-id="L_D_F_0"]').then(($path) => {
      const path = $path[0];
      const points = JSON.parse(atob(path.dataset.points ?? '')) as { x: number; y: number }[];
      const end = points.at(-1);
      const beforeEnd = points.at(-2);
      if (!end || !beforeEnd) {
        throw new Error('D--F has no endpoint');
      }

      cy.contains('svg g.node', 'Build Docker Image').then(($node) => {
        const target = $node[0].getBoundingClientRect();
        const screenEnd = new DOMPoint(end.x, end.y).matrixTransform(path.getScreenCTM()!);
        const screenBeforeEnd = new DOMPoint(beforeEnd.x, beforeEnd.y).matrixTransform(
          path.getScreenCTM()!
        );

        // The raw route endpoint is already clipped to F. The painter must not
        // re-clip the shortened bridge to the frame or leave its marker dangling.
        const reachesBoundary =
          ((Math.abs(screenEnd.x - target.left) < 1 || Math.abs(screenEnd.x - target.right) < 1) &&
            screenEnd.y >= target.top - 1 &&
            screenEnd.y <= target.bottom + 1) ||
          ((Math.abs(screenEnd.y - target.top) < 1 || Math.abs(screenEnd.y - target.bottom) < 1) &&
            screenEnd.x >= target.left - 1 &&
            screenEnd.x <= target.right + 1);
        expect(reachesBoundary, 'Yes arrow reaches F boundary').to.equal(true);

        // A port on F's left or right face must be approached horizontally;
        // otherwise the last run is parallel to the node border and reads as an
        // accidental attachment instead of an arrow entering the node.
        const entersSide =
          Math.abs(screenEnd.x - target.left) < 1 || Math.abs(screenEnd.x - target.right) < 1;
        if (entersSide) {
          expect(screenBeforeEnd.y, 'Yes arrow enters F perpendicular to its side').to.be.closeTo(
            screenEnd.y,
            1
          );
        }
      });
    });
  });

  it('keeps edge labels clear of nested subgraph titles', () => {
    cy.readFile('cypress/platform/dev-diagrams/layout-tests/hola-faithful/event.mmd').then(
      (diagram: string) => {
        renderGraph(diagram, gridAttachedSubgraphs);
      }
    );

    cy.get('svg').then(($svg) => {
      const titles = [...$svg.find('g.cluster-label')]
        .map((title) => ({ text: title.textContent?.trim(), rect: title.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0);
      const labels = [...$svg.find('g.edgeLabel')]
        .map((label) => ({ text: label.textContent?.trim(), rect: label.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0);

      const collisions = labels.flatMap((label) =>
        titles
          .filter((title) => overlaps(label.rect, title.rect))
          .map((title) => `${label.text} over ${title.text}`)
      );
      expect(collisions, 'edge labels must not cover subgraph titles').to.deep.equal([]);

      const update = labels.find((label) => label.text === 'Update');
      const onSelection = labels.find((label) => label.text === 'onSelection');
      if (!update || !onSelection) {
        throw new Error('Expected the two labelled Store-entry edges');
      }
      expect(
        onSelection.rect.left - update.rect.right,
        'Store-entry labels retain a readable gap'
      ).to.be.greaterThan(100);

      const connector = $svg.find('path[data-id="L_showConsole_consoleManager_0"]')[0];
      if (!connector) {
        throw new Error('Expected the showConsole--consoleManager connector');
      }
      const route = JSON.parse(atob(connector.dataset.points ?? '')) as { x: number; y: number }[];
      const quadraticBends = (connector.getAttribute('d')?.match(/Q/g) ?? []).length;
      expect(quadraticBends, 'short terminal turn is rounded at both corners').to.equal(2);

      const start = route[0];
      const firstTurn = route[1];
      const end = route.at(-1);
      if (!start || !firstTurn || !end) {
        throw new Error('Expected a complete showConsole--consoleManager route');
      }
      const routeSpan = Math.abs(end.y - start.y);
      const firstTurnOffset = Math.abs(firstTurn.y - start.y);
      expect(firstTurnOffset / routeSpan, 'turn is kept in the middle corridor').to.be.within(
        0.3,
        0.7
      );
    });
  });

  it('keeps the final convergence rank clear after compacting a wide-label diagram', () => {
    cy.readFile('cypress/platform/dev-diagrams/layout-tests/hola-faithful/life-choices.mmd').then(
      (diagram: string) => {
        renderGraph(diagram, gridAttachedSubgraphs);
      }
    );

    cy.contains('svg g.node', 'Spare time for hobbies').then(($spareTime) => {
      const spareTime = $spareTime[0].getBoundingClientRect();
      cy.contains('svg g.node', 'Happy life').then(($happyLife) => {
        const happyLife = $happyLife[0].getBoundingClientRect();

        // The narrower flow-axis grid may remove empty rows, but its final
        // convergence node must retain the normal rank clearance.
        expect(happyLife.top - spareTime.bottom, 'Happy life rank clearance').to.be.at.least(40);
      });
    });

    cy.get('svg').then(($svg) => {
      const betterWork = $svg.find('path[data-id="L_nh_ne_0"]')[0];
      const risk = $svg.find('path[data-id="L_n5_ne_0"]')[0];
      if (!betterWork || !risk) {
        throw new Error('Expected both routes converging on Happy life');
      }
      const betterRoute = JSON.parse(atob(betterWork.dataset.points ?? '')) as Point[];
      const riskRoute = JSON.parse(atob(risk.dataset.points ?? '')) as Point[];
      if (riskRoute.length < 2) {
        throw new Error('Risk route must contain an exit leg');
      }

      // Risk is the outer branch. It leaves south into the outside corridor,
      // then returns to Happy life through its far face; an upper corridor would
      // cut across Better work environment's final approach.
      expect(riskRoute[1].x, 'Risk first leg stays vertical').to.be.closeTo(riskRoute[0].x, 1e-6);
      expect(riskRoute[1].y, 'Risk first leg goes below the node').to.be.greaterThan(
        riskRoute[0].y
      );
      expect(polylineCrosses(betterRoute, riskRoute), 'converging routes do not cross').to.equal(
        false
      );
    });
  });
});

interface Point {
  x: number;
  y: number;
}

function overlaps(first: DOMRect, second: DOMRect): boolean {
  return (
    first.left < second.right - 1 &&
    second.left < first.right - 1 &&
    first.top < second.bottom - 1 &&
    second.top < first.bottom - 1
  );
}

function polylineCrosses(first: Point[], second: Point[]): boolean {
  for (let i = 1; i < first.length; i++) {
    for (let j = 1; j < second.length; j++) {
      if (segmentsCross(first[i - 1], first[i], second[j - 1], second[j])) {
        return true;
      }
    }
  }
  return false;
}

function segmentsCross(
  firstStart: Point,
  firstEnd: Point,
  secondStart: Point,
  secondEnd: Point
): boolean {
  const first = { x: firstEnd.x - firstStart.x, y: firstEnd.y - firstStart.y };
  const second = { x: secondEnd.x - secondStart.x, y: secondEnd.y - secondStart.y };
  const denominator = first.x * second.y - first.y * second.x;
  if (Math.abs(denominator) < 1e-9) {
    return false;
  }
  const offset = { x: secondStart.x - firstStart.x, y: secondStart.y - firstStart.y };
  const firstPosition = (offset.x * second.y - offset.y * second.x) / denominator;
  const secondPosition = (offset.x * first.y - offset.y * first.x) / denominator;
  return (
    firstPosition > 1e-6 &&
    firstPosition < 1 - 1e-6 &&
    secondPosition > 1e-6 &&
    secondPosition < 1 - 1e-6
  );
}
