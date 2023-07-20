import { imgSnapshotTest } from '../../helpers/util.ts';
describe('Configuration', () => {
  describe('arrowMarkerAbsolute', () => {
    it('should handle default value false of arrowMarkerAbsolute', () => {
      imgSnapshotTest(
        `graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
        `
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
      imgSnapshotTest(
        `graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
        `
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
      imgSnapshotTest(
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
      imgSnapshotTest(
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
      imgSnapshotTest(
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
      cy.viewport(1440, 1024);
      cy.visit(url);

      cy.get('svg');
      cy.matchImageSnapshot(
        'configuration.spec-should-not-taint-initial-configuration-when-using-multiple-directives'
      );
    });
  });
});
