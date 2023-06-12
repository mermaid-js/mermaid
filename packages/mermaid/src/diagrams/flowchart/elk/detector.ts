import type { MermaidConfig } from '../../../config.type.js';
import type { ExternalDiagramDefinition, DiagramDetector } from '../../../diagram-api/types.js';

const id = 'flowchart-elk';

const detector: DiagramDetector = (txt: string, config?: MermaidConfig): boolean => {
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

const loader = async () => {
  const { diagram } = await import('./flowchart-elk-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
