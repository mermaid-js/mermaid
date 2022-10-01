import type { DiagramDetector } from '../../diagram-api/detectType';

export const c4Detector: DiagramDetector = (txt) => {
  return txt.match(/^\s*C4Context|C4Container|C4Component|C4Dynamic|C4Deployment/) !== null;
};
