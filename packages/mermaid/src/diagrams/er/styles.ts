import * as khroma from 'khroma';
import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import {
  COLOR_THEMES,
  hasPalette,
  isColorTheme,
  paletteSlotCount,
  safeLook,
} from '../common/colorThemeGate.js';

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
  const { theme, bkgColorArray, borderColorArray } = options;
  // `isColorTheme` covers both halves of this gate: the theme has to be a colour theme
  // *and* the border palette has to be a non-empty array. The palette half matters on its
  // own -- it is reachable through a `themeVariables` override -- because an empty palette
  // would otherwise leave every slot emitting `stroke: undefined`.
  if (!isColorTheme(theme, borderColorArray)) {
    return '';
  }
  // `look` is validated before it reaches the selector -- see `safeLook`.
  const look = safeLook(options.look);
  const hasBkgColors = hasPalette(bkgColorArray);
  let sections = '';

  // One rule per slot `erBox` can actually stamp. It stamps
  // `colorIndex % borderColorArray.length`, so the ids it can produce are exactly
  // `0 .. borderColorArray.length - 1` -- deriving the bound from the same length is what
  // keeps the two from disagreeing. Looping to `THEME_COLOR_LIMIT` instead left a palette
  // longer than the limit with stamped entities that had no rule to match, and a shorter
  // one with dead rules.
  for (let i = 0; i < paletteSlotCount(borderColorArray); i++) {
    // `borderColorArray[i]` needs no wrap now the bound is its own length. The background
    // palette is a separate array that may be shorter, so that one still wraps -- guarded
    // by `hasBkgColors`, since `i % 0` is NaN and `[][NaN]` is `undefined`.
    const borderColor = borderColorArray[i];
    const fill = hasBkgColors ? `fill: ${bkgColorArray[i % bkgColorArray.length]};` : '';
    sections += `

    [data-look="${look}"][data-color-id="color-${i}"].node path {
    stroke: ${borderColor};
    ${fill}
    }

    [data-look="${look}"][data-color-id="color-${i}"].node  rect {
    stroke: ${borderColor};
    ${fill}
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

  .cluster rect {
    fill: ${options.clusterBkg ?? options.mainBkg};
    stroke: ${options.clusterBorder ?? options.nodeBorder};
    stroke-width: 1px;
  }

  .cluster text {
    fill: ${options.titleColor ?? options.textColor};
  }

  .cluster-label text {
    fill: ${options.titleColor ?? options.textColor};
  }
`;
};

export default getStyles;
