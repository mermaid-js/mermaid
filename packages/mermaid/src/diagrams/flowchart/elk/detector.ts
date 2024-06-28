import type {
  ExternalDiagramDefinition,
  DiagramDetector,
  DiagramLoader,
} from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';

const id = 'flowchart-elk';

const detector: DiagramDetector = (txt, config): boolean => {
  if (
    // If diagram explicitly states flowchart-elk
    /^\s*flowchart-elk/.test(txt) ||
    // If a flowchart/graph diagram has their default renderer set to elk
    (/^\s*flowchart|graph/.test(txt) && config?.flowchart?.defaultRenderer === 'elk')
  ) {
    // This will log at the end, hopefully.
    setTimeout(
      () =>
        log.warn(
          'flowchart-elk was moved to an external package in Mermaid v11. Please refer [release notes](link) for more details. This diagram will be rendered using `dagre` layout as a fallback.'
        ),
      500
    );
    return true;
  }
  return false;
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('../flowDiagram-v2.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
