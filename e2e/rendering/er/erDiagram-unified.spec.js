import { test } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

const testOptions = [
  { description: '', options: { logLevel: 1 } },
  { description: 'ELK: ', options: { logLevel: 1, layout: 'elk' } },
  { description: 'HD: ', options: { logLevel: 1, look: 'handDrawn' } },
];

test.describe('Entity Relationship Diagram Unified', () => {
  testOptions.forEach(({ description, options }) => {
    test(`${description}should render a simple ER diagram`, async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      erDiagram
          CUSTOMER ||--o{ ORDER : places
          ORDER ||--|{ LINE-ITEM : contains
        `,
        options
      );
    });

    test(`${description}should render a simple ER diagram without htmlLabels`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      erDiagram
          CUSTOMER ||--o{ ORDER : places
          ORDER ||--|{ LINE-ITEM : contains
        `,
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render ER diagram with edge labels centered when htmlLabels is false`, async ({
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
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render an ER diagram with a recursive relationship`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      erDiagram
          CUSTOMER ||..o{ CUSTOMER : refers
          CUSTOMER ||--o{ ORDER : places
          ORDER ||--|{ LINE-ITEM : contains
        `,
        options
      );
    });

    test(`${description}should render an ER diagram with multiple relationships between the same two entities`, async ({
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
        options
      );
    });

    test(`${description}should render a cyclical ER diagram`, async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      erDiagram
          A ||--|{ B : likes
          B ||--|{ C : likes
          C ||--|{ A : likes
        `,
        options
      );
    });

    test(`${description}should render a not-so-simple ER diagram`, async ({ page }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render a not-so-simple ER diagram without htmlLabels`, async ({
      page,
    }, testInfo) => {
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
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render multiple ER diagrams`, async ({ page }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render an ER diagram with blank or empty labels`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      erDiagram
          BOOK }|..|{ AUTHOR : ""
          BOOK }|..|{ GENRE : " "
          AUTHOR }|..|{ GENRE : "  "
        `,
        options
      );
    });

    test(`${description}should render entities that have no relationships`, async ({
      page,
    }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render entities with and without attributes`, async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      erDiagram
          BOOK { string title }
          AUTHOR }|..|{ BOOK : writes
          BOOK { float price }
        `,
        options
      );
    });

    test(`${description}should render entities with generic and array attributes`, async ({
      page,
    }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render entities with generic and array attributes without htmlLabels`, async ({
      page,
    }, testInfo) => {
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
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render entities with length in attributes type`, async ({
      page,
    }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render entities with length in attributes type without htmlLabels`, async ({
      page,
    }, testInfo) => {
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
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render entities and attributes with big and small entity names`, async ({
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
        options
      );
    });

    test(`${description}should render entities and attributes with big and small entity names without htmlLabels`, async ({
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
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render entities with attributes that begin with asterisk`, async ({
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
        options
      );
    });

    test(`${description}should render entities with attributes that begin with asterisk without htmlLabels`, async ({
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
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render entities with keys`, async ({ page }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render entities with keys without htmlLabels`, async ({
      page,
    }, testInfo) => {
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
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render entities with comments`, async ({ page }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render entities with comments without htmlLabels`, async ({
      page,
    }, testInfo) => {
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
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render entities with keys and comments`, async ({
      page,
    }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render entities with keys and comments without htmlLabels`, async ({
      page,
    }, testInfo) => {
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
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render entities with aliases`, async ({ page }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render a simple ER diagram with a title`, async ({
      page,
    }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render entities with entity name aliases`, async ({
      page,
    }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render relationship labels with line breaks`, async ({
      page,
    }, testInfo) => {
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
        options
      );
    });

    test(`${description}should render an ER diagram with unicode text`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      erDiagram
          _**testẽζ➕Ø😀㌕ぼ**_ {
              *__List~List~int~~sdfds__* **driversLicense** PK "***The l😀icense #***"
              *string(99)~T~~~~~~* firstName "Only __99__ <br>characters are a<br>llowed dsfsdfsdfsdfs"
              string last*Name*
              string __phone__ UK
              int _age_
          }
        `,
        options
      );
    });

    test(`${description}should render an ER diagram with unicode text without htmlLabels`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      erDiagram
          _**testẽζ➕Ø😀㌕ぼ**_ {
              *__List~List~int~~sdfds__* **driversLicense** PK "***The l😀icense #***"
              *string(99)~T~~~~~~* firstName "Only __99__ <br>characters are a<br>llowed dsfsdfsdfsdfs"
              string last*Name*
              string __phone__ UK
              int _age_
          }
        `,
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render an ER diagram with relationships with unicode text`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
          erDiagram
            person[😀] {
                string *first*Name
                string _**last**Name_
            }
            a["*Customer Account*"] {
                **string** ema*i*l
            }
            person ||--o| a : __hẽ😀__
        `,
        options
      );
    });

    test(`${description}should render an ER diagram with relationships with unicode text without htmlLabels`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
          erDiagram
            person[😀] {
                string *first*Name
                string _**last**Name_
            }
            a["*Customer Account*"] {
                **string** ema*i*l
            }
            person ||--o| a : __hẽ😀__
        `,
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render an ER diagram with TB direction`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
          erDiagram
          direction TB
          CAR ||--|{ NAMED-DRIVER : allows
          PERSON ||..o{ NAMED-DRIVER : is
        `,
        options
      );
    });

    test(`${description}should render an ER diagram with BT direction`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
          erDiagram
          direction BT
          CAR ||--|{ NAMED-DRIVER : allows
          PERSON ||..o{ NAMED-DRIVER : is
        `,
        options
      );
    });

    test(`${description}should render an ER diagram with LR direction`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
          erDiagram
          direction LR
          CAR ||--|{ NAMED-DRIVER : allows
          PERSON ||..o{ NAMED-DRIVER : is
        `,
        options
      );
    });

    test(`${description}should render an ER diagram with RL direction`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
          erDiagram
          direction RL
          CAR ||--|{ NAMED-DRIVER : allows
          PERSON ||..o{ NAMED-DRIVER : is
        `,
        options
      );
    });

    test(`${description}should render entities with styles applied from style statement`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
            erDiagram
              c[CUSTOMER]
              p[PERSON]
              style c,p fill:#f9f,stroke:blue, color:grey, font-size:24px,font-weight:bold
        `,
        options
      );
    });

    test(`${description}should render entities with styles applied from style statement without htmlLabels`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
            erDiagram
              c[CUSTOMER]
              p[PERSON]
              style c,p fill:#f9f,stroke:blue, color:grey, font-size:24px,font-weight:bold
        `,
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render entities with styles applied from class statement`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
            erDiagram
              c[CUSTOMER]
              p[PERSON]:::blue
              classDef bold font-size:24px, font-weight: bold
              classDef blue stroke:lightblue, color: #0000FF
              class c,p bold
        `,
        options
      );
    });

    test(`${description}should render entities with styles applied from class statement without htmlLabels`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
            erDiagram
              c[CUSTOMER]
              p[PERSON]:::blue
              classDef bold font-size:24px, font-weight: bold
              classDef blue stroke:lightblue, color: #0000FF
              class c,p bold
        `,
        { ...options, htmlLabels: false }
      );
    });

    test(`${description}should render entities with styles applied from the default class and other styles`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
            erDiagram
              c[CUSTOMER]
              p[PERSON]:::blue
              classDef blue stroke:lightblue, color: #0000FF
              classDef default fill:pink
              style c color:green
        `,
        { ...options }
      );
    });

    test(`${description}should render ER subgraphs`, async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          subgraph customers
            CUSTOMER
            ORDER
          end

          CUSTOMER ||--o{ ORDER : places
        `,
        options
      );
    });

    test(`${description}should render nested ER subgraphs with direction override`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        erDiagram
          direction LR

          subgraph domain
            direction TB

            CUSTOMER

            subgraph details
              ORDER
            end
          end

          PRODUCT

          PRODUCT ||--o{ domain : links
          CUSTOMER ||--o{ ORDER : places
        `,
        options
      );
    });
  });
});
