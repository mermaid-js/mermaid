import type { DiagramDetector } from '../../diagram-api/types';

export const pieDetector: DiagramDetector = (txt) => {
  const logOutput = txt.match(/^\s*pie/) !== null || txt.match(/^\s*bar/) !== null;
  console.log(logOutput);
  return logOutput;
};
