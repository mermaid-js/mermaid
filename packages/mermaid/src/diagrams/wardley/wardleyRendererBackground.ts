import type { WardleyThemeVars, WardleyArea } from './types.js';
import {
  DEFAULT_EVOLUTION_STAGES,
  DEFAULT_X_AXIS_LABEL,
  DEFAULT_Y_AXIS_LABEL,
  STAGE_BACKGROUND_STYLE,
  STAGE_LABEL_STYLE,
  AXIS_STYLE,
  AXIS_LABEL_STYLE,
} from './wardleyConfig.js';

/** Resolve area color from theme variables. */
const getAreaColor = (areaType: string, theme: WardleyThemeVars): string => {
  switch (areaType) {
    case 'pioneers':
      return theme.pioneersColor;
    case 'settlers':
      return theme.settlersColor;
    case 'townplanners':
      return theme.townplannersColor;
    case 'interest':
      return theme.interestColor;
    default:
      return theme.axisColor;
  }
};

/**
 * Draw the four evolution-stage background columns with labels beneath.
 */
export function drawEvolutionStages(
  g: any,
  plotWidth: number,
  plotHeight: number,
  theme: WardleyThemeVars,
  xAxisLabels: string[]
): void {
  const labels = xAxisLabels.length === 4 ? xAxisLabels : DEFAULT_EVOLUTION_STAGES;
  const fills = [
    theme.stageBackground0,
    theme.stageBackground1,
    theme.stageBackground2,
    theme.stageBackground3,
  ];
  const stageWidth = plotWidth / 4;

  for (let i = 0; i < 4; i++) {
    g.append('rect')
      .attr('x', i * stageWidth)
      .attr('y', 0)
      .attr('width', stageWidth)
      .attr('height', plotHeight)
      .attr('fill', fills[i])
      .attr('stroke', theme.axisColor)
      .attr('stroke-width', STAGE_BACKGROUND_STYLE.strokeWidth)
      .attr('opacity', STAGE_BACKGROUND_STYLE.opacity);

    g.append('text')
      .attr('x', i * stageWidth + stageWidth / 2)
      .attr('y', plotHeight - STAGE_LABEL_STYLE.offset)
      .attr('text-anchor', 'middle')
      .attr('font-size', STAGE_LABEL_STYLE.fontSize)
      .attr('font-weight', STAGE_LABEL_STYLE.fontWeight)
      .attr('fill', theme.axisColor)
      .text(labels[i]);
  }
}

/**
 * Draw the X and Y axis lines along the edges of the plot area.
 */
export function drawAxisLines(
  g: any,
  plotWidth: number,
  plotHeight: number,
  theme: WardleyThemeVars
): void {
  // Y axis (left edge, bottom to top)
  g.append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', plotHeight)
    .attr('stroke', theme.axisColor)
    .attr('stroke-width', AXIS_STYLE.strokeWidth);

  // X axis (bottom edge, left to right)
  g.append('line')
    .attr('x1', 0)
    .attr('y1', plotHeight)
    .attr('x2', plotWidth)
    .attr('y2', plotHeight)
    .attr('stroke', theme.axisColor)
    .attr('stroke-width', AXIS_STYLE.strokeWidth);
}

/**
 * Draw the axis title labels ("Visibility" on Y, "Evolution" on X).
 * These are placed outside the plot area relative to the full SVG.
 */
export function drawAxisLabels(
  svg: any,
  width: number,
  height: number,
  margins: { top: number; right: number; bottom: number; left: number },
  theme: WardleyThemeVars,
  yAxisLabels: string[]
): void {
  const yLabel = yAxisLabels.length > 0 ? yAxisLabels.join(' / ') : DEFAULT_Y_AXIS_LABEL;

  // Y-axis label (rotated -90°, placed left of plot)
  svg
    .append('text')
    .attr('x', -(margins.top + (height - margins.top - margins.bottom) / 2))
    .attr('y', AXIS_LABEL_STYLE.yAxisOffset)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .attr('font-size', AXIS_LABEL_STYLE.fontSize)
    .attr('font-weight', AXIS_LABEL_STYLE.fontWeight)
    .attr('fill', theme.axisColor)
    .text(yLabel);

  // X-axis label (centered below plot)
  svg
    .append('text')
    .attr('x', margins.left + (width - margins.left - margins.right) / 2)
    .attr('y', height + AXIS_LABEL_STYLE.xAxisOffset)
    .attr('text-anchor', 'middle')
    .attr('font-size', AXIS_LABEL_STYLE.fontSize)
    .attr('font-weight', AXIS_LABEL_STYLE.fontWeight)
    .attr('fill', theme.axisColor)
    .text(DEFAULT_X_AXIS_LABEL);
}

/**
 * Draw area overlays (pioneers, settlers, townplanners, interest).
 * Each area is rendered as a semi-transparent dashed rectangle with a label.
 */
export function drawAreas(
  g: any,
  areas: WardleyArea[],
  plotWidth: number,
  plotHeight: number,
  rescaleY: (y: number) => number,
  theme: WardleyThemeVars
): void {
  for (const area of areas) {
    const x = area.x1 * plotWidth;
    const y = rescaleY(area.y2);
    const w = (area.x2 - area.x1) * plotWidth;
    const h = rescaleY(area.y1) - rescaleY(area.y2);
    const color = getAreaColor(area.areaType, theme);

    g.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .attr('fill', color)
      .attr('fill-opacity', 0.08)
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '6,3')
      .attr('stroke-opacity', 0.4);

    if (area.label) {
      g.append('text')
        .attr('x', x + 4)
        .attr('y', y + 14)
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', color)
        .attr('fill-opacity', 0.7)
        .text(area.label);
    }
  }
}
