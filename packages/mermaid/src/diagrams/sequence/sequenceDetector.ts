import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'sequence';

const detector: DiagramDetector = (txt) => {
  return /^\s*sequenceDiagram/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./sequenceDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Sequence Diagram',
  description: 'Visualize interactions between objects over time',
  examples: [
    {
      isDefault: true,
      code: `sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!`,
      title: 'Basic Sequence',
    },
  ],
};

export default plugin;
