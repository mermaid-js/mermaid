import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('Usecase diagram', () => {
  it('should render a basic usecase diagram with actors and system boundary', () => {
    imgSnapshotTest(
      `
      usecaseDiagram
        actor "Customer" as C
        system "ATM" {
          usecase "Withdraw Cash" as UC1
          usecase "Check Balance" as UC2
        }
        C --> UC1
        C --> UC2
      `,
      { usecase: { useMaxWidth: false } }
    );
  });

  it('should handle multi-line labels in actors and usecases', () => {
    imgSnapshotTest(
      `
      usecaseDiagram
        actor "Multi-line<br/>Admin" as A
        usecase "Manage User<br/>Permissions" as UC
        A --> UC
      `,
      {}
    );
  });

  it('should render all relationship types (include, extend, generalization, etc.)', () => {
    imgSnapshotTest(
      `
      usecaseDiagram
        actor "Member" as M
        actor "Guest" as G
        generalization: M --> G

        system "Store" {
          usecase "Checkout" as CO
          usecase "Calculate Tax" as CT
          usecase "Apply Coupon" as AC
        }

        M --> CO
        include: CO --> CT
        extend: CO --> AC
      `,
      {}
    );
  });

  it('should render notes and anchors correctly', () => {
    imgSnapshotTest(
      `
      usecaseDiagram
        actor "Auditor" as A
        usecase "Verify Records" as VR
        note "Must be signed off<br/>by department head" as N1
        
        A --> VR
        anchor: N1 --> VR
      `,
      {}
    );
  });

  it('should support external systems and constraints', () => {
    imgSnapshotTest(
      `
      usecaseDiagram
        usecase "Auth" as UC1
        external "Identity Provider" as IDP
        note "OIDC Protocol" as N1
        
        UC1 --> IDP
        constraint: UC1 --> N1
      `,
      {}
    );
  });

  it('should handle SVG width and max-width scaling', () => {
    renderGraph(
      `
      usecaseDiagram
        actor "User" as U
        system "App" {
          usecase "Action" as A
        }
        U --> A
      `,
      { usecase: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
    });
  });

  describe('Theme and Configuration', () => {
    it('should apply custom actor and usecase margins', () => {
      imgSnapshotTest(
        `
        usecaseDiagram
          actor A
          usecase U
          A --> U
        `,
        {
          usecase: {
            actorMargin: 100,
            useCaseMargin: 80,
          },
        }
      );
    });

    it('should render dark theme via init directive', () => {
      imgSnapshotTest(
        `
        %%{init: {'theme': 'dark', 'config': {'fontSize': 20}}}%%
        usecaseDiagram
          actor Admin as A
          usecase "Delete Records" as DR
          A --> DR
        `,
        {}
      );
    });

    it('should render correctly with empty system boundaries', () => {
      imgSnapshotTest(
        `
        usecaseDiagram
          actor User as U
          system "Empty System" {
          }
          usecase "Something Outside" as SO
          U --> SO
        `,
        {}
      );
    });

    it('should handle special characters in labels', () => {
      imgSnapshotTest(
        `
        usecaseDiagram
          actor "User (New)" as U
          usecase "Process #1 & #2" as UC
          U --> UC
        `,
        {}
      );
    });
  });
});
