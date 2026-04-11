import type { Diagram } from '../../Diagram.js';
import type { DiagramRenderer, DrawDefinition, SVG } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { RenderContext } from './expression.js';
import type { LayoutBox, ResolveConfig } from './expression.js';
import { parseRules } from './parse-expression.js';
import type { RailroadDB } from './db.js';

// ---------------------------------------------------------------------------
// Rule rendering
// ---------------------------------------------------------------------------

/**
 * Render a single syntax rule (name + expression) into the given SVG group.
 *
 *   [● ——— expression ——— ●]
 *        |name label|
 *
 * Grid coordinates:
 *   - Rule group origin is at (x, y) pixels.
 *   - Expression starts at grid x=2 (2-unit start rail).
 *   - Terminal circles sit at x=0 and x = 2 + expr.width + 2.
 */
function renderRule(
  svg: SVG,
  name: string,
  expression: LayoutBox,
  originX: number,
  originY: number,
  config: ResolveConfig
): void {
  const { gridSize } = config;

  const ruleGroup = svg
    .append('g')
    .attr('class', 'rule-group')
    .attr('transform', `translate(${originX}, ${originY})`);

  const baseline = expression.baseline;
  const terminalRadius = gridSize * 0.75;

  const exprStartX = 2; // grid units
  const exprEndX = exprStartX + expression.width; // grid units
  const endTerminalX = exprEndX + 2; // grid units

  // Start terminal
  ruleGroup
    .append('circle')
    .attr('cx', 0)
    .attr('cy', baseline * gridSize)
    .attr('r', terminalRadius)
    .attr('class', 'start-terminal');

  // End terminal
  ruleGroup
    .append('circle')
    .attr('cx', endTerminalX * gridSize)
    .attr('cy', baseline * gridSize)
    .attr('r', terminalRadius)
    .attr('class', 'end-terminal');

  // Start rail: 2 units before expression
  const startRailCtx = new RenderContext(ruleGroup.append('g'), config);
  startRailCtx.trackBuilder.start(0, baseline, 'east').forward(2).finish();

  // End rail: 2 units after expression
  const endRailCtx = new RenderContext(ruleGroup.append('g'), config);
  endRailCtx.trackBuilder.start(exprEndX, baseline, 'east').forward(2).finish();

  // Rule name label (above the rule)
  ruleGroup.append('text').attr('x', 0).attr('y', -4).attr('class', 'rule-name').text(name);

  // Expression content
  const exprGroup = ruleGroup
    .append('g')
    .attr('transform', `translate(${exprStartX * gridSize}, 0)`);
  expression.render(new RenderContext(exprGroup, config));
}

// ---------------------------------------------------------------------------
// DrawDefinition
// ---------------------------------------------------------------------------

const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as RailroadDB;
  const dbConfig = db.getConfig();
  const config: ResolveConfig = {
    gridSize: dbConfig.gridSize,
    fontSize: dbConfig.fontSize,
    fontFamily: dbConfig.fontFamily,
  };
  const source = db.getSource();
  const svg: SVG = selectSvgElement(id);

  const rules = parseRules(source);

  if (rules.length === 0) {
    svg.attr('viewBox', '0 0 100 40');
    configureSvgSize(svg, 40, 100, dbConfig.useMaxWidth);
    svg.attr('height', 40);
    return;
  }

  const { gridSize } = config;
  const padding = gridSize; // 1 grid unit of padding around all rules
  const ruleGap = gridSize; // gap between consecutive rules

  let currentY = padding;
  let maxContentWidth = 0;

  for (const { name, expression } of rules) {
    const box = expression.resolve(config);
    const ruleWidth = (2 + box.width + 2) * gridSize;
    maxContentWidth = Math.max(maxContentWidth, ruleWidth);
    renderRule(svg, name, box, padding, currentY, config);
    currentY += box.height * gridSize + ruleGap;
  }

  const totalWidth = maxContentWidth + padding * 2;
  const totalHeight = currentY + padding;

  svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
  configureSvgSize(svg, totalHeight, totalWidth, dbConfig.useMaxWidth);
  // configureSvgSize omits the height attribute when useMaxWidth=true, causing
  // the SVG to collapse to zero height and overflow its container. Set it explicitly.
  svg.attr('height', totalHeight);
};

export const renderer: DiagramRenderer = { draw };
