import { hasPalette, isColorTheme, paletteSlotCount, safeLook } from '../common/colorThemeGate.js';

/**
 * Cycling per-container colour for composite states and concurrency regions.
 *
 * Only the containers are painted. A plain state is a step in the machine rather than a
 * distinct participant, and `classDef` / `style` is already how colour carries meaning
 * there -- the same line flowchart draws between its subgraphs and its nodes.
 *
 * The treatment follows the swimlane header: the palette's border colour on the outline,
 * its background tint behind the title strip, and the theme's own `compositeBackground`
 * left on the body. Tinting the body as well would stack tint on tint once composites
 * nest, and nesting is exactly where the colours have to stay separable.
 *
 * `redux-dark-color` ships a border palette and an empty background palette, so on that
 * theme the `fill` declarations are omitted entirely and only the outlines take colour --
 * the same outlines-only treatment it gives ER, requirement and sequence.
 *
 * Not `!important`: a state's own `classDef` / `style` has to keep winning over the theme.
 */
const genColor = (options) => {
  const { theme, bkgColorArray, borderColorArray } = options;
  if (!isColorTheme(theme, borderColorArray)) {
    return '';
  }
  // `look` is validated before it reaches the selector -- see `safeLook`.
  const look = safeLook(options.look);
  const hasBkgColors = hasPalette(bkgColorArray);
  let sections = '';

  // One rule per slot `dataFetcher` can hand out; `stampColorSlot` wraps at the palette
  // length, so those are exactly `0 .. borderColorArray.length - 1`.
  for (let i = 0; i < paletteSlotCount(borderColorArray); i++) {
    const borderColor = borderColorArray[i];
    const tint = hasBkgColors ? `fill: ${bkgColorArray[i % bkgColorArray.length]};` : '';
    const slot = `[data-look="${look}"][data-color-id="color-${i}"]`;
    sections += `

    /* The title strip: \`rect.outer\` spans the whole composite and \`rect.inner\` covers
       the body, so what stays visible of \`outer\` is the band behind the label. */
    ${slot}.statediagram-cluster rect.outer {
      stroke: ${borderColor};
      ${tint}
    }

    ${slot}.statediagram-cluster rect.inner {
      stroke: ${borderColor};
    }

    /* Concurrency regions. Siblings of one composite share a slot, so a divided composite
       reads as one thing split into parts rather than as several composites. */
    ${slot}.statediagram-cluster rect.divider {
      stroke: ${borderColor};
      ${tint}
    }

    /* handDrawn draws the same container as roughjs shapes rather than plain rects, so it
       needs its own rules. \`roundedWithTitle\` and \`divider\` name those groups \`outer\`,
       \`inner\` and \`divider\` to match the classic branch, which is what lets these
       discriminate -- a bare \`.statediagram-cluster path\` rule reached the body as well and
       tinted the whole composite, losing \`compositeBackground\` and diverging from what
       classic and neo do.

       roughjs emits two paths per shape and marks them: the filled shape carries
       \`stroke="none"\` and the sketched outline carries \`fill="none"\`. Splitting on that is
       what keeps \`fill\` off the outline -- a rough outline is open squiggles, not a closed
       region, so filling it produces smears -- and keeps \`stroke\` off the fill shape, which
       would otherwise gain an edge it was drawn without. */
    ${slot}.statediagram-cluster .outer path[stroke='none'] {
      ${tint}
    }

    ${slot}.statediagram-cluster .outer path[fill='none'] {
      stroke: ${borderColor};
    }

    /* No \`.inner\` rule on purpose. The body shape is left entirely alone under handDrawn,
       where a rect's \`inner\` counterpart cannot be recoloured safely: roughjs draws a
       hachure fill as *stroked* lines, so its fill paths carry \`fill="none"\` exactly like
       the outline and no selector separates them. An \`.inner\` stroke rule therefore
       repainted the hatching of every alt composite in the palette colour instead of
       leaving it on \`altBackground\`. The container still reads as palette-coloured: the
       \`outer\` shape spans the whole composite, so its outline already frames the body. */

    /* Regions split the same way, which is why \`divider\` fills solid rather than taking
       roughjs's default hachure -- see the note on that call. Hatched, both of its paths
       carried \`fill="none"\` and these two rules degenerated: the tint matched nothing and
       the border rule repainted the hatching. */
    ${slot}.statediagram-cluster .divider path[stroke='none'] {
      ${tint}
    }

    ${slot}.statediagram-cluster .divider path[fill='none'] {
      stroke: ${borderColor};
    }
    `;
  }
  return sections;
};

