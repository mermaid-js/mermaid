import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('Entity Relationship Diagram', () => {
  test('should render a simple ER diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { logLevel: 1 }
    );
  });

  test('should render an ER diagram with a recursive relationship', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        CUSTOMER ||..o{ CUSTOMER : refers
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { logLevel: 1 }
    );
  });

  test('should render an ER diagram with multiple relationships between the same two entities', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        CUSTOMER ||--|{ ADDRESS : "invoiced at"
        CUSTOMER ||--|{ ADDRESS : "receives goods at"
      `,
      { logLevel: 1 }
    );
  });

  test('should render a cyclical ER diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        A ||--|{ B : likes
        B ||--|{ C : likes
        C ||--|{ A : likes
      `,
      { logLevel: 1 }
    );
  });

  test('should render a not-so-simple ER diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        CUSTOMER }|..|{ DELIVERY-ADDRESS : has
        CUSTOMER ||--o{ ORDER : places
        CUSTOMER ||--o{ INVOICE : "liable for"
        DELIVERY-ADDRESS ||--o{ ORDER : receives
        INVOICE ||--|{ ORDER : covers
        ORDER ||--|{ ORDER-ITEM : includes
        PRODUCT-CATEGORY ||--|{ PRODUCT : contains
        PRODUCT ||--o{ ORDER-ITEM : "ordered in"
      `,
      { logLevel: 1 }
    );
  });

  test('should render multiple ER diagrams', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      [
        `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
        `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      ],
      { logLevel: 1 }
    );
  });

  test('should render an ER diagram with blank or empty labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        BOOK }|..|{ AUTHOR : ""
        BOOK }|..|{ GENRE : " "
        AUTHOR }|..|{ GENRE : "  "
      `,
      { logLevel: 1 }
    );
  });

  test('should render an ER diagrams when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { er: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
    const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
    // use within because the absolute value can be slightly different depending on the environment ±10%
    expect(maxWidthValue).toBeGreaterThanOrEqual(140 * 0.9);
    expect(maxWidthValue).toBeLessThanOrEqual(140 * 1.1);
  });

  test('should render an ER when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { er: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    // use within because the absolute value can be slightly different depending on the environment ±10%
    expect(width).toBeGreaterThanOrEqual(140 * 0.9);
    expect(width).toBeLessThanOrEqual(140 * 1.1);
    await expect(svg).not.toHaveAttribute('style');
  });

  test('should render entities that have no relationships', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
        DEAD_PARROT
        HERMIT
        RECLUSE
        SOCIALITE }o--o{ SOCIALITE : "interacts with"
        RECLUSE }o--o{ SOCIALITE : avoids
      `,
      { er: { useMaxWidth: false } }
    );
  });

  test('should render entities with and without attributes', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
        BOOK { string title }
        AUTHOR }|..|{ BOOK : writes
        BOOK { float price }
      `,
      { logLevel: 1 }
    );
  });

  test('should render entities with generic and array attributes', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
        BOOK {
          string title
          string[] authors
          type~T~ type
        }
      `,
      { logLevel: 1 }
    );
  });

  test('should render entities with length in attributes type', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
        CLUSTER {
          varchar(99) name
          string(255) description
        }
      `,
      { logLevel: 1 }
    );
  });

  test('should render entities and attributes with big and small entity names', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
        PRIVATE_FINANCIAL_INSTITUTION {
          string name
          int    turnover
        }
        PRIVATE_FINANCIAL_INSTITUTION ||..|{ EMPLOYEE : employs
        EMPLOYEE { bool officer_of_firm }
      `,
      { logLevel: 1 }
    );
  });

  test('should render entities with attributes that begin with asterisk', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        BOOK {
          int         *id
          string      name
          varchar(99) summary
        }
        BOOK }o..o{ STORE : soldBy
        STORE {
          int         *id
          string      name
          varchar(50) address
        }
        `,
      { loglevel: 1 }
    );
  });

  test('should render entities with backtick-escaped attribute names containing special characters', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        HOTEL {
          string      address
          string      \`geo.accuracy\`
          string      \`check-in date\` PK "ISO 8601"
        }
        HOTEL ||--o{ ROOM : has
        ROOM {
          int         \`room.number\`
          string      \`bed.type\`
        }
        `,
      { loglevel: 1 }
    );
  });

  test('should render entities with unescaped attribute names or types containing commas or periods', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        HOTEL {
          string               address
          GEOMETRY(point,4326) location
          DECIMAL(10,2)        price_per_night
        }
        HOTEL ||--o{ ROOM : has
        ROOM {
          int room.number
          string bed.type
        }
        `,
      { loglevel: 1 }
    );
  });

  test('should render entities with keys', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
      AUTHOR_WITH_LONG_ENTITY_NAME {
        string name PK
      }
      AUTHOR_WITH_LONG_ENTITY_NAME }|..|{ BOOK : writes
      BOOK {
          float price
          string author FK
          string title PK
        }
      `,
      { logLevel: 1 }
    );
  });

  test('should render entities with comments', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
      AUTHOR_WITH_LONG_ENTITY_NAME {
        string name "comment"
      }
      AUTHOR_WITH_LONG_ENTITY_NAME }|..|{ BOOK : writes
      BOOK {
          string author
          string title "author comment"
          float price "price comment"
        }
      `,
      { logLevel: 1 }
    );
  });

  test('should render entities with keys and comments', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
      AUTHOR_WITH_LONG_ENTITY_NAME {
        string name PK "comment"
      }
      AUTHOR_WITH_LONG_ENTITY_NAME }|..|{ BOOK : writes
      BOOK {
          string description
          float price "price comment"
          string title PK "title comment"
          string author FK
        }
      `,
      { logLevel: 1 }
    );
  });

  test('should render entities with aliases', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
      T1 one or zero to one or more T2 : test
      T2 one or many optionally to zero or one T3 : test
      T3 zero or more to zero or many T4 : test
      T4 many(0) to many(1) T5 : test
      T5 many optionally to one T6 : test
      T6 only one optionally to only one T1 : test
      T4 0+ to 1+ T6 : test
      T1 1 to 1 T3 : test
      `,
      { logLevel: 1 }
    );
  });

  test('1433: should render a simple ER diagram with a title', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: simple ER diagram
---
erDiagram
CUSTOMER ||--o{ ORDER : places
ORDER ||--|{ LINE-ITEM : contains
`,
      {}
    );
  });

  test('should render entities with entity name aliases', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
      p[Person] {
        varchar(64) firstName
        varchar(64) lastName
      }
      c["Customer Account"] {
        varchar(128) email
      }
      p ||--o| c : has
      `,
      { logLevel: 1 }
    );
  });

  test('should render relationship labels with line breaks', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
      p[Person] {
          string firstName
          string lastName
      }
      a["Customer Account"] {
          string email
      }

      b["Customer Account Secondary"] {
        string email
      }
      
      c["Customer Account Tertiary"] {
        string email
      }
      
      d["Customer Account Nth"] {
        string email
      }

      p ||--o| a : "has<br />one"
      p ||--o| b : "has<br />one<br />two"
      p ||--o| c : "has<br />one<br/>two<br />three"
      p ||--o| d : "has<br />one<br />two<br/>three<br />...<br/>Nth"
      `,
      { logLevel: 1 }
    );
  });

  test.describe('Include char sequence "graph" in text (#6795)', () => {
    test('has a label with char sequence "graph"', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          p[Photograph] {
            varchar(12) jobId
            date dateCreated
          }
        `,
        { flowchart: { defaultRenderer: 'elk' } }
      );
    });
  });

  test.describe('Special characters and numbers syntax', () => {
    test('should render ER diagram with numeric entity names', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          1 ||--|| ORDER : places
          ORDER ||--|{ 2 : contains
          2 ||--o{ 3.5 : references
        `,
        { logLevel: 1 }
      );
    });

    test('should render ER diagram with "u" character in entity names and cardinality', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          CUSTOMER ||--|| u : has
          u ||--|| ORDER : places
          PROJECT u--o{ TEAM_MEMBER : "parent"
        `,
        { logLevel: 1 }
      );
    });

    test('should render ER diagram with decimal numbers in relationships', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          2.5 ||--|| 1.5 : has
          CUSTOMER ||--o{ 3.14 : references
          1.0 ||--|{ ORDER : contains
        `,
        { logLevel: 1 }
      );
    });

    test('should render ER diagram with numeric entity names and attributes', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          1 {
            string name
            int value
          }
          1 ||--|| ORDER : places
          ORDER {
            float price
            string description
          }
        `,
        { logLevel: 1 }
      );
    });

    test('should render complex ER diagram with mixed special entity names', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          CUSTOMER ||--o{ 1 : places
          1 ||--|{ u : contains
          1.5
          u ||--|| 2.5 : processes
          2.5 {
            string id
            float value
          }
          u {
            varchar(50) name
            int count
          }
        `,
        { logLevel: 1 }
      );
    });
    test('should render ER diagram with standalone numeric entities', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `erDiagram
         PRODUCT ||--o{ ORDER-ITEM : has
         1.5
         u
         1
        `,
        { logLevel: 1 }
      );
    });
  });

  test('should render edge labels correctly when flowchart htmlLabels is false', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
        CUSTOMER ||--|{ ADDRESS : "invoiced at"
        CUSTOMER ||--|{ ADDRESS : "receives goods at"
        ORDER ||--o{ INVOICE : "liable for"
      `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('should render ER diagram with "1" cardinality alias before relationship operators', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      erDiagram
        CUSTOMER 1--1 ORDER : "exactly one"
        ORDER 1--o{ LINE-ITEM : "one to many"
        PRODUCT 1--|{ CATEGORY : "one or more"
        USER 1..1 PROFILE : "exactly one optional"
      `,
      { logLevel: 1 }
    );
  });

  test('should render ER diagram with "1" cardinality using all 4 relationship operator styles', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      erDiagram
        A 1--1 B : "solid-solid"
        C 1..1 D : "dotted-dotted"
        E 1.-1 F : "dotted-solid"
        G 1-.1 H : "solid-dotted"
      `,
      { logLevel: 1 }
    );
  });

  test.describe('ER diagram subgraphs', () => {
    test('should render a simple subgraph', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          subgraph domain
            CUSTOMER
            ORDER
          end
        `,
        { logLevel: 1 }
      );
    });

    test('should render empty subgraphs', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          subgraph emptyDomain
          end
        `,
        { logLevel: 1 }
      );
    });

    test('should render nested subgraphs', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          subgraph domain
            CUSTOMER

            subgraph details
              ORDER
            end
          end
        `,
        { logLevel: 1 }
      );
    });

    test('should render relationships across subgraphs', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          subgraph customers
            CUSTOMER
          end

          subgraph orders
            ORDER
          end

          CUSTOMER ||--o{ ORDER : places
        `,
        { logLevel: 1 }
      );
    });

    test('should render relationships between subgraph and entity', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          subgraph customers
            CUSTOMER
          end

          subgraph orders
            ORDER
          end

          CUSTOMER ||--o{ orders : places
        `,
        { logLevel: 1 }
      );
    });

    test('should render relationships between subgraphs', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          subgraph customers
            CUSTOMER
          end

          subgraph orders
            ORDER
          end

          customers ||--o{ orders : places
        `,
        { logLevel: 1 }
      );
    });

    test('should render subgraphs with quoted ids', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          subgraph "Customer Domain"
            CUSTOMER
          end

          "Customer Domain" ||--o{ ORDER : contains
        `,
        { logLevel: 1 }
      );
    });

    test('should render subgraphs with explicit id and title', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          subgraph domain["Customer Domain"]
            CUSTOMER
            ORDER
          end

          CUSTOMER ||--o{ ORDER : places
        `,
        { logLevel: 1 }
      );
    });

    test('should render subgraphs with direction override', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          direction LR

          subgraph domain
            direction TB

            CUSTOMER
            ORDER
          end

          PRODUCT

          PRODUCT||--o{ domain: links
          CUSTOMER ||--o{ ORDER : places
        `,
        { logLevel: 1 }
      );
    });
  });
});
