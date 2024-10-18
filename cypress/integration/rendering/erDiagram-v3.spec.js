import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('Entity Relationship Diagram', () => {
  it('should render a simple ER diagram', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { logLevel: 1 }
    );
  });

  it('should render a simple ER diagram without htmlLabels', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render an ER diagram with a recursive relationship', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER ||..o{ CUSTOMER : refers
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { logLevel: 1 }
    );
  });

  it('should render an ER diagram with multiple relationships between the same two entities', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER ||--|{ ADDRESS : "invoiced at"
        CUSTOMER ||--|{ ADDRESS : "receives goods at"
      `,
      { logLevel: 1 }
    );
  });

  it('should render a cyclical ER diagram', () => {
    imgSnapshotTest(
      `
    erDiagram
        A ||--|{ B : likes
        B ||--|{ C : likes
        C ||--|{ A : likes
      `,
      { logLevel: 1 }
    );
  });

  it('should render a not-so-simple ER diagram', () => {
    imgSnapshotTest(
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

  it('should render a not-so-simple ER diagram without htmlLabels', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render multiple ER diagrams', () => {
    imgSnapshotTest(
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

  it('should render an ER diagram with blank or empty labels', () => {
    imgSnapshotTest(
      `
    erDiagram
        BOOK }|..|{ AUTHOR : ""
        BOOK }|..|{ GENRE : " "
        AUTHOR }|..|{ GENRE : "  "
      `,
      { logLevel: 1 }
    );
  });

  it('should render entities that have no relationships', () => {
    renderGraph(
      `
    erDiagram
        DEAD_PARROT
        HERMIT
        RECLUSE
        SOCIALITE }o--o{ SOCIALITE : "interacts with"
        RECLUSE }o--o{ SOCIALITE : avoids
      `,
      { logLevel: 1 }
    );
  });

  it('should render entities with and without attributes', () => {
    renderGraph(
      `
    erDiagram
        BOOK { string title }
        AUTHOR }|..|{ BOOK : writes
        BOOK { float price }
      `,
      { logLevel: 1 }
    );
  });

  it('should render entities with generic and array attributes', () => {
    renderGraph(
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

  it('should render entities with generic and array attributes without htmlLabels', () => {
    renderGraph(
      `
    erDiagram
        BOOK {
          string title
          string[] authors
          type~T~ type
        }
      `,
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render entities with length in attributes type', () => {
    renderGraph(
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

  it('should render entities with length in attributes type without htmlLabels', () => {
    renderGraph(
      `
    erDiagram
        CLUSTER {
          varchar(99) name
          string(255) description
        }
      `,
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render entities and attributes with big and small entity names', () => {
    renderGraph(
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

  it('should render entities and attributes with big and small entity names without htmlLabels', () => {
    renderGraph(
      `
    erDiagram
        PRIVATE_FINANCIAL_INSTITUTION {
          string name
          int    turnover
        }
        PRIVATE_FINANCIAL_INSTITUTION ||..|{ EMPLOYEE : employs
        EMPLOYEE { bool officer_of_firm }
      `,
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render entities with attributes that begin with asterisk', () => {
    imgSnapshotTest(
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

  it('should render entities with attributes that begin with asterisk without htmlLabels', () => {
    imgSnapshotTest(
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
      { loglevel: 1, htmlLabels: false }
    );
  });

  it('should render entities with keys', () => {
    renderGraph(
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

  it('should render entities with keys without htmlLabels', () => {
    renderGraph(
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
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render entities with comments', () => {
    renderGraph(
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

  it('should render entities with comments without htmlLabels', () => {
    renderGraph(
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
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render entities with keys and comments', () => {
    renderGraph(
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

  it('should render entities with keys and comments without htmlLabels', () => {
    renderGraph(
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
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render entities with aliases', () => {
    renderGraph(
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

  it('1433: should render a simple ER diagram with a title', () => {
    imgSnapshotTest(
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

  it('should render entities with entity name aliases', () => {
    imgSnapshotTest(
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

  it('should render relationship labels with line breaks', () => {
    imgSnapshotTest(
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

  it('should render an ER diagram with unicode text', () => {
    imgSnapshotTest(
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
      { logLevel: 1 }
    );
  });

  it('should render an ER diagram with unicode text without htmlLabels', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render an ER diagram with relationships with unicode text', () => {
    imgSnapshotTest(
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
      { logLevel: 1 }
    );
  });

  it('should render an ER diagram with relationships with unicode text without htmlLabels', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render an ER diagram with TB direction', () => {
    imgSnapshotTest(
      `
        erDiagram
        direction TB
        CAR ||--|{ NAMED-DRIVER : allows
        PERSON ||..o{ NAMED-DRIVER : is
      `,
      { logLevel: 1 }
    );
  });

  it('should render an ER diagram with BT direction', () => {
    imgSnapshotTest(
      `
        erDiagram
        direction BT
        CAR ||--|{ NAMED-DRIVER : allows
        PERSON ||..o{ NAMED-DRIVER : is
      `,
      { logLevel: 1 }
    );
  });

  it('should render an ER diagram with LR direction', () => {
    imgSnapshotTest(
      `
        erDiagram
        direction LR
        CAR ||--|{ NAMED-DRIVER : allows
        PERSON ||..o{ NAMED-DRIVER : is
      `,
      { logLevel: 1 }
    );
  });

  it('should render an ER diagram with RL direction', () => {
    imgSnapshotTest(
      `
        erDiagram
        direction RL
        CAR ||--|{ NAMED-DRIVER : allows
        PERSON ||..o{ NAMED-DRIVER : is
      `,
      { logLevel: 1 }
    );
  });

  it('should render entities with styles applied from style statement', () => {
    imgSnapshotTest(
      `
          erDiagram
            c[CUSTOMER]
            p[PERSON]
            style c,p fill:#f9f,stroke:blue, color:grey, font-size:24px,font-weight:bold
      `,
      { logLevel: 1 }
    );
  });

  it('should render entities with styles applied from style statement without htmlLabels', () => {
    imgSnapshotTest(
      `
          erDiagram
            c[CUSTOMER]
            p[PERSON]
            style c,p fill:#f9f,stroke:blue, color:grey, font-size:24px,font-weight:bold
      `,
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render entities with styles applied from class statement', () => {
    imgSnapshotTest(
      `
          erDiagram
            c[CUSTOMER]
            p[PERSON]:::blue
            classDef bold font-size:24px, font-weight: bold
            classDef blue stroke:lightblue, color: #0000FF
            class c,p bold
      `,
      { logLevel: 1 }
    );
  });

  it('should render entities with styles applied from class statement without htmlLabels', () => {
    imgSnapshotTest(
      `
          erDiagram
            c[CUSTOMER]
            p[PERSON]:::blue
            classDef bold font-size:24px, font-weight: bold
            classDef blue stroke:lightblue, color: #0000FF
            class c,p bold
      `,
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('should render entities with the handDrawn look', () => {
    imgSnapshotTest(
      `
          erDiagram
            c[CUSTOMER]
            p[PERSON]
      `,
      { logLevel: 1, look: 'handDrawn' }
    );
  });

  it('should render entities with the handDrawn look without htmlLabels', () => {
    imgSnapshotTest(
      `
          erDiagram
            c[CUSTOMER]
            p[PERSON]
      `,
      { logLevel: 1, look: 'handDrawn', htmlLabels: false }
    );
  });

  it('should render entities with the handDrawn look and styles applied', () => {
    imgSnapshotTest(
      `
          erDiagram
            c[CUSTOMER]
            p[PERSON]:::blue
            classDef bold font-size:24px, font-weight: bold
            classDef blue stroke:black, fill:lightblue, color: #0000FF
            class c,p bold
      `,
      { logLevel: 1, look: 'handDrawn' }
    );
  });

  it('should render entities with the handDrawn look and styles applied without htmlLabels', () => {
    imgSnapshotTest(
      `
          erDiagram
            c[CUSTOMER]
            p[PERSON]:::blue
            classDef bold font-size:24px, font-weight: bold
            classDef blue stroke:black, fill:lightblue, color: #0000FF
            class c,p bold
      `,
      { logLevel: 1, look: 'handDrawn', htmlLabels: false }
    );
  });

  it('should render a not-so-simple ER diagram using elk', () => {
    imgSnapshotTest(
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
      { logLevel: 1, layout: 'elk' }
    );
  });
});
