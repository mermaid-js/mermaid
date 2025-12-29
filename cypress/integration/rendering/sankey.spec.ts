import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

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
    this.beforeAll(() => {
      cy.wrap(
        `sankey
      a,b,10
      `
      ).as('graph');
    });

    it('links should use hex color', function () {
      renderGraph(this.graph, { sankey: { linkColor: '#636465' } });

      cy.get('.link path').should((link) => {
        expect(link.attr('stroke')).to.equal('#636465');
      });
    });

    it('links should be the same color as source node', function () {
      renderGraph(this.graph, { sankey: { linkColor: 'source' } });

      cy.get('.link path').then((link) => {
        cy.get('.node[id="node-1"] rect').should((node) =>
          expect(link.attr('stroke')).to.equal(node.attr('fill'))
        );
      });
    });

    it('links should be the same color as target node', function () {
      renderGraph(this.graph, { sankey: { linkColor: 'target' } });

      cy.get('.link path').then((link) => {
        cy.get('.node[id="node-2"] rect').should((node) =>
          expect(link.attr('stroke')).to.equal(node.attr('fill'))
        );
      });
    });

    it('links must be gradient', function () {
      renderGraph(this.graph, { sankey: { linkColor: 'gradient' } });

      cy.get('.link path').should((link) => {
        expect(link.attr('stroke')).to.equal('url(#linearGradient-3)');
      });
    });
  });

  describe('when given a nodeAlignment', function () {
    this.beforeAll(() => {
      cy.wrap(
        `
        sankey

        a,b,8
        b,c,8
        c,d,8
        d,e,8

        x,c,4
        c,y,4
        `
      ).as('graph');
    });

    this.afterEach(() => {
      cy.get('.node[id="node-1"]').should((node) => {
        expect(node.attr('x')).to.equal('0');
      });
      cy.get('.node[id="node-2"]').should((node) => {
        expect(node.attr('x')).to.equal('100');
      });
      cy.get('.node[id="node-3"]').should((node) => {
        expect(node.attr('x')).to.equal('200');
      });
      cy.get('.node[id="node-4"]').should((node) => {
        expect(node.attr('x')).to.equal('300');
      });
      cy.get('.node[id="node-5"]').should((node) => {
        expect(node.attr('x')).to.equal('400');
      });
    });

    it('should justify nodes', function () {
      renderGraph(this.graph, {
        sankey: { nodeAlignment: 'justify', width: 410, useMaxWidth: false },
      });
      cy.get('.node[id="node-6"]').should((node) => {
        expect(node.attr('x')).to.equal('0');
      });
      cy.get('.node[id="node-7"]').should((node) => {
        expect(node.attr('x')).to.equal('400');
      });
    });

    it('should align nodes left', function () {
      renderGraph(this.graph, {
        sankey: { nodeAlignment: 'left', width: 410, useMaxWidth: false },
      });
      cy.get('.node[id="node-6"]').should((node) => {
        expect(node.attr('x')).to.equal('0');
      });
      cy.get('.node[id="node-7"]').should((node) => {
        expect(node.attr('x')).to.equal('300');
      });
    });

    it('should align nodes right', function () {
      renderGraph(this.graph, {
        sankey: { nodeAlignment: 'right', width: 410, useMaxWidth: false },
      });
      cy.get('.node[id="node-6"]').should((node) => {
        expect(node.attr('x')).to.equal('100');
      });
      cy.get('.node[id="node-7"]').should((node) => {
        expect(node.attr('x')).to.equal('400');
      });
    });

    it('should center nodes', function () {
      renderGraph(this.graph, {
        sankey: { nodeAlignment: 'center', width: 410, useMaxWidth: false },
      });
      cy.get('.node[id="node-6"]').should((node) => {
        expect(node.attr('x')).to.equal('100');
      });
      cy.get('.node[id="node-7"]').should((node) => {
        expect(node.attr('x')).to.equal('300');
      });
    });
  });

  describe('when given a labelStyle', function () {
    this.beforeAll(() => {
      cy.wrap(
        `sankey
        a,b,10
        b,c,10
        `
      ).as('graph');
    });

    it('should render with outlined style by default', function () {
      renderGraph(this.graph, { sankey: {} });

      // Default style should create background and foreground label elements
      cy.get('.node-labels .sankey-label-bg').should('exist');
      cy.get('.node-labels .sankey-label-fg').should('exist');
    });

    it('should render legacy (plain) labels when labelStyle is legacy', function () {
      renderGraph(this.graph, { sankey: { labelStyle: 'legacy' } });

      // Legacy style should not have the outlined label classes
      cy.get('.node-labels .sankey-label-bg').should('not.exist');
      cy.get('.node-labels .sankey-label-fg').should('not.exist');
      cy.get('.node-labels text').should('exist');
    });

    it('should render outlined labels when labelStyle is default', function () {
      renderGraph(this.graph, { sankey: { labelStyle: 'default' } });

      cy.get('.node-labels .sankey-label-bg').should('exist');
      cy.get('.node-labels .sankey-label-fg').should('exist');
    });
  });

  describe('when given nodeWidth and nodePadding', function () {
    it('should respect custom nodeWidth', function () {
      renderGraph(
        `sankey
        a,b,10
        `,
        { sankey: { nodeWidth: 20, useMaxWidth: false } }
      );

      cy.get('.node rect')
        .first()
        .should((node) => {
          expect(parseFloat(node.attr('width') ?? '0')).to.equal(20);
        });
    });

    it('should use default nodeWidth of 10', function () {
      renderGraph(
        `sankey
        a,b,10
        `,
        { sankey: { useMaxWidth: false } }
      );

      cy.get('.node rect')
        .first()
        .should((node) => {
          expect(parseFloat(node.attr('width') ?? '0')).to.equal(10);
        });
    });
  });

  describe('smart label positioning', function () {
    it('should render labels with Apple-style outlined text', () => {
      imgSnapshotTest(
        `
        sankey

        iPhone,Products,205
        Mac,Products,40
        iPad,Products,29
        Wearables,Products,41
        Products,Revenue,315
        Services,Revenue,78
        Revenue,Cost of Revenue,223
        Revenue,Gross Profit,170
        Gross Profit,Op Expenses,51
        Gross Profit,Op Profit,119
        Op Profit,Tax,19
        Op Profit,Net Profit,100
        `,
        { sankey: { width: 800, height: 500, labelStyle: 'default' } }
      );
    });

    it('should position left-of-center labels on the left', () => {
      // Multi-layer diagram where we can verify label positioning
      renderGraph(
        `sankey
        a,b,10
        b,c,10
        c,d,10
        `,
        { sankey: { width: 400, useMaxWidth: false } }
      );

      // Node 'a' is at layer 0 (leftmost), should have label on left (text-anchor: end)
      cy.get('.node-labels text')
        .first()
        .should((label) => {
          expect(label.attr('text-anchor')).to.equal('end');
        });

      // Node 'd' is at layer 3 (rightmost), should have label on right (text-anchor: start)
      cy.get('.node-labels text')
        .last()
        .should((label) => {
          expect(label.attr('text-anchor')).to.equal('start');
        });
    });
  });

  describe('when given nodeColors', function () {
    it('should use custom colors for specified nodes', function () {
      renderGraph(
        `sankey
        a,b,10
        b,c,10
        `,
        {
          sankey: {
            nodeColors: {
              a: '#ff0000',
              b: '#00ff00',
              c: '#0000ff',
            },
          },
        }
      );

      cy.get('.node[id="node-1"] rect').should((node) => {
        expect(node.attr('fill')).to.equal('#ff0000');
      });
      cy.get('.node[id="node-2"] rect').should((node) => {
        expect(node.attr('fill')).to.equal('#00ff00');
      });
      cy.get('.node[id="node-3"] rect').should((node) => {
        expect(node.attr('fill')).to.equal('#0000ff');
      });
    });

    it('should fall back to default color scheme for unspecified nodes', function () {
      renderGraph(
        `sankey
        a,b,10
        b,c,10
        `,
        {
          sankey: {
            nodeColors: {
              a: '#ff0000',
            },
          },
        }
      );

      cy.get('.node[id="node-1"] rect').should((node) => {
        expect(node.attr('fill')).to.equal('#ff0000');
      });
      // Node 'b' should use default color scheme (not #ff0000)
      cy.get('.node[id="node-2"] rect').should((node) => {
        expect(node.attr('fill')).to.not.equal('#ff0000');
      });
    });

    it('should render Apple-style financial diagram with custom colors', () => {
      imgSnapshotTest(
        `
        sankey

        iPhone,Products,205
        Mac,Products,40
        iPad,Products,29
        Wearables,Products,41
        Products,Revenue,315
        Services,Revenue,78
        Revenue,Cost of Revenue,223
        Revenue,Gross Profit,170
        Gross Profit,Op Expenses,51
        Gross Profit,Op Profit,119
        Op Profit,Tax,19
        Op Profit,Net Profit,100
        `,
        {
          sankey: {
            width: 800,
            height: 500,
            labelStyle: 'default',
            showValues: true,
            prefix: '$',
            suffix: 'B',
            nodeColors: {
              iPhone: '#6e6e73',
              Mac: '#6e6e73',
              iPad: '#6e6e73',
              Wearables: '#6e6e73',
              Products: '#6e6e73',
              Services: '#6e6e73',
              Revenue: '#424245',
              'Cost of Revenue': '#ff3b30',
              'Gross Profit': '#34c759',
              'Op Expenses': '#ff3b30',
              'Op Profit': '#34c759',
              Tax: '#ff3b30',
              'Net Profit': '#34c759',
            },
          },
        }
      );
    });
  });
});
