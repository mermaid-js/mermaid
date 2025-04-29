/* eslint-disable @cspell/spellchecker */
import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'use_case';

// tell Mermaid to use Use Case Diagram plugin
const detector: DiagramDetector = (txt) => {
  // eslint-disable-next-line no-console
  console.log('[UseCaseDetector] Checking:', txt);
  return /^\s*use-case/.test(txt);
};

// lazy loader
const loader: DiagramLoader = async () => {
  // console.log('[useCaseDetector] loader triggered');
  const { diagram } = await import('./useCaseDiagram.js');
  return { id, diagram };
};

// diagram plugin config
const usecase: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

// export plugin
export default usecase;
