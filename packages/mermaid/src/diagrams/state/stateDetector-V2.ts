import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'stateDiagram';

// Both `stateDiagram` and `stateDiagram-v2` render with the unified state diagram.
const detector: DiagramDetector = (txt) => /^\s*stateDiagram/.test(txt);

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./stateDiagram-v2.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
