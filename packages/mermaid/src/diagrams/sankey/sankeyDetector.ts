import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'sankey';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*sankey/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./sankeyDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
