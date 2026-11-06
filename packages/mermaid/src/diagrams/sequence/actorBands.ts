/**
 * The vertical band model for sequence participants under the `neo` look.
 *
 * Before this module, vertical geometry was the emergent output of each shape function: guess the
 * lifeline position from the incoming height, draw the glyph at hardcoded offsets, measure itself
 * with `getBBox()`, overwrite `actor.height` with the measurement plus a per-shape fudge
 * (`labelBoxHeight` once for `boundary` and `entity`, twice for `control`), then draw the label
 * with a mix of the old and new heights. The footer redrew with the corrupted heights and its own
 * separate offsets. Fixing any one shape moved another; three rounds of that preceded this file.
 *
 * The model instead states the layout once, and everything draws from it:
 *
 * ```
 * rowTop (actor.starty)
 *   [ air, when this actor's stack is shorter than the row's ]
 *   [ glyph band, GLYPH_BAND_HEIGHT tall, glyphs bottom-aligned ]
 *   GLYPH_LABEL_GAP
 *   [ label block, measured text height, bottom-anchored ]
 *   LABEL_LIFELINE_GAP
 * lifelineStart = rowTop + rowHeight        <- one datum line for the whole row
 * ...
 * lifelineEnd (actor.stopy)                 <- one datum line for the whole row
 *   LABEL_LIFELINE_GAP
 *   [ glyph band ]
 *   GLYPH_LABEL_GAP
 *   [ label block, top-anchored, growing downward ]
 * ```
 *
 * Everything is anchored at the datum lines: with one line of text -- the usual case -- every
 * outside-the-shape label sits on one baseline, and a multiline label grows away from the datum
 * (upward in the header, downward in the footer) instead of pushing the lifeline around. The box
 * shapes (`participant`, `queue`, `collections`) span the full row so their bottom edge sits on
 * the datum and their label stays centred in the box.
 *
 * The `classic` look does not use this module; its per-shape legacy values are pinned in
 * `lifelineStart.spec.ts` and must not move.
 */
import utils from '../../utils.js';

/** Height of the glyph band. The round icons set it: a 22 unit circle plus its underline. */
export const GLYPH_BAND_HEIGHT = 44;

/** Air between the bottom of the glyph and the top of the label block. */
export const GLYPH_LABEL_GAP = 6;

/** Air between the bottom of the label block and the lifeline datum. */
export const LABEL_LIFELINE_GAP = 6;

interface ActorLike {
  description: string;
  actorTextHeight?: number;
}

interface ActorFontConf {
  actorFontFamily?: string;
  actorFontSize?: string | number;
  actorFontWeight?: string | number;
}

/**
 * Measured height of the actor's label block. `calculateActorMargins` stashes the measurement it
 * already takes; the fallback keeps isolated `drawActor` calls (tests, external callers) working.
 */
export const actorLabelHeight = (actor: ActorLike, conf: ActorFontConf): number =>
  actor.actorTextHeight ??
  utils.calculateTextDimensions(actor.description ?? '', {
    fontFamily: conf.actorFontFamily,
    fontSize: conf.actorFontSize,
    fontWeight: conf.actorFontWeight,
  } as Parameters<typeof utils.calculateTextDimensions>[1]).height;

/** The stack an icon-family actor needs above the datum: glyph, gap, label, gap. */
export const actorStackHeight = (textHeight: number): number =>
  GLYPH_BAND_HEIGHT + GLYPH_LABEL_GAP + textHeight + LABEL_LIFELINE_GAP;

export interface HeaderBands {
  /** The datum: where this row's lifelines start. */
  lifelineStartY: number;
  /** Bottom edge of the glyph band; glyphs are drawn ending here. */
  glyphBottomY: number;
  /** Vertical centre of the label block. */
  labelCenterY: number;
}

export interface FooterBands {
  /** Top edge of the glyph band below the datum. */
  glyphTopY: number;
  /** Bottom edge of the glyph band. */
  glyphBottomY: number;
  /** Vertical centre of the label block. */
  labelCenterY: number;
  /** Total height the footer stack occupies below the datum. */
  stackHeight: number;
}

/**
 * Header geometry for one actor. `rowHeight` is the row's shared height (`conf.height` after
 * `calculateActorMargins`), which is what makes the datum one line rather than eight.
 */
export const headerBands = (actorY: number, rowHeight: number, textHeight: number): HeaderBands => {
  const lifelineStartY = actorY + rowHeight;
  const labelCenterY = lifelineStartY - LABEL_LIFELINE_GAP - textHeight / 2;
  return {
    lifelineStartY,
    glyphBottomY: lifelineStartY - LABEL_LIFELINE_GAP - textHeight - GLYPH_LABEL_GAP,
    labelCenterY,
  };
};

/** Footer geometry: the same stack, top-anchored at the datum, growing downward. */
export const footerBands = (actorY: number, textHeight: number): FooterBands => {
  const glyphTopY = actorY + LABEL_LIFELINE_GAP;
  const glyphBottomY = glyphTopY + GLYPH_BAND_HEIGHT;
  return {
    glyphTopY,
    glyphBottomY,
    labelCenterY: glyphBottomY + GLYPH_LABEL_GAP + textHeight / 2,
    stackHeight: actorStackHeight(textHeight),
  };
};
