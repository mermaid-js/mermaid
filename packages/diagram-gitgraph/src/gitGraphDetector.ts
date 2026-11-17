import type { DiagramDetector, DiagramLoader } from '@mermaid-js/core/diagram-api/types.js';
import type { ExternalDiagramDefinition } from '@mermaid-js/core/diagram-api/types.js';

const id = 'gitGraph';

const detector: DiagramDetector = (txt) => {
  return /^\s*gitGraph/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./gitGraphDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
