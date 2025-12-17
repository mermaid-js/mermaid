import type { DrawDefinition } from '../../diagram-api/types.js';
import type { ASTNode, RailroadRule, RenderResult } from './railroadTypes.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { db } from './railroadDb.js';
import { DEFAULT_RAILROAD_CONFIG } from './railroadTypes.js';

/**
 * SVG Path builder utility
 */
class PathBuilder {
  private d = '';

  moveTo(x: number, y: number): this {
    this.d += `M ${x} ${y} `;
    return this;
  }

  lineTo(x: number, y: number): this {
    this.d += `L ${x} ${y} `;
    return this;
  }

  horizontalTo(x: number): this {
    this.d += `H ${x} `;
    return this;
  }

  verticalTo(y: number): this {
    this.d += `V ${y} `;
    return this;
  }

  arcTo(
    rx: number,
    ry: number,
    rotation: number,
    largeArc: boolean,
    sweep: boolean,
    x: number,
    y: number
  ): this {
    this.d += `A ${rx} ${ry} ${rotation} ${largeArc ? 1 : 0} ${sweep ? 1 : 0} ${x} ${y} `;
    return this;
  }

  build(): string {
    return this.d.trim();
  }
}

/**
 * Railroad diagram renderer
 */
class RailroadRenderer {
  private svg: any;
  private config = DEFAULT_RAILROAD_CONFIG;
  private textCache = new Map<string, { width: number; height: number }>();

  constructor(svg: any) {
    this.svg = svg;
  }

  /**
   * Measure text dimensions
   */
  private measureText(text: string): { width: number; height: number } {
    if (this.textCache.has(text)) {
      return this.textCache.get(text)!;
    }

    // Create temporary text element to measure
    const tempText = this.svg
      .append('text')
      .attr('font-family', this.config.fontFamily)
      .attr('font-size', this.config.fontSize)
      .text(text);

    const bbox = tempText.node().getBBox();
    const dimensions = { width: bbox.width, height: bbox.height };

    tempText.remove();
    this.textCache.set(text, dimensions);

    return dimensions;
  }

  /**
   * Render terminal symbol (rounded rectangle)
   */
  private renderTerminal(value: string): RenderResult {
    const textDim = this.measureText(value);
    const width = textDim.width + this.config.padding * 2;
    const height = textDim.height + this.config.padding * 2;

    const group = this.svg.append('g').attr('class', 'railroad-terminal');

    // Rounded rectangle
    group
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 10)
      .attr('ry', 10);

    // Text
    group
      .append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .text(value);

