import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'component';

const detector: DiagramDetector = (txt) => {
  return /^\s*component-beta(?:\s|$)/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./componentDiagram.js');
  return { id, diagram };
};

export const component: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
