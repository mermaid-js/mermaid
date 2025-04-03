import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'block';

const detector: DiagramDetector = (txt) => {
  return /^\s*block-beta/.test(txt);
};

const loader = async () => {
  const { diagram } = await import('./blockDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Block Diagram',
  description: 'Create block-based visualizations with beta styling',
  examples: [
    {
      code: `block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px`,
      title: 'Basic Block Layout',
    },
  ],
};

export default plugin;
