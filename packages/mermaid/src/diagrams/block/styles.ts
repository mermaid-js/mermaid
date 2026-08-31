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
 * Per-block palette rules, the same mechanism the flowchart uses for its subgraphs: the
 * db numbers each block in declaration order, the renderer stamps that number as
 * `data-color-id`, and these rules map the slot to a border and a fill.
 *
 * Every block shape has to be named. A block diagram draws through far more shapes than a
 * flowchart subgraph does -- `rect` for square and rounded, `polygon` for the diamond,
 * hexagon, trapezoids and leans, `path` for the block arrow and the stadium, `circle` and
 * `ellipse` for the round forms -- and a shape left out here renders uncoloured beside
 * its tinted neighbours rather than failing in any visible way.
 *
 * `.rough-node` is listed alongside `.node` because `getNodeClasses` returns that instead
 * under the handDrawn look, and each descendant is appended to both prefixes separately:
 * writing `${'${slot}'}.node, ${'${slot}'}.rough-node rect` would attach `rect` to the last item of
 * the list only and silently match nothing under classic.
 *
 * Not `!important`: a block carrying `classDef` or `style` gets an inline `style`
 * attribute, which has to keep winning over the theme palette.
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
    const rule = (suffix: string) => `${slot}.node ${suffix}, ${slot}.rough-node ${suffix}`;

    sections += `

    ${rule('rect')},
    ${rule('polygon')},
    ${rule('circle')},
    ${rule('ellipse')} {
      stroke: ${borderColor};
      ${fill}
    }

    /* The block arrow and the stadium are drawn as paths, and every shape is a path
       under handDrawn. */
    ${rule('path')} {
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
