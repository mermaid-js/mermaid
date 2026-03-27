import type { Diagram } from '../../Diagram.js';
import type { DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import utils from '../../utils.js';
import { CSS_DIAGRAM } from './wardleyCommon.js';
import type { WardleyDB, WardleyComponent, WardleyThemeVars } from './types.js';
import { getWardleyConfig, getWardleyThemeVars, CANVAS_SIZING } from './wardleyConfig.js';
import { defineMarkers } from './wardleyRendererMarkers.js';
import {
  drawEvolutionStages,
  drawAxisLines,
  drawAxisLabels,
  drawAreas,
} from './wardleyRendererBackground.js';
import { drawComponents } from './wardleyRendererComponents.js';
import { drawEdges } from './wardleyRendererEdges.js';
import { drawLabels } from './wardleyRendererLabels.js';

// ── Layout calculations ──────────────────────────────────────────────

interface ContentBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface CanvasDimensions {
  width: number;
  height: number;
  plotWidth: number;
  plotHeight: number;
  visibilitySpan: number;
}

const calculateBounds = (components: WardleyComponent[]): ContentBounds => {
  let minY = 1.0;
  let maxY = 0.0;
  let minX = 1.0;
  let maxX = 0.0;

  for (const c of components) {
    minY = Math.min(minY, c.y);
    maxY = Math.max(maxY, c.y);
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
  }

  return { minX, maxX, minY, maxY };
};

const calculateDimensions = (
  bounds: ContentBounds,
  margins: { top: number; right: number; bottom: number; left: number }
): CanvasDimensions => {
  const visibilitySpan = bounds.maxY - bounds.minY;
  const horizontalSpan = bounds.maxX - bounds.minX;

  const effectiveSpan = visibilitySpan + CANVAS_SIZING.verticalSpacing;
  const plotHeight = Math.max(
    CANVAS_SIZING.minHeight,
    effectiveSpan * CANVAS_SIZING.verticalMultiplier
  );
  const plotWidth = Math.max(
    CANVAS_SIZING.minWidth,
    horizontalSpan * CANVAS_SIZING.horizontalMultiplier
  );

  const width = plotWidth + margins.left + margins.right;
  const height = Math.round(margins.top + plotHeight + margins.bottom);

  return { width, height, plotWidth, plotHeight, visibilitySpan };
};

const createRescaleY = (
  bounds: ContentBounds,
  plotHeight: number,
  visibilitySpan: number
): ((y: number) => number) => {
  const effectiveSpan = visibilitySpan + CANVAS_SIZING.verticalSpacing;

  return (y: number): number => {
    if (visibilitySpan === 0) {
      return plotHeight / 2;
    }
    const contentFraction = visibilitySpan / effectiveSpan;
    const paddingFraction = CANVAS_SIZING.verticalSpacing / effectiveSpan;
    const topPadding = (paddingFraction / 2) * plotHeight;
    const contentHeight = contentFraction * plotHeight;
    const normalized = (y - bounds.minY) / visibilitySpan;
    return topPadding + contentHeight - normalized * contentHeight;
  };
};

// ── SVG setup ────────────────────────────────────────────────────────

const createSvg = (
  id: string,
  width: number,
  height: number,
  margins: { top: number; left: number },
  title: string,
  theme: WardleyThemeVars
): { svg: any; g: any } => {
  const svg = selectSvgElement(id);

  svg
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('role', 'img')
    .attr('aria-label', title)
    .attr('aria-describedby', `${id}-description`);

  svg
    .append('desc')
    .attr('id', `${id}-description`)
    .text('Wardley Map showing component evolution and value chain positioning');

  // Background — uses theme color, not hardcoded #fff
  svg
    .append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', theme.backgroundColor)
    .attr('class', CSS_DIAGRAM)
    .attr('aria-hidden', 'true');

  const g = svg
    .append('g')
    .attr('transform', `translate(${margins.left},${margins.top})`)
    .attr('role', 'group')
    .attr('aria-label', 'Wardley Map Canvas');

  return { svg, g };
};

// ── Main draw ────────────────────────────────────────────────────────

export const draw: DrawDefinition = (
  txt: string,
  id: string,
  _version: string,
  diagObj: Diagram
) => {
  log.info('Drawing Wardley map', id);

  const db = diagObj.db as unknown as WardleyDB;
  const config = getWardleyConfig();
  const theme = getWardleyThemeVars();

  const components = db.getComponents();
  const diagramTitle = db.getDiagramTitle() || 'Wardley Map';

  const margins = {
    top: config.marginTop,
    right: config.marginRight,
    bottom: config.marginBottom,
    left: config.marginLeft,
  };
  const componentRadius = config.componentRadius;

  // Calculate layout
  const bounds = calculateBounds(components);
  const dimensions = calculateDimensions(bounds, margins);
  const rescaleY = createRescaleY(bounds, dimensions.plotHeight, dimensions.visibilitySpan);

  // Create SVG
  const { svg, g } = createSvg(
    id,
    dimensions.width,
    dimensions.height,
    margins,
    diagramTitle,
    theme
  );

  // Markers (scoped to diagram ID)
  defineMarkers(svg, id, theme);

  // Background: stages, axes, areas
  drawEvolutionStages(g, dimensions.plotWidth, dimensions.plotHeight, theme, db.getXAxisLabels());
  drawAxisLines(g, dimensions.plotWidth, dimensions.plotHeight, theme);
  drawAxisLabels(svg, dimensions.width, dimensions.height, margins, theme, db.getYAxisLabels());
  drawAreas(g, db.getAreas(), dimensions.plotWidth, dimensions.plotHeight, rescaleY, theme);

  // Edges (drawn first so they appear behind components)
  drawEdges(g, db, dimensions.plotWidth, rescaleY, id, theme);

  // Components
  drawComponents(
    g,
    db,
    dimensions.plotWidth,
    dimensions.plotHeight,
    rescaleY,
    theme,
    componentRadius
  );

  // Labels, notes, annotations
  drawLabels(g, db, dimensions.plotWidth, dimensions.plotHeight, rescaleY, theme, componentRadius);

  // Title and viewport
  utils.insertTitle(svg, 'wardleyTitle', 20, db.getDiagramTitle());
  svg.attr('width', '100%');
  svg.style('max-width', '100%');
  svg.style('height', 'auto');
};

export const renderer = {
  draw,
};
