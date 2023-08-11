import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
const id = 'mindmap';

const detector: DiagramDetector = (txt) => {
  return /^\s*mindmap/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./mindmap-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
