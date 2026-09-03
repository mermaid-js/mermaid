import * as configApi from '../../config.js';
import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { hasPalette, isColorTheme, paletteSlotCount, safeLook } from '../common/colorThemeGate.js';

interface UsecaseStyleOptions {
  actorBkg?: string;
  actorBorder?: string;
  actorTextColor?: string;
  clusterBkg: string;
  clusterBorder: string;
  edgeLabelBackground: string;
  fontFamily: string;
  lineColor: string;
  mainBkg: string;
  nodeBorder?: string;
  noteBkgColor: string;
  noteBorderColor: string;
  noteTextColor: string;
  primaryColor: string;
  primaryTextColor: string;
  titleColor?: string;
  theme?: string;
  look?: string;
  borderColorArray?: string[];
  bkgColorArray?: string[];
  usecaseActorBkg?: string;
  usecaseActorBorder?: string;
  usecaseBkg?: string;
  usecaseBorder?: string;
  usecaseBoundaryBkg?: string;
  usecaseBoundaryBorder?: string;
  usecaseIncludeLine?: string;
  usecaseExtendLine?: string;
}

/**
 * One colour per kind of element, rather than a slot per element.
 *
 * These are the values the `role` scheme paints with, and they are the default because
 * colour that tracks *type* survives editing: inserting a use case in the middle of a
 * diagram leaves every other element's colour alone, so diffs, documentation screenshots
 * and visual baselines stay stable. In a use case diagram the shape already encodes the
 * type -- stick figure, ellipse, frame -- so rotating hue across ellipses would add a
 * second encoding that carries no information, and a fixed set of tokens can be tuned for
 * contrast once per theme instead of being a per-instance lottery.
 *
 * Every fallback ends at the value the stylesheet used before these tokens existed, so a
 * theme that sets none of them renders exactly as it did. A user `themeVariables` override
 * lands on the options object whether or not the active theme declares the token.
 */
const roleColors = (options: UsecaseStyleOptions) => ({
  actorBkg: options.usecaseActorBkg ?? options.actorBkg ?? options.mainBkg,
  actorBorder: options.usecaseActorBorder ?? options.actorBorder ?? options.primaryColor,
  bkg: options.usecaseBkg ?? options.mainBkg,
  border: options.usecaseBorder ?? options.nodeBorder ?? options.primaryColor,
  boundaryBkg: options.usecaseBoundaryBkg ?? options.clusterBkg,
  boundaryBorder: options.usecaseBoundaryBorder ?? options.clusterBorder,
  includeLine: options.usecaseIncludeLine ?? options.lineColor,
  extendLine: options.usecaseExtendLine ?? options.lineColor,
});

/**
 * Cycling per-item colour under the `redux-color` / `redux-dark-color` themes. Actors, use
 * cases and system boundaries all take a slot from one cycle assigned in `usecaseDb`;
 * notes and JSON tables are never stamped, so they keep the theme's fixed colours.
 *
 * Every selector here is scoped to a `usecase-` class rather than a bare `.node`. `usecaseDb`
 * hands a slot only to the three roles above, and the shapes stamp only what it assigned, so
 * a note or JSON table carries no `data-color-id` to match -- the scoping keeps these rules
 * narrow rather than being what makes them miss.
 *
 * Nothing is `!important`: the shapes put user `classDef` / `style` declarations in an
 * inline `style` attribute, which has to keep winning over the theme palette.
 */
