import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'tt';

const detector: DiagramDetector = (txt) => {
  return /^\s*tt/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./teamTopologyDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
