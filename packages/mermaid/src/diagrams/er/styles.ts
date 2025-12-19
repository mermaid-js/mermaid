import * as khroma from 'khroma';
import type { FlowChartStyleOptions } from '../flowchart/styles.js';

const fade = (color: string, opacity: number) => {
  // @ts-ignore TODO: incorrect types from khroma
  const channel = khroma.channel;

  const r = channel(color, 'r');
  const g = channel(color, 'g');
  const b = channel(color, 'b');

  // @ts-ignore incorrect types from khroma
  return khroma.rgba(r, g, b, opacity);
};

export interface ErStyleOptions {
  background: string;
  nodeBorder: string;
  rowOdd: string;
  rowEven: string;
}

const getStyles = (options: FlowChartStyleOptions & ErStyleOptions) =>
  // language=css
  `
  .entityBox {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder};
  }

  .relationshipLabelBox {
    fill: ${options.tertiaryColor};
    opacity: 0.7;
    background-color: ${options.tertiaryColor};
      rect {
        opacity: 0.5;
      }
  }

  .labelBkg {
    background-color: ${fade(options.tertiaryColor, 0.5)};
  }

  .edgeLabel .label {
    fill: ${options.nodeBorder};
    font-size: 14px;
  }

  .label {
    font-family: ${options.fontFamily};
    color: ${options.nodeTextColor || options.textColor};
  }

  .edge-pattern-dashed {
    stroke-dasharray: 8,8;
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon
  {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder};
    stroke-width: 1px;
  }

  .relationshipLine {
    stroke: ${options.lineColor};
    stroke-width: 1;
    fill: none;
  }

  .marker {
    fill: none !important;
    stroke: ${options.lineColor} !important;
    stroke-width: 1;
  }
  
  /* Shape  */
  .rect.shape {
    fill: transparent;
  }
  
  /* Lines */
  line.divider {
    stroke: ${options.nodeBorder};
  }
  
  g.rect>path:nth-child(2), g.divider>path {
    stroke: ${options.nodeBorder};
  }

  /* Header */
  .rect.row-header {
    fill: ${options.mainBkg};
  }
  .rect.row-header-background {
    fill: ${options.background};
  }

  g.row-header path:nth-child(1) {
    stroke: ${options.mainBkg};
  }

  /* Odd rows */
  .rect.row-odd {
    fill: ${options.rowOdd};
    stroke: ${options.nodeBorder};
    stroke-width: 1px;
  }
  .rect.row-odd-background {
    fill: ${options.mainBkg};
  }
  
  g.row-odd path:nth-child(1) {
    stroke: ${options.rowOdd};
  }
  
  /* Even rows */
  .rect.row-even {
    fill: ${options.rowEven};
    stroke: ${options.nodeBorder};
    stroke-width: 1px;
  }
  .rect.row-even-background {
      fill: ${options.mainBkg};
  }
  
  g.row-even path:nth-child(1) {
    stroke: ${options.rowEven};
  }
`;

export default getStyles;
