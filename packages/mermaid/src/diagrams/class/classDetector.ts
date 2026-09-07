import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
import { resolveDefaultRenderer } from '../../diagram-api/defaultRenderer.js';

const id = 'class';

const detector: DiagramDetector = (txt, config) => {
  // Any configured renderer (`dagre` with its aliases, or `elk`) routes `classDiagram` code
  // to the unified class diagram, so this legacy id only applies when none is configured.
  if (resolveDefaultRenderer(config?.class?.defaultRenderer) !== undefined) {
    return false;
  }
  // We have not opted to use the new renderer so we should return true if we detect a class diagram
  return /^\s*classDiagram/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./classDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
