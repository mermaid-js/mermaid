import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

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
    test.describe(`Test ER diagrams in ${look} look and ${theme} theme`, () => {
      test('should render a simple ER diagram with basic relationships', async ({
        page,
      }, testInfo) => {
        const erCode = `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER ||--|{ ADDRESS : "has"
`;
        await imgSnapshotTest(page, testInfo, erCode, { look, theme });
      });

      test('should render ER diagram with all relationship types', async ({ page }, testInfo) => {
        let erCode = `erDiagram\n`;
        relationshipTypes.forEach((rel, index) => {
          const entityA = `ENTITY_A${index}`;
          const entityB = `ENTITY_B${index}`;
          erCode += `    ${entityA} ${rel.cardA}${rel.relType}${rel.cardB} ${entityB} : "${rel.name}"\n`;
        });
        await imgSnapshotTest(page, testInfo, erCode, { look, theme });
      });

      test('should render ER diagram with entities and attributes', async ({ page }, testInfo) => {
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
        await imgSnapshotTest(page, testInfo, erCode, { look, theme });
      });

      test('should render ER diagram with keys and comments', async ({ page }, testInfo) => {
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
        await imgSnapshotTest(page, testInfo, erCode, { look, theme });
      });

      test('should render ER diagram with entity aliases', async ({ page }, testInfo) => {
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
        await imgSnapshotTest(page, testInfo, erCode, { look, theme });
      });

      test('should render complex ER diagram with multiple relationships', async ({
        page,
      }, testInfo) => {
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
        await imgSnapshotTest(page, testInfo, erCode, { look, theme });
      });

      test('should render ER diagram with recursive relationships', async ({ page }, testInfo) => {
        const erCode = `erDiagram
    EMPLOYEE {
        int id PK
        string name
        int managerId FK
    }
    EMPLOYEE ||--o{ EMPLOYEE : manages
    DEPARTMENT ||--|{ EMPLOYEE : employs
`;
        await imgSnapshotTest(page, testInfo, erCode, { look, theme });
      });

      test('should render ER diagram with standalone entities', async ({ page }, testInfo) => {
        const erCode = `erDiagram
    ACTIVE_ENTITY
    ISOLATED_ENTITY {
        string id PK
        string data
    }
    CONNECTED_A ||--|| CONNECTED_B : relates
`;
        await imgSnapshotTest(page, testInfo, erCode, { look, theme });
      });

      test('should render ER diagram with various attribute types', async ({ page }, testInfo) => {
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
        await imgSnapshotTest(page, testInfo, erCode, { look, theme });
      });
    });
  });
});
