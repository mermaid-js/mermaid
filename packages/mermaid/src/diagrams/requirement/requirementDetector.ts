import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.ts';

const id = 'requirement';

const detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*requirement(Diagram)?/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./requirementDiagram.ts');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
