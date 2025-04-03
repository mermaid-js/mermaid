import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'er';

const detector: DiagramDetector = (txt) => {
  return /^\s*erDiagram/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./erDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Entity Relationship Diagram',
  description: 'Visualize database schemas and relationships between entities',
  examples: [
    {
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
      title: 'Basic ER Schema',
    },
  ],
};

export default plugin;
