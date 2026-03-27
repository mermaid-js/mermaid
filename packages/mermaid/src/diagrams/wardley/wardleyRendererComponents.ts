import type { WardleyThemeVars, WardleyDB } from './types.js';
import { getComponentColor } from './wardleyConfig.js';

// ── Sizing constants for sub-elements ──────────────────────────────
const ANCHOR_SIZE = 10;
const MARKET_OUTER_RADIUS = 14;
const ECOSYSTEM_OUTER_RADIUS = 14;
const ECOSYSTEM_OUTER2_RADIUS = 18;
const INERTIA_BAR_WIDTH = 24;
const INERTIA_BAR_HEIGHT = 4;
const BADGE_OFFSET = { dx: 10, dy: 12 };
const BADGE_FONT_SIZE = '8px';
const PIPELINE_HEIGHT = 20;
const PIPELINE_CHILD_RADIUS = 5;
const SUBMAP_WIDTH = 80;
const SUBMAP_HEIGHT = 50;
const SUBMAP_FOLD = 10;
const FUTURE_DASH_ARRAY = '4,3';
const FUTURE_OPACITY = 0.4;

// ── Helper: sourcing badge character ───────────────────────────────
const sourcingBadge = (sourcing: string): string => {
  switch (sourcing) {
    case 'build':
      return 'B';
    case 'buy':
      return '$';
    case 'outsource':
      return 'O';
    default:
      return '';
  }
};

/**
 * Draw all component types, pipelines, submaps, evolutions, and decorators
 * onto the given SVG group.
 */
