import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'sankey';

const detector: DiagramDetector = (txt) => {
  return /^\s*sankey-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./sankeyDiagram.js');
  return { id, diagram };
};

export const sankey: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
