import * as khroma from 'khroma';
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
const COLOR_THEMES = new Set(['redux-color', 'redux-dark-color']);

const genColor: DiagramStylesProvider = (options) => {
  const { theme, look, bkgColorArray, borderColorArray } = options;
  if (!COLOR_THEMES.has(theme)) {
    return '';
  }
  const hasBkgColors = bkgColorArray?.length > 0;
  let sections = '';

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    sections += `

    [data-look="${look}"][data-color-id="color-${i}"].node path {
    stroke: ${borderColorArray[i]};
    ${hasBkgColors ? `fill: ${bkgColorArray[i]};` : ''}
    }

    [data-look="${look}"][data-color-id="color-${i}"].node  rect {
    stroke: ${borderColorArray[i]};
    ${hasBkgColors ? `fill: ${bkgColorArray[i]};` : ''}
     }
    `;
  }
  return sections;
};

const getStyles: DiagramStylesProvider = (options) => {
  const { look, theme, erEdgeLabelBackground, strokeWidth } = options;
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
    background-color: ${COLOR_THEMES.has(theme) && erEdgeLabelBackground ? erEdgeLabelBackground : fade(options.tertiaryColor, 0.5)};
  }

  .edgeLabel {
    background-color: ${COLOR_THEMES.has(theme) && erEdgeLabelBackground ? erEdgeLabelBackground : options.edgeLabelBackground};
  }
  .edgeLabel .label rect {
    fill: ${COLOR_THEMES.has(theme) && erEdgeLabelBackground ? erEdgeLabelBackground : options.edgeLabelBackground};
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
