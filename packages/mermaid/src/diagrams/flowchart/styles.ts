// import khroma from 'khroma';
import * as khroma from 'khroma';
import { getIconStyles } from '../globalStyles.js';
import { colorSlotCount, hasPalette, isColorTheme, safeLook } from '../common/colorThemeGate.js';

/** Returns the styles given options */
export interface FlowChartStyleOptions {
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
  strokeWidth: string;
  theme?: string;
  look?: string;
  THEME_COLOR_LIMIT?: number;
  borderColorArray?: string[];
  bkgColorArray?: string[];
}

/**
 * Cycling per-subgraph colour. Only the containers are painted -- the nodes inside keep
 * the uniform look, because a flowchart node is a step in a flow rather than a distinct
 * participant, and node colour is already how `classDef` / `style` carry meaning.
 *
 * Emits both the `rect` (classic/neo) and `path` (handDrawn) forms since the container is
 * a plain rect in one look and a roughjs path pair in the other. `.collapsed-group` is
 * the same container drawn as a compact node by `collapsedGroup.ts` — it is a container,
 * not one of the flow's steps, so it takes the palette too; without it a collapsed
 * subgraph rendered uncoloured beside tinted siblings.
 *
 * Not `!important`: `clusters.js` and `collapsedGroup.ts` both put user styles in an
 * inline `style` attribute, which has to keep winning over the theme palette. The
 * collapsed form's own colours are presentation attributes (`fill=` / `stroke=`), which
 * these rules correctly outrank while still losing to that inline style.
 */
const genColor = (options: FlowChartStyleOptions) => {
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
    /* A collapsed subgraph is drawn by `collapsedGroup.ts` through `getNodeClasses`, which
     * returns `rough-node` instead of `node` for the handDrawn look -- so a `.node`-only
     * selector leaves handDrawn collapsed containers uncoloured beside their tinted
     * siblings. Clusters are unaffected: `clusters.js` sets the `cluster` class directly.
     *
     * Each descendant has to be appended to *both* prefixes separately. Writing
     * `${slot}.node, ${slot}.rough-node .thing` would attach the descendant to the last
     * item of the list only, silently matching nothing under the classic look.
     */
    const collapsedRule = (suffix: string) =>
      `${slot}.node ${suffix}, ${slot}.rough-node ${suffix}`;
    sections += `

    ${slot}.cluster rect {
      stroke: ${borderColor};
      ${fill}
    }

    ${slot}.cluster path {
      stroke: ${borderColor};
      ${fill}
    }

    ${collapsedRule('.collapsed-group')},
    ${collapsedRule('.collapsed-group path')} {
      stroke: ${borderColor};
      ${fill}
    }

    /* The ellipsis dots and the separator take clusterBorder further down, so without
       these the container is palette-coloured while its own markers are not. */
    ${collapsedRule('.collapsed-indicator')} {
      fill: ${borderColor};
    }

    ${collapsedRule('.collapsed-separator')} {
      stroke: ${borderColor};
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

const getStyles = (options: FlowChartStyleOptions) =>
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
  .cluster-label span p {
    background-color: transparent;
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
    stroke-width: ${options.strokeWidth ?? 1}px;
  }
  .rough-node .label text , .node .label text, .image-shape .label, .icon-shape .label {
    text-anchor: middle;
  }

  .node .katex path {
    fill: #000;
    stroke: #000;
    stroke-width: 1px;
  }

  .rough-node .label,.node .label, .image-shape .label, .icon-shape .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }


  .root .anchor path {
    fill: ${options.lineColor} !important;
    stroke-width: 0;
    stroke: ${options.lineColor};
  }

  .arrowheadPath {
    fill: ${options.arrowheadColor};
  }

  .edgePaths .path {
    stroke: ${options.lineColor};
    stroke-width: ${options.strokeWidth ?? 2}px;
  }

  .flowchart-link {
    stroke: ${options.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${options.edgeLabelBackground};
    p {
      background-color: ${options.edgeLabelBackground};
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
    background-color: ${fade(options.edgeLabelBackground, 0.5)};
    // background-color:
  }

  .cluster rect {
    fill: ${options.clusterBkg};
    stroke: ${options.clusterBorder};
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

  /* Collapsed subgraph node (@{ view: collapsed }) */
  .node .collapsed-indicator {
    fill: ${options.clusterBorder};
    stroke: none;
    opacity: 0.6;
  }

  .node .collapsed-separator {
    stroke: ${options.clusterBorder};
    stroke-width: 0.75px;
  }

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

  rect.text {
    fill: none;
    stroke-width: 0;
  }

  .icon-shape, .image-shape {
    background-color: ${options.edgeLabelBackground};
    p {
      background-color: ${options.edgeLabelBackground};
      padding: 2px;
    }
    .label rect {
      opacity: 0.5;
      background-color: ${options.edgeLabelBackground};
      fill: ${options.edgeLabelBackground};
    }
    text-align: center;
  }
  ${getIconStyles()}
`;

export default getStyles;