const genColor: DiagramStylesProvider = (options) => {
  const { theme, bkgColorArray, borderColorArray } = options;
  // Both halves of the gate: a colour theme *and* a non-empty palette. An empty palette is
  // reachable through a `themeVariables` override, and would otherwise leave every slot
  // emitting `stroke: undefined`.
  if (!isColorTheme(theme, borderColorArray)) {
    return '';
  }
  // System boundaries take a palette slot under both schemes; actors and use cases only
  // under `rotate`. Read from `getConfig()` rather than `options`, which carries theme
  // variables and not the per-diagram config; `requirement` reads its palette the same way.
  const rotate = configApi.getConfig().usecase?.colorScheme === 'rotate';
  // `look` is validated before it reaches the selector -- see `safeLook`.
  const look = safeLook(options.look);
  // Every rule below is scoped to `[data-look="${look}"]`, and one look applies to a whole
  // diagram, so this flag decides the rules for exactly the nodes they can match.
  const isHandDrawn = look === 'handDrawn';
  const hasBkgColors = hasPalette(bkgColorArray);
  let sections = '';

  // One rule per slot that can actually be stamped. `stampColorSlot` assigns
  // `colorIndex % borderColorArray.length`, so deriving the bound from the same length is
  // what keeps the emitted rules and the stamped ids from disagreeing.
  for (let i = 0; i < paletteSlotCount(borderColorArray); i++) {
    const borderColor = borderColorArray[i];
    // The background palette is a separate array that may be shorter, so it still wraps --
    // guarded by `hasBkgColors`, since `i % 0` is NaN and `[][NaN]` is `undefined`.
    // `redux-dark-color` is the live no-background case: it colours outlines only.
    const fill = hasBkgColors ? `fill: ${bkgColorArray[i % bkgColorArray.length]};` : '';
    const slot = `[data-look="${look}"][data-color-id="color-${i}"]`;

    /* System boundaries, in both schemes. A boundary is a container, and numbering the
       containers is the one place a counter carries information rather than noise: the slot
       says which group a thing belongs to, and it stays put as long as the boundary order
       does. Same reasoning, and the same declaration-index numbering, as flowchart
       subgraphs.

       Descends into the handDrawn paths as flowchart does, which collapses a handDrawn
       boundary into a solid hachure block -- a handDrawn flowchart subgraph under these
       themes already renders that way, and diverging here would be the odder result. */
    sections += `

    & ${slot}.system-boundary rect.boundary-body,
    & ${slot}.system-boundary rect.boundary-tab,
    & ${slot}.system-boundary .boundary-body path,
    & ${slot}.system-boundary .boundary-tab path {
      stroke: ${borderColor};
      ${fill}
    }
    `;

    if (!rotate) {
      continue;
    }

    sections += `

    /* Use case bodies -- \`.usecase-element\` covers the ellipse form, the \`[Rect]\` form and
       the business variant.

       Element selectors only, never a bare \`path\`. Under the handDrawn look roughjs draws
       the body as a *pair* of paths, an outline stroked in the border colour and a hachure
       fill stroked in the background colour, with no class to tell them apart. Stroking
       both repaints the fill lines as border colour and the shape collapses into a solid
       block -- which is what \`.usecase-element path\` did. So handDrawn bodies keep the
       theme's uniform colours, exactly as handDrawn flowchart nodes do. */
    & ${slot}.usecase-element ellipse,
    & ${slot}.usecase-element rect {
      stroke: ${borderColor};
      ${fill}
    }

    /* The business marker is a single classed path, so it can be reached safely by name --
       without it the marker keeps the uniform border beside a palette-coloured body. No
       \`fill\`: the marker is drawn with \`fill="none"\` and has to stay that way. */
    & ${slot}.usecase-element .usecase-business-marker {
      stroke: ${borderColor};
    }

    /* Actor glyphs, mirroring the uniform rule further down. The fill goes on the glyph
       group, never on its children, so the hollow variant's own \`fill="none"\` keeps
       winning and a hollow actor stays hollow. Same reason as above for not descending
       into the handDrawn paths. */
    & ${slot}.usecase-actor .usecase-actor-shape,
    & ${slot}.usecase-actor .usecase-actor-hollow,
    & ${slot}.usecase-actor .usecase-actor-awesome,
    & ${slot}.usecase-actor .usecase-actor-icon {
      stroke: ${borderColor};
      ${fill}
    }
${
  isHandDrawn
    ? ''
    : `
    /* The group rule above reaches the glyph by inheritance, which the neo look breaks: it
       ships a \`[data-look="neo"].node path { stroke }\` rule that hits the glyph's own paths,
       and a value set directly on the child always beats one inherited from the parent,
       whatever the parent rule's specificity. So name the children too.

       Emitted for every look *except* handDrawn, where roughjs draws the glyph as an
       outline path plus a hachure fill path stroked in the fill colour, indistinguishable
       in CSS -- stroking both turns a hollow actor into a solid disc. Deliberately no
       \`fill\` either way, so the hollow variant's own \`fill="none"\` keeps winning. */
    & ${slot}.usecase-actor .usecase-actor-glyph path,
    & ${slot}.usecase-actor .usecase-actor-glyph circle {
      stroke: ${borderColor};
    }
`
}
    `;
  }
  return sections;
};

