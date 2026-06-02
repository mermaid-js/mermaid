// cspell:ignore usecase usecases usecasediagram usecaserenderer collab collabs colour bbox
import type { ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'usecase';

const detector = (text: string): boolean => /^\s*(usecasediagram|usecase)\b/i.test(text);

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
