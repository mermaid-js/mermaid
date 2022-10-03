import type { DiagramDetector } from '../../diagram-api/detectType';

export const infoDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*info/) !== null;
};
