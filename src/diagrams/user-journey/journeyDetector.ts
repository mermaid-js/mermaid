import type { DiagramDetector } from '../../diagram-api/detectType';

export const journeyDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*journey/) !== null;
};
