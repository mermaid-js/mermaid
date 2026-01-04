import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
const id = 'ishikawa-beta';

const detector: DiagramDetector = (txt) => {
  return /^\s*ishikawa/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./ishikawa-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
