import type {
  ExternalDiagramDefinition,
  DiagramDetector,
  DiagramLoader,
} from '../../../diagram-api/types.js';

const id = 'flowchart-elk';

const detector: DiagramDetector = (txt, config): boolean => {
  if (
    // If diagram explicitly states flowchart-elk
    /^\s*flowchart-elk/.test(txt) ||
    // If a flowchart/graph diagram has their default renderer set to elk
    (/^\s*flowchart|graph/.test(txt) && config?.flowchart?.defaultRenderer === 'elk')
  ) {
    return true;
  }
  return false;
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./flowchart-elk-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
