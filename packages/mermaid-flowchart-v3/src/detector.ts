import type { ExternalDiagramDefinition } from 'mermaid';

const id = 'flowchart-v3';

const detector = (txt: string, config) => {
  if (config?.flowchart?.defaultRenderer === 'dagre-d3') {
    return false;
  }
  if (config?.flowchart?.defaultRenderer === 'dagre-wrapper') {
    return false;
  }

  // If we have configured to use dagre-wrapper then we should return true in this function for graph code thus making it use the new flowchart diagram
  if (txt.match(/^\s*graph/) !== null) {
    return true;
  }
  return txt.match(/^\s*flowchart/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./diagram-definition');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
