import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { NetworkStyleOptions } from './types.js';

const defaultNetworkStyleOptions: NetworkStyleOptions = {
  nodeStrokeColor: '#0b3d91',
  nodeStrokeWidth: '1.5',
  nodeFillColor: '#cfe2ff',
  linkColor: '#5a7fa8',
  linkWidth: '1.5',
  labelColor: '#1a1a1a',
  linkLabelColor: '#444',
  titleColor: '#1a1a1a',
  titleFontSize: '16px',
  subnetStrokeColor: '#5a7fa8',
  subnetFillColor: 'rgba(120, 160, 200, 0.08)',
  subnetLabelColor: '#5a7fa8',
};

export const styles: DiagramStylesProvider = ({
  network,
}: { network?: NetworkStyleOptions } = {}) => {
  const options = cleanAndMerge(defaultNetworkStyleOptions, network);

  return `
  .networkNode {
    fill: ${options.nodeFillColor};
    stroke: ${options.nodeStrokeColor};
    stroke-width: ${options.nodeStrokeWidth};
  }
  .networkNodeIcon {
    fill: ${options.nodeFillColor};
    stroke: ${options.nodeStrokeColor};
    stroke-width: ${options.nodeStrokeWidth};
  }
  .networkNodeIcon .accent {
    fill: ${options.nodeStrokeColor};
  }
  .networkLink {
    stroke: ${options.linkColor};
    stroke-width: ${options.linkWidth};
    fill: none;
  }
  .networkLabel {
    fill: ${options.labelColor};
    text-anchor: middle;
    dominant-baseline: hanging;
  }
  .networkLinkLabel {
    fill: ${options.linkLabelColor};
    text-anchor: middle;
    dominant-baseline: middle;
    paint-order: stroke;
    stroke: var(--mermaid-bg, #fff);
    stroke-width: 3px;
  }
  .networkTitle {
    fill: ${options.titleColor};
    font-size: ${options.titleFontSize};
    text-anchor: middle;
  }
  .networkArrowHead {
    fill: ${options.linkColor};
    stroke: none;
  }
  .networkSubnetBox {
    fill: ${options.subnetFillColor};
    stroke: ${options.subnetStrokeColor};
    stroke-width: 1;
    stroke-dasharray: 4 3;
  }
  .networkSubnetLabel {
    fill: ${options.subnetLabelColor};
    font-style: italic;
    dominant-baseline: hanging;
  }
  `;
};

export default styles;
