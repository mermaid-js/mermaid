// cspell:ignore usecase usecasediagram
import type { ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'usecase';

const detector = (text: string): boolean =>
  /^\s*usecase\b/i.test(text) || /^\s*usecasediagram\b/i.test(text);

const loader = async () => {
  const { diagram } = await import('./usecaseDiagram.js');
  return { id, diagram };
};

const usecaseDetector: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default usecaseDetector;
