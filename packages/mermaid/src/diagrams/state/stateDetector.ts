import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
import { resolveDefaultRenderer } from '../../diagram-api/defaultRenderer.js';

const id = 'state';

const detector: DiagramDetector = (txt, config) => {
  // Any configured renderer (`dagre` with its aliases, or `elk`) routes `stateDiagram` code
  // to the unified state diagram, so this legacy id only applies when none is configured.
  if (resolveDefaultRenderer(config?.state?.defaultRenderer) !== undefined) {
    return false;
  }
  return /^\s*stateDiagram/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./stateDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