export const drawComponents = (
  g: any,
  db: WardleyDB,
  plotWidth: number,
  plotHeight: number,
  rescaleY: (y: number) => number,
  theme: WardleyThemeVars,
  componentRadius: number
): void => {
  const components = db.getComponents();
  const pipelines = db.getPipelines();
  const submaps = db.getSubmaps();
  const evolutions = db.getEvolutions();

  // ── 1. Pipelines (rendered first so components sit on top) ───────
  const pipelineGroup = g.append('g').attr('class', 'wardley-pipelines');
  for (const pipe of pipelines) {
    const px1 = pipe.startX * plotWidth;
    const px2 = pipe.endX * plotWidth;
    const py = rescaleY(pipe.y);

    // Pipeline background rect
    pipelineGroup
      .append('rect')
      .attr('x', px1)
      .attr('y', py - PIPELINE_HEIGHT / 2)
      .attr('width', px2 - px1)
      .attr('height', PIPELINE_HEIGHT)
      .attr('rx', PIPELINE_HEIGHT / 2)
      .attr('ry', PIPELINE_HEIGHT / 2)
      .attr('fill', theme.pipelineFill)
      .attr('stroke', theme.componentStroke)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.7);

    // Pipeline children
    for (const child of pipe.children) {
      const cx = child.x * plotWidth;
      pipelineGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', py)
        .attr('r', PIPELINE_CHILD_RADIUS)
        .attr('fill', getComponentColor(child.x))
        .attr('stroke', theme.componentStroke)
        .attr('stroke-width', 0.6);

      pipelineGroup
        .append('text')
        .attr('x', cx)
        .attr('y', py - PIPELINE_CHILD_RADIUS - 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .attr('fill', theme.textColor)
        .text(child.label);
    }
  }

  // ── 2. Submaps ───────────────────────────────────────────────────
  const submapGroup = g.append('g').attr('class', 'wardley-submaps');
  for (const sm of submaps) {
    const sx = sm.x * plotWidth;
    const sy = rescaleY(sm.y);
    const halfW = SUBMAP_WIDTH / 2;
    const halfH = SUBMAP_HEIGHT / 2;

    // Main rectangle
    submapGroup
      .append('rect')
      .attr('x', sx - halfW)
      .attr('y', sy - halfH)
      .attr('width', SUBMAP_WIDTH)
      .attr('height', SUBMAP_HEIGHT)
      .attr('fill', theme.labelBackground)
      .attr('stroke', theme.componentStroke)
      .attr('stroke-width', 0.8)
      .attr('rx', 2)
      .attr('ry', 2);

    // Folded-corner triangle (top-right)
    const cornerX = sx + halfW;
    const cornerY = sy - halfH;
    const foldPoints = [
      `${cornerX - SUBMAP_FOLD},${cornerY}`,
      `${cornerX},${cornerY + SUBMAP_FOLD}`,
      `${cornerX},${cornerY}`,
    ].join(' ');

    submapGroup
      .append('polygon')
      .attr('points', foldPoints)
      .attr('fill', theme.labelBorder)
      .attr('stroke', theme.componentStroke)
      .attr('stroke-width', 0.5);

    // Label
    submapGroup
      .append('text')
      .attr('x', sx)
      .attr('y', sy + 3)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('fill', theme.textColor)
      .text(sm.label);
  }

  // ── 3. Future components (evolutions) ────────────────────────────
  const evolveGroup = g.append('g').attr('class', 'wardley-evolutions');
  for (const evo of evolutions) {
    const sourceComponent = db.getComponent(evo.sourceId);
    if (!sourceComponent) {
      continue;
    }

    const ex = evo.targetX * plotWidth;
    const ey = rescaleY(sourceComponent.y);

    evolveGroup
      .append('circle')
      .attr('cx', ex)
      .attr('cy', ey)
      .attr('r', componentRadius)
      .attr('fill', 'none')
      .attr('stroke', theme.evolveArrowColor)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', FUTURE_DASH_ARRAY)
      .attr('opacity', FUTURE_OPACITY);

    if (evo.targetLabel) {
      evolveGroup
        .append('text')
        .attr('x', ex)
        .attr('y', ey - componentRadius - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .attr('fill', theme.evolveArrowColor)
        .attr('opacity', FUTURE_OPACITY + 0.2)
        .text(evo.targetLabel);
    }
  }

  // ── 4. Components ────────────────────────────────────────────────
  const componentGroup = g.append('g').attr('class', 'wardley-components');

  for (const comp of components) {
    const cx = comp.x * plotWidth;
    const cy = rescaleY(comp.y);
    const fill = getComponentColor(comp.x);

    // -- Standard components (circle) --
    if (comp.type === 'standard') {
      componentGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', componentRadius)
        .attr('fill', fill)
        .attr('stroke', theme.componentStroke)
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.9)
        .attr('role', 'button')
        .attr('tabindex', 0)
        .attr('aria-label', `Component: ${comp.label}`);
    }

    // -- Anchor components (diamond / rotated square) --
    if (comp.type === 'anchor') {
      const size = ANCHOR_SIZE;
      componentGroup
        .append('rect')
        .attr('x', cx - size / 2)
        .attr('y', cy - size / 2)
        .attr('width', size)
        .attr('height', size)
        .attr('transform', `rotate(45,${cx},${cy})`)
        .attr('fill', fill)
        .attr('stroke', theme.componentStroke)
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.9)
        .attr('role', 'button')
        .attr('tabindex', 0)
        .attr('aria-label', `Anchor component: ${comp.label}`);
    }

    // -- Market components (double circle) --
    if (comp.type === 'market') {
      // Outer ring
      componentGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', MARKET_OUTER_RADIUS)
        .attr('fill', 'none')
        .attr('stroke', theme.componentStroke)
        .attr('stroke-width', 0.6)
        .attr('opacity', 0.7);

      // Inner filled circle
      componentGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', componentRadius)
        .attr('fill', fill)
        .attr('stroke', theme.componentStroke)
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.9)
        .attr('role', 'button')
        .attr('tabindex', 0)
        .attr('aria-label', `Market component: ${comp.label}`);
    }

    // -- Ecosystem components (triple circle) --
    if (comp.type === 'ecosystem') {
      // Outermost ring
      componentGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', ECOSYSTEM_OUTER2_RADIUS)
        .attr('fill', 'none')
        .attr('stroke', theme.componentStroke)
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.5);

      // Middle ring
      componentGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', ECOSYSTEM_OUTER_RADIUS)
        .attr('fill', 'none')
        .attr('stroke', theme.componentStroke)
        .attr('stroke-width', 0.6)
        .attr('opacity', 0.7);

      // Inner filled circle
      componentGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', componentRadius)
        .attr('fill', fill)
        .attr('stroke', theme.componentStroke)
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.9)
        .attr('role', 'button')
        .attr('tabindex', 0)
        .attr('aria-label', `Ecosystem component: ${comp.label}`);
    }

    // ── 5. Inertia indicator ───────────────────────────────────────
    if (comp.inertia) {
      componentGroup
        .append('rect')
        .attr('x', cx + componentRadius + 2)
        .attr('y', cy - INERTIA_BAR_HEIGHT / 2)
        .attr('width', INERTIA_BAR_WIDTH)
        .attr('height', INERTIA_BAR_HEIGHT)
        .attr('rx', 1)
        .attr('ry', 1)
        .attr('fill', theme.inertiaColor)
        .attr('opacity', 0.8);
    }

    // ── 6. Build / Buy / Outsource badge ───────────────────────────
    if (comp.sourcing) {
      const badge = sourcingBadge(comp.sourcing);
      if (badge) {
        componentGroup
          .append('text')
          .attr('x', cx + BADGE_OFFSET.dx)
          .attr('y', cy + BADGE_OFFSET.dy)
          .attr('text-anchor', 'middle')
          .attr('font-size', BADGE_FONT_SIZE)
          .attr('font-weight', 'bold')
          .attr('fill', theme.textColor)
          .text(badge);
      }
    }
  }
};
