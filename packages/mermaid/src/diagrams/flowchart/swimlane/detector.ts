
import type {
  ExternalDiagramDefinition,
  DiagramDetector,
  DiagramLoader,
} from '../../../diagram-api/types.js';
const id = 'swimlane';


const detector: DiagramDetector = (txt, config): boolean => {
   if (txt.match(/^\s*swimlane/)) {
    return true;
  }
  return false;
};


const loader: DiagramLoader = async () => {
  const { diagram } = await import('./swimlane-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
