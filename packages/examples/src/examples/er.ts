import type { DiagramMetadata } from '../types.js';

export default {
  id: 'er',
  name: 'Entity Relationship Diagram',
  description: 'Visualize database schemas and relationships between entities',
  examples: [
    {
      title: 'Basic ER Schema',
      isDefault: true,
      code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : includes
    CUSTOMER {
        string id
        string name
        string email
    }
    ORDER {
        string id
        date orderDate
        string status
    }
    PRODUCT {
        string id
        string name
        float price
    }
    ORDER_ITEM {
        int quantity
        float price
    }`,
    },
  ],
} satisfies DiagramMetadata;
