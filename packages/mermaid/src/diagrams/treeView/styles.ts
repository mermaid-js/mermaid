import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { TreeViewDiagramStyles } from './types.js';

const defaultTreeViewDiagramStyles: Required<TreeViewDiagramStyles> = {
  fontSize: '16px',
  lineColor: 'black',
  fontFamily: 'trebuchet ms",verdana,arial,sans-serif',
};

const styles: DiagramStylesProvider = ({
  treeView,
}: {
  treeView?: TreeViewDiagramStyles;
}): string => {
  const { fontSize, lineColor, fontFamily } = cleanAndMerge(defaultTreeViewDiagramStyles, treeView);
  return `
    .treeView-node-label {
        font-size: ${fontSize};
        font-family: ${fontFamily};
    }
    .treeView-node-line {
        stroke: ${lineColor};
    }
    `;
};

export default styles;
