import type { MermaidConfig } from '../../../config.type';
import type { ExternalDiagramDefinition, DiagramDetector } from '../../../diagram-api/types';

const id = 'flowchart-elk';

const detector: DiagramDetector = (txt: string, config?: MermaidConfig): boolean => {
  if (
    // If diagram explicitly states flowchart-elk
    txt.match(/^\s*flowchart-elk/) ||
    // If a flowchart/graph diagram has their default renderer set to elk
    (txt.match(/^\s*flowchart|graph/) && config?.flowchart?.defaultRenderer === 'elk')
  ) {
    return true;
  }
  return false;
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
