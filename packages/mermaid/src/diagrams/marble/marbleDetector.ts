import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

// The id doubles as the SVG's aria-roledescription, so it names the diagram out loud.
const id = 'marbleDiagram';

const detector: DiagramDetector = (txt) => {
  return /^\s*marble-beta(?:\s|$)/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./marbleDiagram.js');
  return { id, diagram };
};

export const marble: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};
