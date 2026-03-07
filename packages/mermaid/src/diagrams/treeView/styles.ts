import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { TreeViewDiagramStyles } from './types.js';

const defaultTreeViewDiagramStyles: Required<TreeViewDiagramStyles> = {
  fontSize: '16px',
  textColor: 'black',
  lineColor: 'black',
};

const styles: DiagramStylesProvider = ({
  treeView,
}: {
  treeView?: TreeViewDiagramStyles;
}): string => {
  const { fontSize, textColor, lineColor } = cleanAndMerge(defaultTreeViewDiagramStyles, treeView);
  return `
    .treeView-node-label {
        font-size: ${fontSize};
        fill: ${textColor};
    }
    .treeView-node-line {
        stroke: ${lineColor};
    }
    `;
};

export default styles;
