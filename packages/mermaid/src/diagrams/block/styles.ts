import * as khroma from 'khroma';
import { getIconStyles } from '../globalStyles.js';
import { colorSlotCount, hasPalette, isColorTheme, safeLook } from '../common/colorThemeGate.js';

/** Returns the styles given options */
export interface BlockChartStyleOptions {
  arrowheadColor: string;
  border2: string;
  clusterBkg: string;
  clusterBorder: string;
  edgeLabelBackground: string;
  fontFamily: string;
  lineColor: string;
  mainBkg: string;
  nodeBorder: string;
  nodeTextColor: string;
  tertiaryColor: string;
  textColor: string;
  titleColor: string;
  /* Supplied by `createUserStyles`, which spreads `config.themeVariables` and adds the
     theme name and look. Only the colour themes carry the palette arrays. */
  theme?: string;
  look?: string;
  borderColorArray?: string[];
  bkgColorArray?: string[];
  THEME_COLOR_LIMIT?: number;
}

/**
 * Per-composite palette rules, matching what the flowchart does for its subgraphs: one
 * counter over containers, and nothing on the plain shapes.
 *
 * A composite always draws a `rect.composite` inside a `.node` group -- it has no roughjs
 * variant, so unlike the flowchart there is no `.rough-node` prefix to mirror and no
 * hachure path to avoid painting. That one selector is the whole surface.
 *
 * Not `!important`: `composite.ts` puts a block's own `style` declarations in an inline
 * `style` attribute, which has to keep winning over the theme palette.
 */
const genColor = (options: BlockChartStyleOptions) => {
  const { theme, bkgColorArray, borderColorArray } = options;
  if (!isColorTheme(theme, borderColorArray)) {
    return '';
  }
  const look = safeLook(options.look);
  const hasBkgColors = hasPalette(bkgColorArray);
  let sections = '';

  for (let i = 0; i < colorSlotCount(options.THEME_COLOR_LIMIT, borderColorArray); i++) {
    const borderColor = borderColorArray![i % borderColorArray!.length];
    const fill = hasBkgColors ? `fill: ${bkgColorArray[i % bkgColorArray.length]};` : '';
    const slot = `[data-look="${look}"][data-color-id="color-${i}"]`;

    sections += `

    ${slot}.node rect.composite {
      stroke: ${borderColor};
      ${fill}
    }
`;
  }
  return sections;
};

const fade = (color: string, opacity: number) => {
  // @ts-ignore TODO: incorrect types from khroma
  const channel = khroma.channel;

  const r = channel(color, 'r');
  const g = channel(color, 'g');
  const b = channel(color, 'b');

  // @ts-ignore incorrect types from khroma
  return khroma.rgba(r, g, b, opacity);
};

const getStyles = (options: BlockChartStyleOptions) =>
  `${genColor(options)}
  .label {
    font-family: ${options.fontFamily};
    color: ${options.nodeTextColor || options.textColor};
  }
  .cluster-label text {
    fill: ${options.titleColor};
  }
  .cluster-label span {
    color: ${options.titleColor};
  }



  .label text,span {
    fill: ${options.nodeTextColor || options.textColor};
    color: ${options.nodeTextColor || options.textColor};
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder};
    stroke-width: 1px;
  }
  .flowchart-label text {
    text-anchor: middle;
  }
  // .flowchart-label .text-outer-tspan {
  //   text-anchor: middle;
  // }
  // .flowchart-label .text-inner-tspan {
  //   text-anchor: start;
  // }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${options.arrowheadColor};
  }

  .edgePaths .path {
    stroke: ${options.lineColor};
    stroke-width: 2.0px;
  }

  .flowchart-link {
    stroke: ${options.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${options.edgeLabelBackground};
    /*
     * This is for backward compatibility with existing code that didn't
     * add a \`<p>\` around edge labels.
     *
     * TODO: We should probably remove this in a future release.
     */
    p {
      margin: 0;
      padding: 0;
      display: inline;
    }
    rect {
      opacity: 0.5;
      background-color: ${options.edgeLabelBackground};
      fill: ${options.edgeLabelBackground};
    }
    text-align: center;
  }

  /* For html labels only */
  .labelBkg {
    background-color: ${options.edgeLabelBackground};
  }

  .node .cluster {
    // fill: ${fade(options.mainBkg, 0.5)};
    fill: ${fade(options.clusterBkg, 0.5)};
    stroke: ${fade(options.clusterBorder, 0.2)};
    box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
    stroke-width: 1px;
  }

  .cluster text {
    fill: ${options.titleColor};
  }

  .cluster span {
    color: ${options.titleColor};
  }
  /* .cluster div {
    color: ${options.titleColor};
  } */

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: ${options.fontFamily};
    font-size: 12px;
    background: ${options.tertiaryColor};
    border: 1px solid ${options.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .flowchartTitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${options.textColor};
  }
  ${getIconStyles()}
`;

export default getStyles;
