import type { DiagramDetector } from '../../diagram-api/types';

export const erDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*erDiagram/) !== null;
};
