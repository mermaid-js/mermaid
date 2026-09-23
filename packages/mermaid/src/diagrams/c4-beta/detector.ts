import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'c4beta';

const detector: DiagramDetector = (txt) => {
  return /^\s*c4-beta\b/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

const c4beta: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default c4beta;
