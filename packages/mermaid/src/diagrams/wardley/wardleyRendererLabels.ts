import type { WardleyThemeVars, WardleyDB, WardleyNote, WardleyAnnotation } from './types.js';
import { LABEL_STYLE } from './wardleyConfig.js';
import { findBestLabelPosition, type LabelPosition } from './wardleyLabelLayout.js';

/**
 * Truncate a label string if it exceeds the configured maximum length.
 * Uses three dots (...) as the ellipsis suffix.
 */
const truncateLabel = (label: string): string => {
  if (label.length > LABEL_STYLE.truncationLength) {
    return label.substring(0, LABEL_STYLE.truncationChars) + '...';
  }
  return label;
};

/**
 * Clamp a label position so that the bounding box stays within the plot area.
 */
const clampPosition = (
  pos: LabelPosition,
  plotWidth: number,
  plotHeight: number
): { x: number; y: number } => {
  const halfW = pos.width / 2;
  const halfH = pos.height / 2;
  const x = Math.max(halfW, Math.min(plotWidth - halfW, pos.x));
  const y = Math.max(halfH, Math.min(plotHeight - halfH, pos.y));
  return { x, y };
};

/**
 * Position and draw a single component label, returning the placed LabelPosition
 * for collision tracking.
 */
const drawSingleLabel = (
  g: any,
  id: string,
  label: string,
  cx: number,
  cy: number,
  labelOffset: { dx: number; dy: number } | undefined,
  plotWidth: number,
  plotHeight: number,
  theme: WardleyThemeVars,
  componentRadius: number,
  positionedLabels: LabelPosition[]
): LabelPosition => {
  const labelWidth = Math.min(label.length * LABEL_STYLE.charWidth, LABEL_STYLE.maxWidth);
  const labelHeight = LABEL_STYLE.height;

  let labelX: number;
  let labelY: number;

  if (labelOffset) {
    labelX = cx + labelOffset.dx;
    labelY = cy + labelOffset.dy;
  } else {
    const best = findBestLabelPosition(
      cx,
      cy,
      componentRadius,
      labelWidth,
      labelHeight,
      positionedLabels,
      LABEL_STYLE.offsetAbove
    );
    const clamped = clampPosition(best, plotWidth, plotHeight);
    labelX = clamped.x;
    labelY = clamped.y;
  }

  const placed: LabelPosition = { x: labelX, y: labelY, width: labelWidth, height: labelHeight };

  // Background rect
  g.append('rect')
    .attr('x', labelX - labelWidth / 2)
    .attr('y', labelY - labelHeight / 2)
    .attr('width', labelWidth)
    .attr('height', labelHeight)
    .attr('fill', theme.labelBackground)
    .attr('stroke', theme.labelBorder)
    .attr('stroke-width', LABEL_STYLE.borderWidth)
    .attr('rx', LABEL_STYLE.borderRadius)
    .attr('opacity', LABEL_STYLE.backgroundOpacity)
    .attr('aria-hidden', 'true');

  // Label text
  g.append('text')
    .attr('x', labelX)
    .attr('y', labelY)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', LABEL_STYLE.fontSize)
    .attr('font-weight', LABEL_STYLE.fontWeight)
    .attr('fill', theme.textColor)
    .attr('pointer-events', 'none')
    .text(truncateLabel(label));

  // ARIA description
  g.append('desc')
    .attr('id', `component-${id}-desc`)
    .text(
      `${label} positioned at evolution ${Math.round((cx / plotWidth) * 100)}% and visibility ${Math.round((cy / plotHeight) * 100)}%`
    );

  return placed;
};

/**
 * Draw notes with dashed borders and italic text.
 */
const drawNotes = (
  g: any,
  notes: WardleyNote[],
  plotWidth: number,
  rescaleY: (y: number) => number,
  theme: WardleyThemeVars
): void => {
  for (const note of notes) {
    const nx = note.x * plotWidth;
    const ny = rescaleY(note.y);
    const padding = 4;
    const estWidth = Math.min(note.text.length * 5, 120);

    g.append('rect')
      .attr('x', nx - padding)
      .attr('y', ny - 12)
      .attr('width', estWidth + padding * 2)
      .attr('height', 18)
      .attr('fill', theme.labelBackground)
      .attr('stroke', theme.labelBorder)
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '3 2')
      .attr('rx', 2);

    g.append('text')
      .attr('x', nx)
      .attr('y', ny)
      .attr('font-size', '10px')
      .attr('font-style', 'italic')
      .attr('fill', theme.textColor)
      .text(note.text);
  }
};

/**
 * Draw annotations as circled numbers near target components with text.
 */
const drawAnnotations = (
  g: any,
  annotations: WardleyAnnotation[],
  db: WardleyDB,
  plotWidth: number,
  rescaleY: (y: number) => number,
  theme: WardleyThemeVars,
  componentRadius: number
): void => {
  for (const ann of annotations) {
    const target = db.getComponent(ann.targetId);
    if (!target) {
      continue;
    }

    const tx = target.x * plotWidth;
    const ty = rescaleY(target.y);
    const offset = componentRadius + 14;

    // Circled number
    g.append('circle')
      .attr('cx', tx + offset)
      .attr('cy', ty - offset)
      .attr('r', 8)
      .attr('fill', 'none')
      .attr('stroke', theme.evolveArrowColor)
      .attr('stroke-width', 1);

    g.append('text')
      .attr('x', tx + offset)
      .attr('y', ty - offset)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', theme.evolveArrowColor)
      .text(String(ann.number));

    // Annotation text
    g.append('text')
      .attr('x', tx + offset + 12)
      .attr('y', ty - offset)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '9px')
      .attr('fill', theme.textColor)
      .text(ann.text);
  }
};

/**
 * Render all component labels, notes, and annotations for a wardley map.
 */
export const drawLabels = (
  g: any,
  db: WardleyDB,
  plotWidth: number,
  plotHeight: number,
  rescaleY: (y: number) => number,
  theme: WardleyThemeVars,
  componentRadius: number
): void => {
  const positionedLabels: LabelPosition[] = [];

  // Component labels
  for (const comp of db.getComponents()) {
    const cx = comp.x * plotWidth;
    const cy = rescaleY(comp.y);
    const placed = drawSingleLabel(
      g,
      comp.id,
      comp.label,
      cx,
      cy,
      comp.labelOffset,
      plotWidth,
      plotHeight,
      theme,
      componentRadius,
      positionedLabels
    );
    positionedLabels.push(placed);
  }

  // Pipeline children labels
  for (const pipeline of db.getPipelines()) {
    for (const child of pipeline.children) {
      const cx = child.x * plotWidth;
      const cy = rescaleY(pipeline.y);
      const placed = drawSingleLabel(
        g,
        child.id,
        child.label,
        cx,
        cy,
        undefined,
        plotWidth,
        plotHeight,
        theme,
        componentRadius,
        positionedLabels
      );
      positionedLabels.push(placed);
    }
  }

  // Submap labels
  for (const submap of db.getSubmaps()) {
    const cx = submap.x * plotWidth;
    const cy = rescaleY(submap.y);
    const placed = drawSingleLabel(
      g,
      submap.id,
      submap.label,
      cx,
      cy,
      undefined,
      plotWidth,
      plotHeight,
      theme,
      componentRadius,
      positionedLabels
    );
    positionedLabels.push(placed);
  }

  // Notes and annotations
  drawNotes(g, db.getNotes(), plotWidth, rescaleY, theme);
  drawAnnotations(g, db.getAnnotations(), db, plotWidth, rescaleY, theme, componentRadius);
};
