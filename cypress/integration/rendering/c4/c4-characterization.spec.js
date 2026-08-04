import { imgSnapshotTest } from '../../../helpers/util.ts';

describe('C4 characterization', () => {
  describe('elements', () => {
    it('CHAR.person should render Person and Person_Ext', () => {
      imgSnapshotTest(
        `C4Context
        title Person elements
        Person(p, "Internal Person", "An authenticated user")
        Person_Ext(pe, "External Person", "An anonymous visitor")
        Rel(pe, p, "Contacts")
        `,
        {}
      );
    });

    it('CHAR.system should render every System variant', () => {
      imgSnapshotTest(
        `C4Context
        title System variants
        System(s, "System", "A software system")
        System_Ext(se, "System_Ext", "An external software system")
        SystemDb(sdb, "SystemDb", "A data store")
        SystemDb_Ext(sdbe, "SystemDb_Ext", "An external data store")
        SystemQueue(sq, "SystemQueue", "A message queue")
        SystemQueue_Ext(sqe, "SystemQueue_Ext", "An external message queue")
        `,
        {}
      );
    });

    it('CHAR.container should render every Container variant', () => {
      imgSnapshotTest(
        `C4Container
        title Container variants
        Container(c, "Container", "Tech", "A container")
        Container_Ext(ce, "Container_Ext", "Tech", "An external container")
        ContainerDb(cdb, "ContainerDb", "Tech", "A database container")
        ContainerDb_Ext(cdbe, "ContainerDb_Ext", "Tech", "An external database container")
        ContainerQueue(cq, "ContainerQueue", "Tech", "A queue container")
        ContainerQueue_Ext(cqe, "ContainerQueue_Ext", "Tech", "An external queue container")
        `,
        {}
      );
    });

    it('CHAR.component should render every Component variant', () => {
      imgSnapshotTest(
        `C4Component
        title Component variants
        Component(c, "Component", "Tech", "A component")
        Component_Ext(ce, "Component_Ext", "Tech", "An external component")
        ComponentDb(cdb, "ComponentDb", "Tech", "A database component")
        ComponentDb_Ext(cdbe, "ComponentDb_Ext", "Tech", "An external database component")
        ComponentQueue(cq, "ComponentQueue", "Tech", "A queue component")
        ComponentQueue_Ext(cqe, "ComponentQueue_Ext", "Tech", "An external queue component")
        `,
        {}
      );
    });
  });

  describe('boundaries', () => {
    it('CHAR.boundary-enterprise should render Enterprise_Boundary', () => {
      imgSnapshotTest(
        `C4Context
        title Enterprise boundary
        Enterprise_Boundary(b, "Enterprise") {
          System(s, "System", "inside the enterprise boundary")
        }
        `,
        {}
      );
    });

    it('CHAR.boundary-system should render System_Boundary', () => {
      imgSnapshotTest(
        `C4Container
        title System boundary
        System_Boundary(b, "System") {
          Container(c, "Container", "Tech", "inside the system boundary")
        }
        `,
        {}
      );
    });

    it('CHAR.boundary-container should render Container_Boundary', () => {
      imgSnapshotTest(
        `C4Component
        title Container boundary
        Container_Boundary(b, "Container") {
          Component(c, "Component", "Tech", "inside the container boundary")
        }
        `,
        {}
      );
    });

    it('CHAR.boundary-generic should render a generic Boundary with a type', () => {
      imgSnapshotTest(
        `C4Context
        title Generic boundary
        Boundary(b, "Group", "group") {
          System(s, "System", "inside a generic boundary")
        }
        `,
        {}
      );
    });

    it('CHAR.boundary-nested should render nested boundaries', () => {
      imgSnapshotTest(
        `C4Context
        title Nested boundaries
        Enterprise_Boundary(e, "Enterprise") {
          System_Boundary(s, "System") {
            System(sys, "System", "deeply nested")
          }
        }
        `,
        {}
      );
    });
  });

  describe('relationships', () => {
    it('CHAR.rel-directions should render every directional Rel', () => {
      imgSnapshotTest(
        `C4Context
        title Relationship directions
        System(a, "A")
        System(b, "B")
        System(c, "C")
        System(d, "D")
        System(e, "E")
        Rel(a, b, "Rel (default)")
        Rel_U(a, c, "Rel_U")
        Rel_D(a, d, "Rel_D")
        Rel_L(a, e, "Rel_L")
        Rel_R(b, c, "Rel_R")
        `,
        {}
      );
    });

    it('CHAR.rel-bidirectional should render BiRel', () => {
      imgSnapshotTest(
        `C4Context
        title Bidirectional relationship
        System(a, "A")
        System(b, "B")
        BiRel(a, b, "talks to")
        `,
        {}
      );
    });

    it('CHAR.rel-back should render Rel_Back', () => {
      imgSnapshotTest(
        `C4Container
        title Rel_Back
        Container(a, "A", "Tech")
        Container(b, "B", "Tech")
        Rel_Back(a, b, "reads from", "JDBC")
        `,
        {}
      );
    });

    it('CHAR.rel-techn-descr should render a relationship with technology and description', () => {
      imgSnapshotTest(
        `C4Context
        title Relationship technology and description
        System(a, "A")
        System(b, "B")
        Rel(a, b, "Makes API calls to", "HTTPS")
        `,
        {}
      );
    });
  });

  describe('diagram types', () => {
    it('CHAR.dynamic should render a C4Dynamic diagram with numbered steps', () => {
      imgSnapshotTest(
        `C4Dynamic
        title Dynamic diagram
        ContainerDb(db, "Database", "SQL")
        Container(api, "API", "Java")
        Container(spa, "SPA", "Angular")
        Rel(spa, api, "1. Submits credentials")
        Rel(api, db, "2. Validates against")
        Rel(api, spa, "3. Returns token")
        `,
        {}
      );
    });

    it('CHAR.deployment should render a C4Deployment diagram with nested nodes', () => {
      imgSnapshotTest(
        `C4Deployment
        title Deployment diagram
        Deployment_Node(dc, "Data Center", "us-east-1") {
          Deployment_Node(srv, "App Server", "Ubuntu 22.04") {
            Container(api, "API", "Java, Spring")
          }
          Deployment_Node(dbn, "DB Server", "Ubuntu 22.04") {
            ContainerDb(db, "Database", "PostgreSQL")
          }
        }
        Rel(api, db, "reads/writes", "JDBC")
        `,
        {}
      );
    });

    it('CHAR.deployment-aliases should accept the Node / Node_L / Node_R aliases', () => {
      // Node, Node_L and Node_R are aliases of Deployment_Node (grammar) - this
      // baselines that the aliases produce equivalent output to CHAR.deployment.
      imgSnapshotTest(
        `C4Deployment
        title Deployment node aliases
        Node(dc, "Data Center", "us-east-1") {
          Node_L(srv, "App Server", "Ubuntu 22.04") {
            Container(api, "API", "Java, Spring")
          }
          Node_R(dbn, "DB Server", "Ubuntu 22.04") {
            ContainerDb(db, "Database", "PostgreSQL")
          }
        }
        Rel(api, db, "reads/writes", "JDBC")
        `,
        {}
      );
    });
  });

  describe('styling and layout macros', () => {
    it('CHAR.update-element-style should apply UpdateElementStyle colours', () => {
      imgSnapshotTest(
        `C4Context
        title UpdateElementStyle
        Person(p, "Person")
        System(s, "System")
        Rel(p, s, "Uses")
        UpdateElementStyle(p, $fontColor="white", $bgColor="purple", $borderColor="black")
        `,
        {}
      );
    });

    it('CHAR.update-element-shape should apply the $shape="cylinder" override ($shape="folder" not yet supported)', () => {
      imgSnapshotTest(
        `C4Container
        title UpdateElementStyle shape override (folder not yet supported)
        Container(a, "Default", "Tech", "no override")
        Container(b, "As Folder", "Tech", "shape override")
        Container(c, "As Cylinder", "Tech", "shape override")
        UpdateElementStyle(b, $shape="folder")
        UpdateElementStyle(c, $shape="cylinder")
        `,
        {}
      );
      // the cylinder renders as a path; the folder override falls back to the plain box
      // (scoped to .node to exclude unrelated defs/marker paths)
      cy.get('.node path').should('have.length', 1);
      cy.get('.node > rect').should('have.length', 2);
    });

    it('CHAR.update-rel-style should apply UpdateRelStyle offsets and colors', () => {
      imgSnapshotTest(
        `C4Context
        title UpdateRelStyle
        System(a, "A")
        System(b, "B")
        Rel(a, b, "Uses")
        UpdateRelStyle(a, b, $textColor="blue", $lineColor="blue", $offsetX="5", $offsetY="-10")
        `,
        {}
      );
    });

    it('CHAR.update-layout-config should apply UpdateLayoutConfig shapes-per-row', () => {
      imgSnapshotTest(
        [2, 4].map(
          (shapesInRow) => `C4Context
        title UpdateLayoutConfig ($c4ShapeInRow=${shapesInRow})
        System(a, "A")
        System(b, "B")
        System(c, "C")
        System(d, "D")
        UpdateLayoutConfig($c4ShapeInRow="${shapesInRow}", $c4BoundaryInRow="1")
        `
        ),
        {}
      );
    });
  });

  describe('element attributes', () => {
    it('CHAR.tags should accept $tags on elements (not yet supported by renderer)', () => {
      imgSnapshotTest(
        `C4Context
        title Tags attribute (not shown by current renderer)
        Person(p, "Person", "desc", $tags="v1.0")
        System(s, "System", "desc", $tags="v1.0")
        Rel(p, s, "Uses")
        `,
        {}
      );
      cy.get('svg').should('not.contain', 'v1.0');
    });

    it('CHAR.link should accept $link on elements (not yet supported by renderer)', () => {
      imgSnapshotTest(
        `C4Context
        title Link attribute (not shown by current renderer)
        Person(p, "Person", "desc", $link="https://example.com")
        System(s, "System", "desc")
        Rel(p, s, "Uses")
        `,
        {}
      );
      cy.get('svg').find('a').should('not.exist');
    });

    it('CHAR.sprite should accept the $sprite attribute (not yet supported by renderer)', () => {
      imgSnapshotTest(
        `C4Container
        title Sprite attribute (not shown by current renderer)
        Container(a, "Browser", "Tech", "single-page app", $sprite="browser")
        Container(b, "Terminal", "Tech", "server-side app", $sprite="terminal")
        `,
        {}
      );
      // both containers fall back to the plain box; a sprite implementation must break this
      cy.get('image').should('not.exist');
      cy.get('svg svg').should('not.exist');
      cy.get('.node > rect').should('have.length', 2);
    });

    it('CHAR.descr-wrapping should wrap long descriptions as SVG text (the wrap-config bug in #7949 is unrelated)', () => {
      imgSnapshotTest(
        `C4Context
        title Description wrapping
        Person(p, "Person", "A customer of the bank with personal bank accounts and a long description that should wrap across multiple lines")
        System(s, "System", "Allows customers to view information about their bank accounts and make payments")
        Rel(p, s, "Uses")
        `,
        { wrap: true }
      );
      cy.get('.node foreignObject').should('not.exist');
      cy.get('.node .c4-descr').should('have.length', 2);
      // wrapping produces multiple tspan lines within the description section
      cy.get('.node .c4-descr').first().find('tspan.text-outer-tspan').should('have.length.gt', 1);
      // textContent joins wrapped lines without spaces, so assert within one line
      cy.get('.node .c4-descr tspan.text-outer-tspan').first().should('contain.text', 'A customer');
    });
  });
});