const getStyles = (options) =>
  `
${genColor(options)}
defs [id$="-barbEnd"] {
    fill: ${options.transitionColor};
    stroke: ${options.transitionColor};
  }
g.stateGroup text {
  fill: ${options.nodeBorder};
  stroke: none;
  font-size: 10px;
}
g.stateGroup text {
  fill: ${options.textColor};
  stroke: none;
  font-size: 10px;

}
g.stateGroup .state-title {
  font-weight: bolder;
  fill: ${options.stateLabelColor};
}

g.stateGroup rect {
  fill: ${options.mainBkg};
  stroke: ${options.nodeBorder};
}

g.stateGroup line {
  stroke: ${options.lineColor};
  stroke-width: ${options.strokeWidth || 1};
}

.transition {
  stroke: ${options.transitionColor};
  stroke-width: ${options.strokeWidth || 1};
  fill: none;
}

.stateGroup .composit {
  fill: ${options.background};
  border-bottom: 1px
}

.stateGroup .alt-composit {
  fill: #e0e0e0;
  border-bottom: 1px
}

.state-note {
  stroke: ${options.noteBorderColor};
  fill: ${options.noteBkgColor};

  text {
    fill: ${options.noteTextColor};
    stroke: none;
    font-size: 10px;
  }
}

.stateLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${options.mainBkg};
  opacity: 0.5;
}

.edgeLabel .label rect {
  fill: ${options.labelBackgroundColor};
  opacity: 0.5;
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
.edgeLabel .label text {
  fill: ${options.transitionLabelColor || options.tertiaryTextColor};
}
.label div .edgeLabel {
  color: ${options.transitionLabelColor || options.tertiaryTextColor};
}

.stateLabel text {
  fill: ${options.stateLabelColor};
  font-size: 10px;
  font-weight: bold;
}

.node circle.state-start {
  fill: ${options.specialStateColor};
  stroke: ${options.specialStateColor};
}

.node .fork-join {
  fill: ${options.specialStateColor};
  stroke: ${options.specialStateColor};
}

.node circle.state-end {
  fill: ${options.innerEndBackground};
  stroke: ${options.background};
  stroke-width: 1.5
}
.end-state-inner {
  fill: ${options.compositeBackground || options.background};
  // stroke: ${options.background};
  stroke-width: 1.5
}

.node rect {
  fill: ${options.stateBkg || options.mainBkg};
  stroke: ${options.stateBorder || options.nodeBorder};
  stroke-width: ${options.strokeWidth || 1}px;
}
.node polygon {
  fill: ${options.mainBkg};
  stroke: ${options.stateBorder || options.nodeBorder};;
  stroke-width: ${options.strokeWidth || 1}px;
}
[id$="-barbEnd"] {
  fill: ${options.lineColor};
}

.statediagram-cluster rect {
  fill: ${options.compositeTitleBackground};
  stroke: ${options.stateBorder || options.nodeBorder};
  stroke-width: ${options.strokeWidth || 1}px;
}

.cluster-label, .nodeLabel {
  color: ${options.stateLabelColor};
  // line-height: 1;
}

.statediagram-cluster rect.outer {
  rx: 5px;
  ry: 5px;
}
.statediagram-state .divider {
  stroke: ${options.stateBorder || options.nodeBorder};
}

.statediagram-state .title-state {
  rx: 5px;
  ry: 5px;
}
.statediagram-cluster.statediagram-cluster .inner {
  fill: ${options.compositeBackground || options.background};
}
.statediagram-cluster.statediagram-cluster-alt .inner {
  fill: ${options.altBackground ? options.altBackground : '#efefef'};
}

.statediagram-cluster .inner {
  rx:0;
  ry:0;
}

.statediagram-state rect.basic {
  rx: 5px;
  ry: 5px;
}
.statediagram-state rect.divider {
  stroke-dasharray: 10,10;
  fill: ${options.altBackground ? options.altBackground : '#efefef'};
}

.note-edge {
  stroke-dasharray: 5;
}

.statediagram-note rect {
  fill: ${options.noteBkgColor};
  stroke: ${options.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}
.statediagram-note rect {
  fill: ${options.noteBkgColor};
  stroke: ${options.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}

.statediagram-note text {
  fill: ${options.noteTextColor};
}

.statediagram-note .nodeLabel {
  color: ${options.noteTextColor};
}
.statediagram .edgeLabel {
  color: red; // ${options.noteTextColor};
}

[id$="-dependencyStart"], [id$="-dependencyEnd"] {
  fill: ${options.lineColor};
  stroke: ${options.lineColor};
  stroke-width: ${options.strokeWidth || 1};
}

.statediagramTitleText {
  text-anchor: middle;
  font-size: 18px;
  fill: ${options.textColor};
}

[data-look="neo"].statediagram-cluster rect {
  fill: ${options.mainBkg};
  stroke: ${options.useGradient ? 'url(' + options.svgId + '-gradient)' : options.stateBorder || options.nodeBorder};
  stroke-width: ${options.strokeWidth ?? 1};
}
[data-look="neo"].statediagram-cluster rect.outer {
  rx: ${options.radius}px;
  ry: ${options.radius}px;
  filter: ${options.dropShadow ? options.dropShadow.replace('url(#drop-shadow)', `url(${options.svgId}-drop-shadow)`) : 'none'}
}
`;

// todo: change composit to composite
// cspell:ignore composit

export default getStyles;
