import type { FlowchartDiagramConfig } from '../config.type.js';

export const getSubGraphTitleMargins = ({
  flowchart,
}: {
  flowchart: FlowchartDiagramConfig;
}): {
  subGraphTitleTopMargin: number;
  subGraphTitleBottomMargin: number;
  subGraphTitleTotalMargin: number;
} => {
  const subGraphTitleTopMargin = flowchart?.subGraphTitleMargin?.top ?? 0;
  const subGraphTitleBottomMargin = flowchart?.subGraphTitleMargin?.bottom ?? 0;
  const subGraphTitleTotalMargin = subGraphTitleTopMargin + subGraphTitleBottomMargin;

  return {
    subGraphTitleTopMargin,
    subGraphTitleBottomMargin,
    subGraphTitleTotalMargin,
  };
};
