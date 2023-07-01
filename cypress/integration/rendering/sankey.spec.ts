import { imgSnapshotTest, renderGraph } from '../../helpers/util.js';

describe('Sankey Diagram', () => {
  it('should render a simple example', () => {
    imgSnapshotTest(
      `
      sankey-beta
      
      sourceNode,targetNode,10
      `,
      {}
    );
  });

  describe('when given a linkColor', function () {
    it('links should be the same color as source node', () => {
      renderGraph(
        `
        sankey-beta
        
        sourceNode,targetNode,10
        `,
        {
          sankey: { linkColor: 'source' },
        }
      );

      cy.get('.link path').then((link) => {
        cy.get('.node[id="node-1"] rect').should(node =>
          expect(link.attr('stroke')).to.equal(node.attr('fill'))
        );
      });
    });

    it('should change link color to hex code', () => {
      renderGraph(
        `
        sankey-beta
        a,b,10
        `,
        {
          sankey: { linkColor: '#636465' },
        }
      );

      cy.get('.link path').should((link) => {
        expect(link.attr('stroke')).to.equal('#636465');
      });
    });

    it('links should be the same color as target node', () => {
      renderGraph(
        `
        sankey-beta
        sourceNode,targetNode,10
        `,
        {
          sankey: { linkColor: 'target' },
        }
      );

      cy.get('.link path').then((link) => {
        cy.get('.node[id="node-2"] rect').should(node =>
          expect(link.attr('stroke')).to.equal(node.attr('fill'))
        );
      });
    });

    it('links must be gradient', () => {
      renderGraph(
        `
        sankey-beta
        sourceNode,targetNode,10
        `,
        {
          sankey: { linkColor: 'gradient' },
        }
      );

      cy.get('.link path').should((link) => {
        expect(link.attr('stroke')).to.equal('url(#linearGradient-3)');
      });
    });
  });
});
