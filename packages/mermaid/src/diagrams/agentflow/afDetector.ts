import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'agentflow';

// `agentflow-beta` is the keyword the diagram shipped with while it was in beta.
// It stays as an alias so those diagrams keep rendering.
const detector: DiagramDetector = (txt) => {
  return /^\s*agentflow(?:-beta)?(?=\s|;|$)/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
