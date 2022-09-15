import type { DiagramDetector } from '../../diagram-api/detectType';

export const requirementDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*requirement(Diagram)?/) !== null;
};
