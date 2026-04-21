import { imgSnapshotTest } from '../../../helpers/util.ts';

const looks = ['neo'] as const;
const themes = [
  'neo',
  'neo-dark',
  'redux',
  'redux-dark',
  'redux-color',
  'redux-dark-color',
] as const;

// ER diagram relationship types
const relationshipTypes = [
  { cardA: '||', relType: '--', cardB: '||', name: 'one-to-one-identifying' },
  { cardA: '||', relType: '--', cardB: 'o{', name: 'one-to-many-identifying' },
  { cardA: '}o', relType: '--', cardB: 'o{', name: 'many-to-many-identifying' },
  { cardA: '||', relType: '..', cardB: 'o|', name: 'one-to-zero-or-one-non-identifying' },
  { cardA: '}|', relType: '..', cardB: 'o{', name: 'one-or-more-to-many-non-identifying' },
] as const;

looks.forEach((look) => {
  themes.forEach((theme) => {
    describe(`Test ER diagrams in ${look} look and ${theme} theme`, () => {
      it('should render a simple ER diagram with basic relationships', () => {
        const erCode = `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER ||--|{ ADDRESS : "has"
`;
        imgSnapshotTest(erCode, { look, theme });
      });

      it('should render ER diagram with all relationship types', () => {
        let erCode = `erDiagram\n`;
        relationshipTypes.forEach((rel, index) => {
          const entityA = `ENTITY_A${index}`;
          const entityB = `ENTITY_B${index}`;
          erCode += `    ${entityA} ${rel.cardA}${rel.relType}${rel.cardB} ${entityB} : "${rel.name}"\n`;
        });
        imgSnapshotTest(erCode, { look, theme });
      });

      it('should render ER diagram with entities and attributes', () => {
        const erCode = `erDiagram
    CUSTOMER {
        string name
        string custNumber
        string sector
    }
    ORDER {
        int orderNumber
        string deliveryAddress
    }
    LINE-ITEM {
        string productCode
        int quantity
        float pricePerUnit
    }
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
`;
        imgSnapshotTest(erCode, { look, theme });
      });

      it('should render ER diagram with keys and comments', () => {
        const erCode = `erDiagram
    AUTHOR {
        string name PK "Primary identifier"
        string email UK "Unique email"
    }
    BOOK {
        string isbn PK "Book identifier"
        string title "Book title"
        string author FK "Author reference"
        float price "Book price"
    }
    AUTHOR ||--|{ BOOK : writes
`;
        imgSnapshotTest(erCode, { look, theme });
      });

      it('should render ER diagram with entity aliases', () => {
        const erCode = `erDiagram
    p[Person] {
        varchar(64) firstName
        varchar(64) lastName
    }
    c["Customer Account"] {
        varchar(128) email
    }
    o[Order] {
        int orderNumber
    }
    p ||--o| c : has
    c ||--o{ o : places
`;
        imgSnapshotTest(erCode, { look, theme });
      });

      it('should render complex ER diagram with multiple relationships', () => {
        const erCode = `erDiagram
    CUSTOMER }|..|{ DELIVERY-ADDRESS : has
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ INVOICE : "liable for"
    DELIVERY-ADDRESS ||--o{ ORDER : receives
    INVOICE ||--|{ ORDER : covers
    ORDER ||--|{ ORDER-ITEM : includes
    PRODUCT-CATEGORY ||--|{ PRODUCT : contains
    PRODUCT ||--o{ ORDER-ITEM : "ordered in"
`;
        imgSnapshotTest(erCode, { look, theme });
      });

      it('should render ER diagram with recursive relationships', () => {
        const erCode = `erDiagram
    EMPLOYEE {
        int id PK
        string name
        int managerId FK
    }
    EMPLOYEE ||--o{ EMPLOYEE : manages
    DEPARTMENT ||--|{ EMPLOYEE : employs
`;
        imgSnapshotTest(erCode, { look, theme });
      });

      it('should render ER diagram with standalone entities', () => {
        const erCode = `erDiagram
    ACTIVE_ENTITY
    ISOLATED_ENTITY {
        string id PK
        string data
    }
    CONNECTED_A ||--|| CONNECTED_B : relates
`;
        imgSnapshotTest(erCode, { look, theme });
      });

      it('should render ER diagram with various attribute types', () => {
        const erCode = `erDiagram
    PRODUCT {
        int id PK
        string name
        string[] tags
        varchar(255) description
        type~T~ genericType
        float price
    }
`;
        imgSnapshotTest(erCode, { look, theme });
      });
    });
  });
});
