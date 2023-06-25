import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'sankey';

const detector: DiagramDetector = (txt) => {
  return /^\s*sankey-beta/.test(txt);
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
