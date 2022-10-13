import type { DiagramDetector } from '../../diagram-api/types';

export const requirementDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*requirement(Diagram)?/) !== null;
};
