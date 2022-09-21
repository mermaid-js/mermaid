import type { DiagramDetector } from '../../diagram-api/detectType';

export const erDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*erDiagram/) !== null;
};
