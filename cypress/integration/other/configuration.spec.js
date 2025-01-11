import { renderGraph, verifyScreenshot } from '../../helpers/util.ts';
describe('Configuration', () => {
  describe('arrowMarkerAbsolute', () => {
    it('should handle default value false of arrowMarkerAbsolute', () => {
      renderGraph(
        `graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
        `,
        {}
      );

      // Check the marker-end property to make sure it is properly set to
      // start with #
      cy.get('.edgePaths').within(() => {
        cy.get('path')
          .first()
          .should('have.attr', 'marker-end')
          .should('exist')
          .and('include', 'url(#');
      });
    });
    it('should handle default value false of arrowMarkerAbsolute', () => {
      renderGraph(
        `graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
        `,
        {}
      );

      // Check the marker-end property to make sure it is properly set to
      // start with #
      cy.get('.edgePaths').within(() => {
        cy.get('path')
          .first()
          .should('have.attr', 'marker-end')
          .should('exist')
          .and('include', 'url(#');
      });
    });
    it('should handle arrowMarkerAbsolute explicitly set to false', () => {
      renderGraph(
        `graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
        `,
        {
          arrowMarkerAbsolute: false,
        }
      );

      // Check the marker-end property to make sure it is properly set to
      // start with #
      cy.get('.edgePaths').within(() => {
        cy.get('path')
          .first()
          .should('have.attr', 'marker-end')
          .should('exist')
          .and('include', 'url(#');
      });
    });
    it('should handle arrowMarkerAbsolute explicitly set to "false" as false', () => {
      renderGraph(
        `graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
        `,
        {
          arrowMarkerAbsolute: 'false',
        }
      );

      // Check the marker-end property to make sure it is properly set to
      // start with #
      cy.get('.edgePaths').within(() => {
        cy.get('path')
          .first()
          .should('have.attr', 'marker-end')
          .should('exist')
          .and('include', 'url(#');
      });
    });
    it('should handle arrowMarkerAbsolute set to true', () => {
      renderGraph(
        `flowchart TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
        `,
        {
          arrowMarkerAbsolute: true,
        }
      );

      cy.get('.edgePaths').within(() => {
        cy.get('path')
          .first()
          .should('have.attr', 'marker-end')
          .should('exist')
          .and('include', 'url(http://localhost');
      });
    });
    it('should not taint the initial configuration when using multiple directives', () => {
      const url = 'http://localhost:9000/regression/issue-1874.html';
      cy.visit(url);
      cy.window().should('have.property', 'rendered', true);
      verifyScreenshot(
        'configuration.spec-should-not-taint-initial-configuration-when-using-multiple-directives'
      );
    });
  });

  describe('suppressErrorRendering', () => {
    beforeEach(() => {
      cy.on('uncaught:exception', (err, runnable) => {
        return !err.message.includes('Parse error on line');
      });
    });

    it('should not render error diagram if suppressErrorRendering is set', () => {
      const url = 'http://localhost:9000/suppressError.html?suppressErrorRendering=true';
      cy.visit(url);
      cy.window().should('have.property', 'rendered', true);
      cy.get('#test')
        .find('svg')
        .should(($svg) => {
          // all failing diagrams should not appear!
          expect($svg).to.have.length(2);
          // none of the diagrams should be error diagrams
          expect($svg).to.not.contain('Syntax error');
        });
      verifyScreenshot(
        'configuration.spec-should-not-render-error-diagram-if-suppressErrorRendering-is-set'
      );
    });

    it('should render error diagram if suppressErrorRendering is not set', () => {
      const url = 'http://localhost:9000/suppressError.html';
      cy.visit(url);
      cy.window().should('have.property', 'rendered', true);
      cy.get('#test')
        .find('svg')
        .should(($svg) => {
          // all five diagrams should be rendered
          expect($svg).to.have.length(5);
          // some of the diagrams should be error diagrams
          expect($svg).to.contain('Syntax error');
        });
      verifyScreenshot(
        'configuration.spec-should-render-error-diagram-if-suppressErrorRendering-is-not-set'
      );
    });
  });
});
