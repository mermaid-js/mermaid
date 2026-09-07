import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
import { resolveDefaultRenderer } from '../../diagram-api/defaultRenderer.js';

const id = 'stateDiagram';

const detector: DiagramDetector = (txt, config) => {
  if (/^\s*stateDiagram-v2/.test(txt)) {
    return true;
  }
  // `stateDiagram` code renders with the unified state diagram as soon as a renderer is
  // configured (`dagre` and its aliases, or `elk`).
  if (
    /^\s*stateDiagram/.test(txt) &&
    resolveDefaultRenderer(config?.state?.defaultRenderer) !== undefined
  ) {
    return true;
  }
  return false;
};

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
