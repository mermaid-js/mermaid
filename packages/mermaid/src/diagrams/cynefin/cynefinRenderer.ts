import type { Diagram } from '../../Diagram.js';
import type { DiagramRenderer, DrawDefinition, SVG } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { log } from '../../logger.js';
import { getConfig as getConfigAPI } from '../../config.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { cleanAndMerge } from '../../utils.js';
import type { CynefinDB, CynefinDomain, CynefinTransition, DomainName } from './types.js';
import {
  generateFoldPath,
  generateHorizontalBoundary,
  generateGradientBoundary,
  generateCliffPath,
  generateAporeticPath,
  resolveSeed,
} from './cynefinBoundaries.js';

interface DomainMeta {
  model: string;
  practice: string;
}

const DOMAIN_META: Record<DomainName, DomainMeta> = {
  complex: { model: 'Probe \u2192 Sense \u2192 Respond', practice: 'Emergent Practices' },
  complicated: { model: 'Sense \u2192 Analyse \u2192 Respond', practice: 'Good Practices' },
  clear: { model: 'Sense \u2192 Categorise \u2192 Respond', practice: 'Best Practices' },
  chaotic: { model: 'Act \u2192 Sense \u2192 Respond', practice: 'Novel Practices' },
  aporetic: { model: '', practice: '' },
};

interface DomainLayout {
  cx: number;
  cy: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

const getDomainLayouts = (width: number, height: number): Record<DomainName, DomainLayout> => {
  const hw = width / 2;
  const hh = height / 2;
  return {
    complex: { cx: hw / 2, cy: hh / 2, x: 0, y: 0, w: hw, h: hh },
    complicated: { cx: hw + hw / 2, cy: hh / 2, x: hw, y: 0, w: hw, h: hh },
    chaotic: { cx: hw / 2, cy: hh + hh / 2, x: 0, y: hh, w: hw, h: hh },
    clear: { cx: hw + hw / 2, cy: hh + hh / 2, x: hw, y: hh, w: hw, h: hh },
    aporetic: { cx: hw, cy: hh, x: hw * 0.7, y: hh * 0.7, w: hw * 0.6, h: hh * 0.6 },
  };
};

interface CynefinDomainColors {
  complexBg: string;
  complicatedBg: string;
  chaoticBg: string;
  clearBg: string;
  aporeticBg: string;
}

/** Resolve only the domain background colors from the cynefin theme block. */
const getCynefinDomainColors = (): CynefinDomainColors => {
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = getConfigAPI();
  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);
  return themeVariables.cynefin as CynefinDomainColors;
};

/** Maximum items rendered inside the aporetic ellipse before overflow badge is shown. */
const MAX_APORETIC_ITEMS = 3;

