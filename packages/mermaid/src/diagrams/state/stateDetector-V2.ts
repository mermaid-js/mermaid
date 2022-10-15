import type { DiagramDetector } from '../../diagram-api/types';

export const stateDetectorV2: DiagramDetector = (text, config) => {
  if (text.match(/^\s*stateDiagram-v2/) !== null) return true;
  if (text.match(/^\s*stateDiagram/) && config?.state?.defaultRenderer === 'dagre-wrapper')
    return true;
  return false;
};
