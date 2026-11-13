import * as khroma from 'khroma';
import { getIconStyles } from '../globalStyles.js';
import { colorSlotCount, hasPalette, isColorTheme, safeLook } from '../common/colorThemeGate.js';
import { KINDS, KIND_SLOT, containerSlot, containerSlotCount, kindClass } from './colorSlots.js';

/** Returns the styles given options */
export interface AgentflowStyleOptions {
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
  strokeWidth?: string;
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
 * Palette rules. Two families, matching the two rules in `colorSlots.ts`: one colour per
 * node KIND from a fixed slot, and a counter over containers from the slots above them.
 *
 * `redux-dark-color` carries 12 border colours and no background array, so `hasBkgColors`
 * is false there and these rules stroke without filling — the node keeps the theme's own
 * background. That is the palette telling us what it has, not a special case.
 *
 * Not `!important`: a node carrying `classDef` or `style` gets an inline `style`
 * attribute, which has to keep winning over the theme palette.
 */
const genColor = (options: AgentflowStyleOptions) => {
  const { theme, bkgColorArray, borderColorArray } = options;
  if (!isColorTheme(theme, borderColorArray)) {
    return '';
  }
  const look = safeLook(options.look);
  const hasBkgColors = hasPalette(bkgColorArray);
  const paletteLength = colorSlotCount(options.THEME_COLOR_LIMIT, borderColorArray);
  const border = (slot: number) => borderColorArray![slot % borderColorArray!.length];
  const fill = (slot: number) =>
    hasBkgColors ? `fill: ${bkgColorArray[slot % bkgColorArray.length]};` : '';

  let sections = '';

  /* One rule per kind. Every agentflow shape is drawn as a `path` except the rounded
     `task`, which is a `rect`, so both are named for each kind rather than guessing. */
  for (const kind of KINDS) {
    const slot = KIND_SLOT.get(kind)!;
    /* Compound, not descendant: `insertNode` puts `data-look` on the very element that
       carries the kind class, so a space would ask for the class on a CHILD and match
       nothing.
     *
     * `.node` is named as well, and it is not decoration. The shared neo stylesheet emits
     * `[data-look="neo"].node rect, … .node polygon`, which is (0,2,1) — exactly the
     * specificity of `[data-look][class]` — and it is appended after the diagram's own
     * styles, so an equal-specificity rule loses on order and the palette never appears.
     * Adding `.node` makes this (0,3,1) and settles it by weight rather than by luck. */
    const sel = `[data-look="${look}"].node.${kindClass(kind)}`;
    sections += `

    ${sel} rect,
    ${sel} path,
    ${sel} polygon {
      stroke: ${border(slot)};
      ${fill(slot)}
    }
`;
  }

  /* Containers cycle the slots above the kind range, so a frame never matches a node
     inside it. Keyed on `data-color-id`, the same carrier every other diagram's containers
     use — `createContainerGroup` stamps the expanded frame, `collapsedGroup` the collapsed
     one. */
  for (let i = 0; i < containerSlotCount(paletteLength); i++) {
    // The same arithmetic the assignment uses, so the selector always names the slot the
    // stamp actually writes -- see `containerSlot`.
    const slot = containerSlot(i, paletteLength);
    /* Both forms of a container. An expanded one is a `.cluster`; a collapsed one is
       drawn as a single `.node` and still holds its slot, so naming only `.cluster` would
       leave collapsed containers grey beside their expanded siblings. Each suffix is
       appended to both prefixes separately: a comma-joined prefix list would attach the
       suffix to the last item only. */
    const expanded = `[data-look="${look}"][data-color-id="color-${slot}"].cluster`;
    const collapsed = `[data-look="${look}"][data-color-id="color-${slot}"].node`;
    const rule = (suffix: string) => `${expanded} ${suffix}, ${collapsed} ${suffix}`;
    sections += `

    ${rule('rect')},
    ${rule('path')} {
      stroke: ${border(slot)};
      ${fill(slot)}
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

const getStyles = (options: AgentflowStyleOptions) =>
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
    fill: ${options.nodeTextColor || options.textColor};
    stroke: ${options.nodeTextColor || options.textColor};
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
  }

  .cluster rect {
    fill: ${options.clusterBkg};
    stroke: ${options.clusterBorder};
    stroke-width: 1px;
  }

  .flow-cluster rect {
    fill: none;
    stroke: ${options.clusterBorder};
    stroke-width: 0.75px;
  }

  .node .collapsed-indicator {
    fill: ${options.nodeBorder};
    stroke: none;
    stroke-width: 0;
    opacity: 0.5;
  }

  .node .collapsed-separator {
    stroke-width: 0.75px;
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

  .agentflowTitleText {
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