const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as CynefinDB;
  const domains = db.getDomains();
  const transitions = db.getTransitions();
  const title = db.getDiagramTitle();
  const accTitle = db.getAccTitle();
  const accDescription = db.getAccDescription();
  const config = db.getConfig();
  const domainColors = getCynefinDomainColors();

  log.debug('Rendering Cynefin diagram');

  const width = config.width;
  const height = config.height;
  const padding = config.padding;
  const showDomainDescriptions = config.showDomainDescriptions;
  const boundaryAmplitude = config.boundaryAmplitude;
  const showFlow = config.showFlow;
  const totalWidth = width + padding * 2;
  const totalHeight = height + padding * 2;

  const domainBg: Record<DomainName, string> = {
    complex: domainColors.complexBg,
    complicated: domainColors.complicatedBg,
    clear: domainColors.clearBg,
    chaotic: domainColors.chaoticBg,
    aporetic: domainColors.aporeticBg,
  };

  const svg: SVG = selectSvgElement(id);

  configureSvgSize(svg, totalHeight, totalWidth, config.useMaxWidth ?? true);
  svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

  // Accessibility: use <title> element (W3C recommendation for SVG)
  if (accTitle) {
    svg.append('title').text(accTitle);
  }
  if (accDescription) {
    svg.append('desc').text(accDescription);
  }

  const root = svg.append('g').attr('transform', `translate(${padding}, ${padding})`);

  const layouts = getDomainLayouts(width, height);
  const seed = resolveSeed(config.seed, id);

  // 1. Domain background rectangles
  const bgGroup = root.append('g').attr('class', 'cynefin-backgrounds');
  const quadrantDomains: DomainName[] = ['complex', 'complicated', 'chaotic', 'clear'];
  for (const domainName of quadrantDomains) {
    const layout = layouts[domainName];
    bgGroup
      .append('rect')
      .attr('class', 'cynefinDomain')
      .attr('x', layout.x)
      .attr('y', layout.y)
      .attr('width', layout.w)
      .attr('height', layout.h)
      .attr('fill', domainBg[domainName])
      .attr('fill-opacity', 0.4)
      .attr('stroke', 'none');
  }

  // 2. Wavy boundaries — stroke handled by .cynefinBoundary CSS class
  const boundaryGroup = root.append('g').attr('class', 'cynefin-boundaries');

  boundaryGroup
    .append('path')
    .attr('class', 'cynefinBoundary')
    .attr('d', generateFoldPath(width, height, seed, boundaryAmplitude))
    .attr('fill', 'none');

  // Horizontal boundary splits into two halves with different meanings:
  // - left half (Complex/Chaotic) is a genuine phase shift → wavy
  // - right half (Clear/Complicated) is a gradient, not a phase shift → straight
  boundaryGroup
    .append('path')
    .attr('class', 'cynefinBoundary')
    .attr(
      'd',
      generateHorizontalBoundary(width, height, seed + 100, boundaryAmplitude, 0, width / 2)
    )
    .attr('fill', 'none');

  boundaryGroup
    .append('path')
    .attr('class', 'cynefinGradientBoundary')
    .attr('d', generateGradientBoundary(width / 2, width, height / 2))
    .attr('fill', 'none');

  // 3. The cliff (thicker, between Clear and Chaotic) — stroke handled by .cynefinCliff CSS class
  boundaryGroup
    .append('path')
    .attr('class', 'cynefinCliff')
    .attr('d', generateCliffPath(width, height))
    .attr('fill', 'none');

  // 4. Aporetic ellipse (center overlay) — stroke handled by .cynefinAporetic CSS class
  // Using width*0.15 and height*0.15 gives enough room for up to ~3 item badges
  const aporeticRx = width * 0.15;
  const aporeticRy = height * 0.15;
  root
    .append('path')
    .attr('class', 'cynefinAporetic')
    .attr('d', generateAporeticPath(width / 2, height / 2, aporeticRx, aporeticRy))
    .attr('fill', domainBg.aporetic)
    .attr('fill-opacity', 0.5);

  // 4b. Flow arrows radiating outward from the Aporetic centre to each domain.
  // In Cynefin, flow moves outward from the not-yet-known centre, not in from a side.
  if (showFlow) {
    const flowDefs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
    const flowMarkerId = `cynefin-flow-${id}`;
    flowDefs
      .append('marker')
      .attr('id', flowMarkerId)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('class', 'cynefinFlowHead');

    const flowGroup = root.append('g').attr('class', 'cynefin-flow');
    const cx = width / 2;
    const cy = height / 2;
    for (const domainName of quadrantDomains) {
      const target = layouts[domainName];
      const dx = target.cx - cx;
      const dy = target.cy - cy;
      const len = Math.sqrt(dx * dx + dy * dy);
      // Start at the Aporetic ellipse edge, end partway toward the quadrant centre.
      const startX = cx + (dx / len) * aporeticRx;
      const startY = cy + (dy / len) * aporeticRy;
      const endX = cx + dx * 0.7;
      const endY = cy + dy * 0.7;
      flowGroup
        .append('path')
        .attr('class', 'cynefinFlowLine')
        .attr('d', `M${startX},${startY} L${endX},${endY}`)
        .attr('fill', 'none')
        .attr('marker-end', `url(#${flowMarkerId})`);
    }
  }

  // 5. Domain name labels — text styling handled by .cynefinDomainLabel CSS class
  const labelGroup = root.append('g').attr('class', 'cynefin-labels');
  for (const domainName of quadrantDomains) {
    const layout = layouts[domainName];
    labelGroup
      .append('text')
      .attr('class', 'cynefinDomainLabel')
      .attr('x', layout.cx)
      .attr('y', showDomainDescriptions ? layout.cy - 30 : layout.cy)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(domainName.charAt(0).toUpperCase() + domainName.slice(1));
  }

  // Aporetic label
  labelGroup
    .append('text')
    .attr('class', 'cynefinDomainLabel')
    .attr('x', width / 2)
    .attr('y', showDomainDescriptions ? height / 2 - 10 : height / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .text('Aporetic');

  // 6. Domain description subtitles — text styling handled by .cynefinSubtitle CSS class
  if (showDomainDescriptions) {
    const subtitleGroup = root.append('g').attr('class', 'cynefin-subtitles');
    for (const domainName of quadrantDomains) {
      const layout = layouts[domainName];
      const meta = DOMAIN_META[domainName];

      subtitleGroup
        .append('text')
        .attr('class', 'cynefinSubtitle')
        .attr('x', layout.cx)
        .attr('y', layout.cy - 10)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text(meta.model);

      subtitleGroup
        .append('text')
        .attr('class', 'cynefinSubtitle')
        .attr('x', layout.cx)
        .attr('y', layout.cy + 5)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text(meta.practice);
    }
    // The Aporetic centre has no decision model or practice subtitle — it is the
    // state of not-yet-knowing which domain applies, so only its label is shown.
  }

  // 7. Items as text badges within each domain
  const itemGroup = root.append('g').attr('class', 'cynefin-items');
  const itemHeight = 26;
  const itemPaddingX = 10;

  const allDomains: DomainName[] = ['complex', 'complicated', 'chaotic', 'clear', 'aporetic'];
  for (const domainName of allDomains) {
    const domain: CynefinDomain | undefined = domains.get(domainName);
    if (!domain || domain.items.length === 0) {
      continue;
    }

    const layout = layouts[domainName];
    const isAporetic = domainName === 'aporetic';

    // For aporetic: cap items and center the block around the ellipse center.
    // For quadrant domains: start below the label/subtitle area.
    let itemsToRender = domain.items;
    let overflowCount = 0;
    if (isAporetic && domain.items.length > MAX_APORETIC_ITEMS) {
      overflowCount = domain.items.length - MAX_APORETIC_ITEMS;
      itemsToRender = domain.items.slice(0, MAX_APORETIC_ITEMS);
    }

    let startY: number;
    if (isAporetic) {
      // Center the item block below the label within the ellipse
      const labelOffset = showDomainDescriptions ? 22 : 14;
      startY = layout.cy + labelOffset;
    } else {
      startY = layout.cy + (showDomainDescriptions ? 25 : 15);
    }

    // Render item badges using getBBox() for accurate width measurement
    [...itemsToRender].forEach((item, idx) => {
      const itemY = startY + idx * (itemHeight + 4);
      const g = itemGroup.append('g');

      // Append text first to measure actual rendered width
      const textEl = g
        .append('text')
        .attr('class', 'cynefinItemText')
        .attr('x', 0)
        .attr('y', itemHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text(item.label);

      // Measure rendered text width; fall back to character-count heuristic if unavailable
      let measuredWidth = item.label.length * 7;
      const textNode = textEl.node();
      if (textNode && typeof textNode.getBBox === 'function') {
        const bbox = textNode.getBBox();
        if (bbox.width > 0) {
          measuredWidth = bbox.width;
        }
      }

      const badgeWidth = measuredWidth + itemPaddingX * 2;
      const itemX = layout.cx - badgeWidth / 2;

      g.attr('transform', `translate(${itemX}, ${itemY})`);

      // Insert rect behind the text, sized to measured badge width
      g.insert('rect', 'text')
        .attr('class', 'cynefinItem')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', badgeWidth)
        .attr('height', itemHeight)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', domainBg[domainName])
        .attr('fill-opacity', 0.95);

      // Centre text within badge
      textEl.attr('x', badgeWidth / 2).attr('y', itemHeight / 2);
    });

    // Overflow badge: "+N more" when aporetic has more items than MAX_APORETIC_ITEMS
    if (overflowCount > 0) {
      const overflowY = startY + itemsToRender.length * (itemHeight + 4);
      const overflowLabel = `+${overflowCount} more`;
      const g = itemGroup.append('g');

      const textEl = g
        .append('text')
        .attr('class', 'cynefinItemText')
        .attr('x', 0)
        .attr('y', itemHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text(overflowLabel);

      let measuredWidth = overflowLabel.length * 7;
      const textNode = textEl.node();
      if (textNode && typeof textNode.getBBox === 'function') {
        const bbox = textNode.getBBox();
        if (bbox.width > 0) {
          measuredWidth = bbox.width;
        }
      }

      const badgeWidth = measuredWidth + itemPaddingX * 2;
      const itemX = layout.cx - badgeWidth / 2;

      g.attr('transform', `translate(${itemX}, ${overflowY})`);

      g.insert('rect', 'text')
        .attr('class', 'cynefinItemOverflow')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', badgeWidth)
        .attr('height', itemHeight)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', domainBg[domainName])
        .attr('fill-opacity', 0.6);

      textEl.attr('x', badgeWidth / 2).attr('y', itemHeight / 2);
    }
  }

  // 8. Transition arrows between domain centers
  if (transitions.length > 0) {
    const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
    const markerId = `cynefin-arrow-${id}`;

    defs
      .append('marker')
      .attr('id', markerId)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('class', 'cynefinArrowHead');

    const arrowGroup = root.append('g').attr('class', 'cynefin-arrows');

    transitions.forEach((transition: CynefinTransition) => {
      const fromLayout = layouts[transition.from];
      const toLayout = layouts[transition.to];
      if (!fromLayout || !toLayout) {
        return;
      }

      // Self-loops are filtered at the DB level; guard here handles any edge case
      if (transition.from === transition.to) {
        log.warn(`Cynefin renderer: skipping self-loop on domain "${transition.from}"`);
        return;
      }

      // All math in root-local (unpadded) coordinates to match the <g> transform.
      const x1 = fromLayout.cx;
      const y1 = fromLayout.cy;
      const x2 = toLayout.cx;
      const y2 = toLayout.cy;

      // Quadratic bezier with perpendicular offset
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const offsetAmount = len * 0.15;
      const nx = -dy / len;
      const ny = dx / len;
      const cpx = mx + nx * offsetAmount;
      const cpy = my + ny * offsetAmount;

      arrowGroup
        .append('path')
        .attr('class', 'cynefinArrowLine')
        .attr('d', `M${x1},${y1} Q${cpx},${cpy} ${x2},${y2}`)
        .attr('fill', 'none')
        .attr('marker-end', `url(#${markerId})`);

      // Optional label — text styling handled by .cynefinArrowLabel CSS class
      if (transition.label) {
        arrowGroup
          .append('text')
          .attr('class', 'cynefinArrowLabel')
          .attr('x', cpx)
          .attr('y', cpy - 6)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'auto')
          .text(transition.label);
      }
    });
  }

  // Title — text styling handled by .cynefinTitle CSS class
  if (title) {
    root
      .append('text')
      .attr('class', 'cynefinTitle')
      .attr('x', width / 2)
      .attr('y', -padding / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(title);
  }
};

export const renderer: DiagramRenderer = { draw };
