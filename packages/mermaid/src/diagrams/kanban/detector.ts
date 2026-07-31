import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
const id = 'kanban';

const detector: DiagramDetector = (txt) => {
  return /^\s*kanban/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./kanban-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
