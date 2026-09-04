import { renderGraph } from '../../../helpers/util.ts';

const gridAttachedSubgraphs = { layout: 'grid-attached-subgraphs', screenshot: false } as const;

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
});

function overlaps(first: DOMRect, second: DOMRect): boolean {
  return (
    first.left < second.right - 1 &&
    second.left < first.right - 1 &&
    first.top < second.bottom - 1 &&
    second.top < first.bottom - 1
  );
}
