import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'timingDiagram';

const detector: DiagramDetector = (text) => /^\s*timingDiagram-beta(?:\s|$)/.test(text);

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const timingDiagram: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
