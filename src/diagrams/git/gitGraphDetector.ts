import type { DiagramDetector } from '../../diagram-api/detectType';

export const gitGraphDetector: DiagramDetector = (txt) => {
  return txt.match(/^\s*gitGraph/) != null;
};
