/// <reference types="Cypress" />

import { renderGraph } from '../../helpers/util';
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
      cy.get('.edgePath path')
        .first()
        .should('have.attr', 'marker-end')
        .should('exist')
        .and('include', 'url(#');
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
      cy.get('.edgePath path')
        .first()
        .should('have.attr', 'marker-end')
        .should('exist')
        .and('include', 'url(#');
    });
    it('should handle arrowMarkerAbsolute excplicitly set to false', () => {
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
      cy.get('.edgePath path')
        .first()
        .should('have.attr', 'marker-end')
        .should('exist')
        .and('include', 'url(#');
    });
    it('should handle arrowMarkerAbsolute excplicitly set to "false" as false', () => {
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
      cy.get('.edgePath path')
        .first()
        .should('have.attr', 'marker-end')
        .should('exist')
        .and('include', 'url(#');
    });
    it('should handle arrowMarkerAbsolute set to true', () => {
      renderGraph(
        `graph TD
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

      cy.get('.edgePath path')
        .first()
        .should('have.attr', 'marker-end')
        .should('exist')
        .and('include', 'url(http://localhost');
    });
    it('should not taint the initial configuration when using multiple directives', () => {
      const url = 'http://localhost:9000/regression/issue-1874.html';
      cy.viewport(1440, 1024);
      cy.visit(url);

      cy.wait(1000);
      cy.get('#first svg').toMatchImageSnapshot();
      cy.get('#second svg').toMatchImageSnapshot();
      // cy.matchImageSnapshot(
      //   'configuration.spec-should-not-taint-initial-configuration-when-using-multiple-directives'
      // );
    });
  });
});
