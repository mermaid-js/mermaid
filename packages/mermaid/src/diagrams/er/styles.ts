import * as khroma from 'khroma';
import type { FlowChartStyleOptions } from '../flowchart/styles.js';
import * as configApi from '../../config.js';
import type { DiagramStylesProvider } from '../../diagram-api/types.js';

const fade = (color: string, opacity: number) => {
  // @ts-ignore TODO: incorrect types from khroma
  const channel = khroma.channel;

  const r = channel(color, 'r');
  const g = channel(color, 'g');
  const b = channel(color, 'b');

  // @ts-ignore incorrect types from khroma
  return khroma.rgba(r, g, b, opacity);
};

const genColor: DiagramStylesProvider = (options) => {
  const config = configApi.getConfig();

  const { theme, themeVariables, look } = config;
  const { bkgColorArray, borderColorArray } = themeVariables;
  if (!theme?.includes('color')) {
    return '';
  }
  let sections = '';

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    sections += `

    [data-look="${look}"][data-color-id="color-${i}"].node path {
    stroke: ${borderColorArray[i]};
    fill: ${theme === 'redux-color' ? bkgColorArray[i] : ''};
    }

    [data-look="${look}"][data-color-id="color-${i}"].node  rect {
    stroke: ${borderColorArray[i]};
    fill: ${theme === 'redux-color' ? bkgColorArray[i] : ''};
     }
    `;
  }
  return sections;
};

const getStyles = (options: FlowChartStyleOptions) => {
  const config = configApi.getConfig();
  const { look, theme, themeVariables } = config;
  const { erEdgeLabelBackground, strokeWidth } = themeVariables;
  return `
    ${genColor(options)}
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
    background-color: ${theme?.includes('redux') && erEdgeLabelBackground ? erEdgeLabelBackground : fade(options.tertiaryColor, 0.5)};
  }

  .edgeLabel {
    background-color: ${theme?.includes('redux') && erEdgeLabelBackground ? erEdgeLabelBackground : options.edgeLabelBackground};
  }
  .edgeLabel .label rect {
    fill: ${theme?.includes('redux') && erEdgeLabelBackground ? erEdgeLabelBackground : options.edgeLabelBackground};
  }
  .edgeLabel .label text {
    fill: ${options.textColor};
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
    stroke-width: ${look === 'neo' ? strokeWidth : '1px'};
  }

  .relationshipLine {
    stroke: ${options.lineColor};
    stroke-width: ${look === 'neo' ? strokeWidth : '1px'};
    fill: none;
  }

  .marker {
    fill: none !important;
    stroke: ${options.lineColor} !important;
    stroke-width: 1;
  }
  [data-look=neo].labelBkg {
    background-color: ${fade(options.tertiaryColor, 0.5)};
  }
`;
};

export default getStyles;