const getStyles: DiagramStylesProvider = (options: UsecaseStyleOptions) => {
  const role = roleColors(options);
  // Under handDrawn the glyph is a roughjs outline path plus a hachure fill path stroked in
  // the fill colour, with nothing in CSS to tell them apart -- so the descendant rule below
  // is emitted for every other look only. See `genColor` for the same split.
  const isHandDrawn = safeLook(options.look) === 'handDrawn';
  return `
  ${genColor(options)}
  & .usecase-actor {
    color: ${options.actorTextColor ?? options.primaryTextColor};
  }

  & .usecase-actor-shape,
  & .usecase-actor-hollow,
  & .usecase-actor-awesome,
  & .usecase-actor-icon {
    fill: ${role.actorBkg};
    stroke: ${role.actorBorder};
    stroke-width: 2px;
  }
${
  isHandDrawn
    ? ''
    : `
  /* The rule above colours the glyph group and lets its children inherit, which the neo
     look breaks: it ships a \`[data-look="neo"].node path { stroke }\` rule that lands on
     the glyph's own paths, and a value set directly on a child always beats one inherited
     from its parent, whatever the parent rule's specificity. Since neo is the default look,
     without this every actor renders in the node border colour rather than the actor
     colour the rule above asks for.

     \`.node\` is in the selector to outrank that neo rule rather than tie with it: both
     would otherwise be one attribute plus one class plus one element, leaving the winner to
     depend on which stylesheet is concatenated last.

     Stroke only: the hollow variant's own \`fill="none"\` has to keep winning. */
  & .node.usecase-actor .usecase-actor-glyph path,
  & .node.usecase-actor .usecase-actor-glyph circle {
    stroke: ${role.actorBorder};
  }
`
}
  & .usecase-actor .nodeLabel,
  & .actor-label {
    color: ${options.actorTextColor ?? options.primaryTextColor};
    fill: ${options.actorTextColor ?? options.primaryTextColor};
    font-family: var(--mermaid-usecase-actor-font-family, ${options.fontFamily});
    font-size: var(--mermaid-usecase-actor-font-size, 14px);
    font-weight: var(--mermaid-usecase-actor-font-weight, normal);
  }

  & .usecase-element ellipse,
  & .usecase-element rect,
  & .usecase-business ellipse,
  & .usecase-business rect {
    fill: ${role.bkg};
    stroke: ${role.border};
    stroke-width: 2px;
  }
${
  isHandDrawn
    ? ''
    : `
  /* The same interception the actor glyph hits, one element down: neo ships
     \`[data-look="neo"].node rect { stroke: nodeBorder }\`, which outranks the plain
     \`.usecase-element rect\` above, so a use case written in the \`[Rect]\` form kept the node
     border colour while its ellipse siblings took the role colour. An \`<ellipse>\` has no
     equivalent neo rule and is already correct; restating it here costs nothing and means
     the two forms cannot drift apart again.

     Qualified with \`[data-look]\` *and* \`.node\` to land strictly above that rule rather than
     tie with it -- on a tie the later stylesheet would win, which is how neo took this in
     the first place. Skipped under handDrawn, where roughjs draws paths and neither element
     exists. */
  & [data-look="${safeLook(options.look)}"].node.usecase-element ellipse,
  & [data-look="${safeLook(options.look)}"].node.usecase-element rect {
    fill: ${role.bkg};
    stroke: ${role.border};
  }

  /* The business marker is a \`<path>\`, so it loses to \`[data-look="neo"].node path\` the same
     way. No \`fill\`: the marker is drawn with \`fill="none"\` and has to stay that way. */
  & [data-look="${safeLook(options.look)}"].node.usecase-element .usecase-business-marker {
    stroke: ${role.border};
  }
`
}
  & .usecase-element .nodeLabel,
  & .usecase-label {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
    font-family: var(--mermaid-usecase-font-family, ${options.fontFamily});
    font-size: var(--mermaid-usecase-font-size, 12px);
    font-weight: var(--mermaid-usecase-font-weight, normal);
  }

  & .usecase-stereotype,
  & .usecase-business-marker {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
    stroke: ${role.border};
  }

  & .system-boundary rect.boundary-body,
  & .system-boundary rect.boundary-tab,
  & .system-boundary-package-tab {
    fill: ${role.boundaryBkg};
    stroke: ${role.boundaryBorder};
    stroke-width: 1px;
  }

  & .system-boundary-title text {
    fill: ${options.titleColor ?? options.primaryTextColor};
  }

  /* Only the span, never the <p> inside it: the renderer puts a user-supplied
     'color' on the span, and that has to stay inheritable by its children. */
  & .system-boundary-title span {
    color: ${options.titleColor ?? options.primaryTextColor};
  }

  & .usecase-note {
    fill: ${options.noteBkgColor};
    stroke: ${options.noteBorderColor};
    color: ${options.noteTextColor};
  }

  & .usecase-note .nodeLabel {
    color: ${options.noteTextColor};
    fill: ${options.noteTextColor};
  }

  & .usecase-json-table,
  & .usecase-json-table rect,
  & .usecase-json-cell {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder ?? options.primaryColor};
  }

  & .usecase-json-title,
  & .usecase-json-key,
  & .usecase-json-value {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
  }

  & .relationship {
    fill: none;
    stroke: ${options.lineColor};
  }

  & .relationship-include,
  & .relationship-extend,
  & .relationship-note {
    stroke-dasharray: 3;
  }

  /* Include and extend are both dashed, which is a weak distinction at small sizes. The
     tokens default to \`lineColor\`, so a theme that does not set them is unchanged. */
  & .relationship-include {
    stroke: ${role.includeLine};
  }

  & .relationship-extend {
    stroke: ${role.extendLine};
  }

  & .relationship.edge-animation-fast,
  & .relationship.edge-animation-slow {
    stroke-linecap: round;
  }

  & .edgeLabel,
  & .edgeLabel p {
    background-color: ${options.edgeLabelBackground};
  }

  & .labelBkg {
    background-color: ${options.edgeLabelBackground};
    padding: 0 2px;
  }

  & .edgeLabel .label rect {
    fill: ${options.edgeLabelBackground};
  }

  & .relationship-label,
  & .edgeLabel {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: 10px;
    font-weight: normal;
  }

  & .marker,
  & .marker.point,
  & .marker.circle,
  & .marker.cross {
    fill: ${options.lineColor};
    stroke: ${options.lineColor};
  }

  & .marker.extension {
    fill: ${options.mainBkg};
    stroke: ${options.lineColor};
  }
`;
};

export default getStyles;
