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
  generateCliffPath,
  generateConfusionPath,
  hashString,
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
  confusion: { model: '', practice: 'Disorder' },
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
    confusion: { cx: hw, cy: hh, x: hw * 0.7, y: hh * 0.7, w: hw * 0.6, h: hh * 0.6 },
  };
};

/** Resolve cynefin theme variables from the mermaid theme system. */
const getCynefinTheme = () => {
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = getConfigAPI();
  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (themeVariables as any).cynefin as {
    domainFontSize: number;
    itemFontSize: number;
    boundaryColor: string;
    boundaryWidth: number;
    cliffColor: string;
    cliffWidth: number;
    arrowColor: string;
    arrowWidth: number;
    complexBg: string;
    complicatedBg: string;
    chaoticBg: string;
    clearBg: string;
    confusionBg: string;
    textColor: string;
    labelColor: string;
  };
};

const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as CynefinDB;
  const domains = db.getDomains();
  const transitions = db.getTransitions();
  const title = db.getDiagramTitle();
  const accTitle = db.getAccTitle();
  const accDescription = db.getAccDescription();
  const config = db.getConfig();
  const theme = getCynefinTheme();

  log.debug('Rendering Cynefin diagram');

  const width = config.width;
  const height = config.height;
  const padding = config.padding;
  const showDomainDescriptions = config.showDomainDescriptions;
  const boundaryAmplitude = config.boundaryAmplitude;
  const totalWidth = width + padding * 2;
  const totalHeight = height + padding * 2;

  const domainBg: Record<DomainName, string> = {
    complex: theme.complexBg,
    complicated: theme.complicatedBg,
    clear: theme.clearBg,
    chaotic: theme.chaoticBg,
    confusion: theme.confusionBg,
  };

  const svg: SVG = selectSvgElement(id);

  configureSvgSize(svg, totalHeight, totalWidth, true);
  svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

  // Accessibility
  if (accTitle) {
    svg.attr('aria-label', accTitle);
  }
  if (accDescription) {
    svg.append('desc').text(accDescription);
  }

  const root = svg.append('g').attr('transform', `translate(${padding}, ${padding})`);

  const layouts = getDomainLayouts(width, height);
  const seed = hashString(id);

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

  // 2. Wavy boundaries
  const boundaryGroup = root.append('g').attr('class', 'cynefin-boundaries');

  // Vertical fold
  boundaryGroup
    .append('path')
    .attr('class', 'cynefinBoundary')
    .attr('d', generateFoldPath(width, height, seed, boundaryAmplitude))
    .attr('fill', 'none')
    .attr('stroke', theme.boundaryColor)
    .attr('stroke-width', theme.boundaryWidth);

  // Horizontal boundary
  boundaryGroup
    .append('path')
    .attr('class', 'cynefinBoundary')
    .attr('d', generateHorizontalBoundary(width, height, seed + 100, boundaryAmplitude))
    .attr('fill', 'none')
    .attr('stroke', theme.boundaryColor)
    .attr('stroke-width', theme.boundaryWidth);

  // 3. The cliff (thicker, between Clear and Chaotic at bottom-center)
  boundaryGroup
    .append('path')
    .attr('class', 'cynefinCliff')
    .attr('d', generateCliffPath(width, height))
    .attr('fill', 'none')
    .attr('stroke', theme.cliffColor)
    .attr('stroke-width', theme.cliffWidth);

  // 4. Confusion ellipse (center overlay)
  const confusionRx = width * 0.1;
  const confusionRy = height * 0.1;
  root
    .append('path')
    .attr('class', 'cynefinConfusion')
    .attr('d', generateConfusionPath(width / 2, height / 2, confusionRx, confusionRy))
    .attr('fill', domainBg.confusion)
    .attr('fill-opacity', 0.5)
    .attr('stroke', theme.boundaryColor)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '4 2');

  // 5. Domain name labels
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
      .attr('font-size', theme.domainFontSize)
      .attr('font-weight', 'bold')
      .attr('fill', theme.labelColor)
      .text(domainName.charAt(0).toUpperCase() + domainName.slice(1));
  }

  // Confusion label
  labelGroup
    .append('text')
    .attr('class', 'cynefinDomainLabel')
    .attr('x', width / 2)
    .attr('y', showDomainDescriptions ? height / 2 - 10 : height / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', theme.domainFontSize)
    .attr('font-weight', 'bold')
    .attr('fill', theme.labelColor)
    .text('Confusion');

  // 6. Domain description subtitles (decision model + practice type)
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
        .attr('font-size', theme.itemFontSize - 1)
        .attr('font-style', 'italic')
        .attr('fill', theme.textColor)
        .text(meta.model);

      subtitleGroup
        .append('text')
        .attr('class', 'cynefinSubtitle')
        .attr('x', layout.cx)
        .attr('y', layout.cy + 5)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', theme.itemFontSize - 1)
        .attr('font-style', 'italic')
        .attr('fill', theme.textColor)
        .text(meta.practice);
    }

    // Confusion subtitle
    subtitleGroup
      .append('text')
      .attr('class', 'cynefinSubtitle')
      .attr('x', width / 2)
      .attr('y', height / 2 + 8)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', theme.itemFontSize - 1)
      .attr('font-style', 'italic')
      .attr('fill', theme.textColor)
      .text(DOMAIN_META.confusion.practice);
  }

  // 7. Items as text badges within each domain
  const itemGroup = root.append('g').attr('class', 'cynefin-items');
  const itemHeight = 26;
  const itemPaddingX = 10;

  const allDomains: DomainName[] = ['complex', 'complicated', 'chaotic', 'clear', 'confusion'];
  for (const domainName of allDomains) {
    const domain: CynefinDomain | undefined = domains.get(domainName);
    if (!domain || domain.items.length === 0) {
      continue;
    }

    const layout = layouts[domainName];
    const startY = layout.cy + (showDomainDescriptions ? 25 : 15);

    domain.items.forEach((item, idx) => {
      const itemY = startY + idx * (itemHeight + 4);
      const textLen = item.label.length * 7 + itemPaddingX * 2;
      const itemX = layout.cx - textLen / 2;

      const g = itemGroup.append('g').attr('transform', `translate(${itemX}, ${itemY})`);

      g.append('rect')
        .attr('class', 'cynefinItem')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', textLen)
        .attr('height', itemHeight)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', domainBg[domainName])
        .attr('stroke', theme.boundaryColor)
        .attr('stroke-width', 1)
        .attr('fill-opacity', 0.95);

      g.append('text')
        .attr('x', textLen / 2)
        .attr('y', itemHeight / 2)
        .attr('fill', theme.textColor)
        .attr('font-size', theme.itemFontSize)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text(item.label);
    });
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
      .attr('class', 'cynefinArrowHead')
      .attr('fill', theme.arrowColor);

    const arrowGroup = root.append('g').attr('class', 'cynefin-arrows');

    transitions.forEach((transition: CynefinTransition) => {
      const fromLayout = layouts[transition.from];
      const toLayout = layouts[transition.to];
      if (!fromLayout || !toLayout) {
        return;
      }

      const x1 = fromLayout.cx + padding;
      const y1 = fromLayout.cy + padding;
      const x2 = toLayout.cx + padding;
      const y2 = toLayout.cy + padding;

      // Quadratic bezier with perpendicular offset
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const offsetAmount = len * 0.15;
      // Perpendicular offset
      const nx = -dy / len;
      const ny = dx / len;
      const cpx = mx + nx * offsetAmount - padding;
      const cpy = my + ny * offsetAmount - padding;

      arrowGroup
        .append('path')
        .attr('class', 'cynefinArrowLine')
        .attr(
          'd',
          `M${fromLayout.cx},${fromLayout.cy} Q${cpx},${cpy} ${toLayout.cx},${toLayout.cy}`
        )
        .attr('fill', 'none')
        .attr('stroke', theme.arrowColor)
        .attr('stroke-width', theme.arrowWidth)
        .attr('marker-end', `url(#${markerId})`);

      // Optional label
      if (transition.label) {
        arrowGroup
          .append('text')
          .attr('class', 'cynefinArrowLabel')
          .attr('x', cpx)
          .attr('y', cpy - 6)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'auto')
          .attr('font-size', theme.itemFontSize - 1)
          .attr('fill', theme.textColor)
          .text(transition.label);
      }
    });
  }

  // Title
  if (title) {
    root
      .append('text')
      .attr('class', 'cynefinTitle')
      .attr('x', width / 2)
      .attr('y', -padding / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', theme.domainFontSize + 2)
      .attr('font-weight', 'bold')
      .attr('fill', theme.labelColor)
      .text(title);
  }
};

export const renderer: DiagramRenderer = { draw };
