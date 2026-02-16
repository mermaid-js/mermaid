import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'flowchart-v2';

const detector: DiagramDetector = (txt, config) => {
  if (config?.flowchart?.defaultRenderer === 'dagre-d3') {
    return false;
  }

  if (config?.flowchart?.defaultRenderer === 'elk') {
    config.layout = 'elk';
  }

  // If we have configured to use dagre-wrapper then we should return true in this function for graph code thus making it use the new flowchart diagram
  if (/^\s*graph/.test(txt) && config?.flowchart?.defaultRenderer === 'dagre-wrapper') {
    return true;
  }
  return /^\s*flowchart/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./flowDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
