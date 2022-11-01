import type { DiagramDetector } from '../../diagram-api/types';

export const journeyDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*journey/) !== null;
};
