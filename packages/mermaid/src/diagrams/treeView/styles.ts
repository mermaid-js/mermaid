import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { FileTreeDiagramStyles } from './types.js';

const defaultFileTreeDiagramStyles: Required<FileTreeDiagramStyles> = {
  fontSize: '16px',
  lineColor: 'black',
};

const styles: DiagramStylesProvider = ({
  fileTree,
}: {
  fileTree?: FileTreeDiagramStyles;
}): string => {
  const { fontSize, lineColor } = cleanAndMerge(defaultFileTreeDiagramStyles, fileTree);
  return `
    .fileTree-node-label {
        font-size: ${fontSize};
    }
    .fileTree-node-line {
        stroke: ${lineColor};
    }
    `;
};

export default styles;
