import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { TreeViewDiagramStyles } from './types.js';

const defaultTreeViewDiagramStyles: Required<TreeViewDiagramStyles> = {
  labelFontSize: '16px',
  labelColor: 'black',
  lineColor: 'black',
  iconColor: '#546e7a',
  descriptionColor: '#6a9955',
  highlightBg: 'rgba(255, 193, 7, 0.15)',
  highlightStroke: '#ffc107',
};

const styles: DiagramStylesProvider = ({
  treeView,
}: {
  treeView?: TreeViewDiagramStyles;
}): string => {
  const {
    labelFontSize,
    labelColor,
    lineColor,
    iconColor,
    descriptionColor,
    highlightBg,
    highlightStroke,
  } = cleanAndMerge(defaultTreeViewDiagramStyles, treeView);
  return `
    .treeView-node-label {
        font-size: ${labelFontSize};
        fill: ${labelColor};
    }
    .treeView-node-dir {
        font-weight: bold;
    }
    .treeView-node-line {
        stroke: ${lineColor};
    }
    .treeView-node-icon {
        fill: ${iconColor};
    }
    .treeView-node-description {
        font-size: ${labelFontSize};
        fill: ${descriptionColor};
        font-style: italic;
    }
    .treeView-highlight-bg {
        fill: ${highlightBg};
        stroke: ${highlightStroke};
        stroke-width: 1;
    }
    `;
};

export default styles;
