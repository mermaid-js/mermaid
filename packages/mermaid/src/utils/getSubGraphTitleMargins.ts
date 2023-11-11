import { getConfig } from '../diagram-api/diagramAPI.js';

export const getSubGraphTitleMargins = (): {
  subGraphTitleTopMargin: number;
  subGraphTitleBottomMargin: number;
  subGraphTitleTotalMargin: number;
} => {
  const subGraphTitleTopMargin = getConfig().flowchart?.subGraphTitleMargin?.top || 0;
  const subGraphTitleBottomMargin = getConfig().flowchart?.subGraphTitleMargin?.bottom || 0;
  const subGraphTitleTotalMargin = subGraphTitleTopMargin + subGraphTitleBottomMargin;

  return {
    subGraphTitleTopMargin,
    subGraphTitleBottomMargin,
    subGraphTitleTotalMargin,
  };
};