    return {
      element: group.node(),
      dimensions: {
        width,
        height,
        up: height / 2,
        down: height / 2,
      },
    };
  }

  /**
   * Render non-terminal symbol (rectangle)
   */
  private renderNonTerminal(name: string): RenderResult {
    const textDim = this.measureText(name);
    const width = textDim.width + this.config.padding * 2;
    const height = textDim.height + this.config.padding * 2;

    const group = this.svg.append('g').attr('class', 'railroad-nonterminal');

    // Rectangle
    group.append('rect').attr('x', 0).attr('y', 0).attr('width', width).attr('height', height);

    // Text
    group
      .append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .text(name);

    return {
      element: group.node(),
      dimensions: {
        width,
        height,
        up: height / 2,
        down: height / 2,
      },
    };
  }

  /**
   * Render sequence (horizontal concatenation)
   */
  private renderSequence(elements: ASTNode[]): RenderResult {
    const rendered = elements.map((e) => this.renderExpression(e));

    let totalWidth = 0;
    let maxUp = 0;
    let maxDown = 0;

    for (const r of rendered) {
      totalWidth += r.dimensions.width;
      maxUp = Math.max(maxUp, r.dimensions.up);
      maxDown = Math.max(maxDown, r.dimensions.down);
    }

    totalWidth += (rendered.length - 1) * this.config.horizontalSeparation;

    const group = this.svg.append('g').attr('class', 'railroad-sequence');
    let x = 0;

    for (let i = 0; i < rendered.length; i++) {
      const r = rendered[i];
      const y = maxUp - r.dimensions.up;

      // Position element
      const elem = group.node().appendChild(r.element);
      elem.setAttribute('transform', `translate(${x}, ${y})`);

      // Draw connecting line to next element
      if (i < rendered.length - 1) {
        const lineX1 = x + r.dimensions.width;
        const lineX2 = lineX1 + this.config.horizontalSeparation;
        const lineY = maxUp;

        group
          .append('path')
          .attr('class', 'railroad-line')
          .attr('d', new PathBuilder().moveTo(lineX1, lineY).lineTo(lineX2, lineY).build());
      }

      x += r.dimensions.width + this.config.horizontalSeparation;
    }

    return {
      element: group.node(),
      dimensions: {
        width: totalWidth,
        height: maxUp + maxDown,
        up: maxUp,
        down: maxDown,
      },
    };
  }

  /**
   * Render choice (vertical alternatives)
   */
  private renderChoice(alternatives: ASTNode[]): RenderResult {
    const rendered = alternatives.map((a) => this.renderExpression(a));

    let maxWidth = 0;
    let totalHeight = 0;

    for (const r of rendered) {
      maxWidth = Math.max(maxWidth, r.dimensions.width);
      totalHeight += r.dimensions.height;
    }

    totalHeight += (rendered.length - 1) * this.config.verticalSeparation;

    const arcRadius = this.config.arcRadius;
    const arcWidth = arcRadius * 4;
    const totalWidth = maxWidth + arcWidth;

    const group = this.svg.append('g').attr('class', 'railroad-choice');
    let y = 0;
    const centerY = totalHeight / 2;

    for (const [i, r] of rendered.entries()) {
      const elemY = y;
      const elemCenterY = elemY + r.dimensions.up;

      // Position element in the center
      const elemX = arcRadius * 2 + (maxWidth - r.dimensions.width) / 2;
      const elem = group.node().appendChild(r.element);
      elem.setAttribute('transform', `translate(${elemX}, ${elemY})`);

      // Left arc from center to this alternative
      const leftPath = new PathBuilder();
      if (i === 0) {
        // First alternative - straight line from left
        leftPath.moveTo(0, centerY).lineTo(arcRadius * 2, elemCenterY);
      } else {
        // Arc down from center
        leftPath
          .moveTo(0, centerY)
          .arcTo(arcRadius, arcRadius, 0, false, elemCenterY > centerY, arcRadius, centerY + (elemCenterY > centerY ? arcRadius : -arcRadius))
          .lineTo(arcRadius, elemCenterY - (elemCenterY > centerY ? arcRadius : -arcRadius))
          .arcTo(arcRadius, arcRadius, 0, false, elemCenterY > centerY, arcRadius * 2, elemCenterY);
      }

      group.append('path').attr('class', 'railroad-line').attr('d', leftPath.build());

      // Right arc from this alternative to center
      const rightPath = new PathBuilder();
      const rightStart = elemX + r.dimensions.width;
      if (i === 0) {
        // First alternative - straight line to right
        rightPath.moveTo(rightStart, elemCenterY).lineTo(totalWidth, centerY);
      } else {
        // Arc back to center
        rightPath
          .moveTo(rightStart, elemCenterY)
          .arcTo(arcRadius, arcRadius, 0, false, elemCenterY > centerY, rightStart + arcRadius, elemCenterY + (elemCenterY > centerY ? -arcRadius : arcRadius))
          .lineTo(rightStart + arcRadius, centerY - (elemCenterY > centerY ? -arcRadius : arcRadius))
          .arcTo(arcRadius, arcRadius, 0, false, elemCenterY > centerY, totalWidth, centerY);
      }

      group.append('path').attr('class', 'railroad-line').attr('d', rightPath.build());

      y += r.dimensions.height + this.config.verticalSeparation;
    }

    return {
      element: group.node(),
      dimensions: {
        width: totalWidth,
        height: totalHeight,
        up: centerY,
        down: totalHeight - centerY,
      },
    };
  }

  /**
   * Render optional (bypass path above)
   */
  private renderOptional(element: ASTNode): RenderResult {
    const inner = this.renderExpression(element);
    const arcRadius = this.config.arcRadius;
    const arcHeight = arcRadius * 2;
    const totalWidth = inner.dimensions.width + arcRadius * 4;
    const totalHeight = inner.dimensions.height + arcHeight;

    const group = this.svg.append('g').attr('class', 'railroad-optional');

    // Position main element
    const elemX = arcRadius * 2;
    const elemY = arcHeight;
    const elem = group.node().appendChild(inner.element);
    elem.setAttribute('transform', `translate(${elemX}, ${elemY})`);

    const centerY = elemY + inner.dimensions.up;

    // Lower path (through element)
    const lowerPath = new PathBuilder()
      .moveTo(0, centerY)
      .lineTo(arcRadius * 2, centerY);
    group.append('path').attr('class', 'railroad-line').attr('d', lowerPath.build());

    const lowerPath2 = new PathBuilder()
      .moveTo(elemX + inner.dimensions.width, centerY)
      .lineTo(totalWidth, centerY);
    group.append('path').attr('class', 'railroad-line').attr('d', lowerPath2.build());

    // Upper bypass path
    const bypassPath = new PathBuilder()
      .moveTo(0, centerY)
      .arcTo(arcRadius, arcRadius, 0, false, false, arcRadius, centerY - arcRadius)
      .lineTo(arcRadius, arcRadius)
      .arcTo(arcRadius, arcRadius, 0, false, true, arcRadius * 2, 0)
      .lineTo(totalWidth - arcRadius * 2, 0)
      .arcTo(arcRadius, arcRadius, 0, false, true, totalWidth - arcRadius, arcRadius)
      .lineTo(totalWidth - arcRadius, centerY - arcRadius)
      .arcTo(arcRadius, arcRadius, 0, false, false, totalWidth, centerY);

    group.append('path').attr('class', 'railroad-line').attr('d', bypassPath.build());

    return {
      element: group.node(),
      dimensions: {
        width: totalWidth,
        height: totalHeight,
        up: centerY,
        down: totalHeight - centerY,
      },
    };
  }

  /**
   * Render repetition (loop back path)
   */
  private renderRepetition(element: ASTNode, min: number): RenderResult {
    const inner = this.renderExpression(element);
    const arcRadius = this.config.arcRadius;
    const arcHeight = arcRadius * 2;
    const totalWidth = inner.dimensions.width + arcRadius * 4;

    // For *, add bypass on top; for +, no bypass
    const hasBypass = min === 0;
    const totalHeight = inner.dimensions.height + arcHeight + (hasBypass ? arcHeight : 0);

    const group = this.svg.append('g').attr('class', 'railroad-repetition');

    // Position main element
    const elemX = arcRadius * 2;
    const elemY = hasBypass ? arcHeight : 0;
    const elem = group.node().appendChild(inner.element);
    elem.setAttribute('transform', `translate(${elemX}, ${elemY})`);

    const centerY = elemY + inner.dimensions.up;

    // Forward path
    group
      .append('path')
      .attr('class', 'railroad-line')
      .attr('d', new PathBuilder().moveTo(0, centerY).lineTo(arcRadius * 2, centerY).build());

    group
      .append('path')
      .attr('class', 'railroad-line')
      .attr(
        'd',
        new PathBuilder()
          .moveTo(elemX + inner.dimensions.width, centerY)
          .lineTo(totalWidth, centerY)
          .build()
      );

    // Loop back path (below)
    const loopY = elemY + inner.dimensions.height + arcRadius;
    const loopPath = new PathBuilder()
      .moveTo(elemX + inner.dimensions.width, centerY)
      .arcTo(arcRadius, arcRadius, 0, false, false, elemX + inner.dimensions.width + arcRadius, centerY + arcRadius)
      .lineTo(elemX + inner.dimensions.width + arcRadius, loopY)
      .arcTo(arcRadius, arcRadius, 0, false, false, elemX + inner.dimensions.width, loopY + arcRadius)
      .lineTo(arcRadius * 2, loopY + arcRadius)
      .arcTo(arcRadius, arcRadius, 0, false, false, arcRadius, loopY)
      .lineTo(arcRadius, centerY + arcRadius)
      .arcTo(arcRadius, arcRadius, 0, false, false, arcRadius * 2, centerY);

    group.append('path').attr('class', 'railroad-line').attr('d', loopPath.build());

    // Optional bypass path (for *)
    if (hasBypass) {
      const bypassPath = new PathBuilder()
        .moveTo(0, centerY)
        .arcTo(arcRadius, arcRadius, 0, false, false, arcRadius, centerY - arcRadius)
        .lineTo(arcRadius, arcRadius)
        .arcTo(arcRadius, arcRadius, 0, false, true, arcRadius * 2, 0)
        .lineTo(totalWidth - arcRadius * 2, 0)
        .arcTo(arcRadius, arcRadius, 0, false, true, totalWidth - arcRadius, arcRadius)
        .lineTo(totalWidth - arcRadius, centerY - arcRadius)
        .arcTo(arcRadius, arcRadius, 0, false, false, totalWidth, centerY);

      group.append('path').attr('class', 'railroad-line').attr('d', bypassPath.build());
    }

    return {
      element: group.node(),
      dimensions: {
        width: totalWidth,
        height: totalHeight,
        up: centerY,
        down: totalHeight - centerY,
      },
    };
  }

  /**
   * Render special sequence
   */
  private renderSpecial(text: string): RenderResult {
    const textDim = this.measureText('? ' + text + ' ?');
    const width = textDim.width + this.config.padding * 2;
    const height = textDim.height + this.config.padding * 2;

    const group = this.svg.append('g').attr('class', 'railroad-special');

    // Rectangle with dashed border
    group.append('rect').attr('x', 0).attr('y', 0).attr('width', width).attr('height', height);

    // Text
    group
      .append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .text('? ' + text + ' ?');

    return {
      element: group.node(),
      dimensions: {
        width,
        height,
        up: height / 2,
        down: height / 2,
      },
    };
  }

  /**
   * Render an expression (recursive)
   */
  renderExpression(node: ASTNode): RenderResult {
    switch (node.type) {
      case 'terminal':
        return this.renderTerminal(node.value);

      case 'nonterminal':
        return this.renderNonTerminal(node.name);

      case 'sequence':
        return this.renderSequence(node.elements);

      case 'choice':
        return this.renderChoice(node.alternatives);

      case 'optional':
        return this.renderOptional(node.element);

      case 'repetition':
        return this.renderRepetition(node.element, node.min);

      case 'group':
        return this.renderExpression(node.element);

      case 'special':
        return this.renderSpecial(node.text);

      case 'exception':
        // For now, render as sequence of base and except
        // TODO: Implement proper exception rendering
        return this.renderSequence([node.base, { type: 'terminal', value: '-' }, node.except]);

      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
    }
  }

  /**
   * Render a single rule
   */
  renderRule(rule: RailroadRule, y: number): { height: number } {
    const group = this.svg.append('g').attr('class', 'railroad-rule').attr('transform', `translate(0, ${y})`);

    // Rule name
    const nameGroup = group.append('g').attr('class', 'railroad-rule-name-group');
    nameGroup
      .append('text')
      .attr('class', 'railroad-rule-name')
      .attr('x', 0)
      .attr('y', 20)
      .text(rule.name + ' =');

    const nameWidth = this.measureText(rule.name + ' =').width + 20;

    // Start marker
    const startMarker = group.append('g').attr('class', 'railroad-start');
    startMarker
      .append('circle')
      .attr('cx', nameWidth)
      .attr('cy', 20)
      .attr('r', this.config.markerRadius);

    // Render definition
    const defGroup = group.append('g').attr('transform', `translate(${nameWidth + 20}, 0)`);
    this.svg = defGroup;
    const result = this.renderExpression(rule.definition);
    this.svg = group.parent();

    // End marker
    const endMarker = group.append('g').attr('class', 'railroad-end');
    endMarker
      .append('circle')
      .attr('cx', nameWidth + 20 + result.dimensions.width + 10)
      .attr('cy', 20)
      .attr('r', this.config.markerRadius);

    // Line from start to definition
    group
      .append('path')
      .attr('class', 'railroad-line')
      .attr('d', new PathBuilder().moveTo(nameWidth + this.config.markerRadius, 20).lineTo(nameWidth + 20, 20).build());

    // Line from definition to end
    group
      .append('path')
      .attr('class', 'railroad-line')
      .attr(
        'd',
        new PathBuilder()
          .moveTo(nameWidth + 20 + result.dimensions.width, 20)
          .lineTo(nameWidth + 20 + result.dimensions.width + 10 - this.config.markerRadius, 20)
          .build()
      );

    return {
      height: Math.max(40, result.dimensions.height + 20),
    };
  }

  /**
   * Render all rules
   */
  renderDiagram(rules: RailroadRule[]): { width: number; height: number } {
    let y = this.config.padding;
    let maxWidth = 0;

    for (const rule of rules) {
      const result = this.renderRule(rule, y);
      y += result.height + this.config.verticalSeparation;
      maxWidth = Math.max(maxWidth, 800); // Estimate for now
    }

    return {
      width: maxWidth + this.config.padding * 2,
      height: y + this.config.padding,
    };
  }
}

/**
 * Main draw function
 */
const draw: DrawDefinition = (text, id, _version) => {
  log.debug('[Railroad] Rendering diagram\n' + text);

  try {
    const svg = selectSvgElement(id);
    svg.attr('class', 'railroad-diagram');

    const rules = db.getRules();
    log.debug(`[Railroad] Rendering ${rules.length} rules`);

    if (rules.length === 0) {
      log.warn('[Railroad] No rules to render');
      configureSvgSize(svg, 100, 200, true);
      return;
    }

    const renderer = new RailroadRenderer(svg);
    const dimensions = renderer.renderDiagram(rules);

    configureSvgSize(svg, dimensions.height, dimensions.width, true);

    log.debug('[Railroad] Render complete');
  } catch (error) {
    log.error('[Railroad] Render error:', error);
    throw error;
  }
};

export const renderer = { draw };
export default renderer;
