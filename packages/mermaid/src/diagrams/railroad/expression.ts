/**
 * Railroad diagram layout engine.
 *
 * Adapted for TypeScript / mermaid: text width uses mermaid's calculateTextDimensions;
 * D3 selections use mermaid's SVGGroup type.
 *
 * Two-phase design:
 *   1. Parse phase: factories return `Expr` — pure structure, no pixel knowledge.
 *   2. Resolve phase: `expr.resolve(config)` converts to `LayoutBox` with concrete
 *      grid-unit dimensions. Only `textBox` needs the config; composites just
 *      recurse and do plain arithmetic.
 *   3. Render phase: `box.render(ctx)` converts grid units to pixels via RenderContext.
 */

import type { Selection } from 'd3';
import { calculateTextDimensions } from '../../utils.js';

// ===========================================================================
// Layout Contract
// ===========================================================================

/** D3 group selection used throughout the layout engine. */
export type D3Group = Selection<SVGGElement, unknown, Element | null, unknown>;

export const Direction = {
  NORTH: 'north',
  SOUTH: 'south',
  EAST: 'east',
  WEST: 'west',
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

/**
 * Config values needed during the resolve phase and at render time.
 * Extracted from RailroadDiagramConfig so expression.ts has no dependency on config.type.ts.
 */
export interface ResolveConfig {
  gridSize: number;
  fontSize: number;
  fontFamily: string;
}

/**
 * A resolved, render-able unit of the railroad diagram.
 *
 * All coordinate values are concrete grid units — no pixel knowledge here.
 * RenderContext multiplies by `gridSize` when producing SVG output.
 */
export interface LayoutBox {
  width: number;
  height: number;
  /** Y coordinate of the main rail line within this box (grid units). */
  baseline: number;
  render: (ctx: RenderContext) => void;
}

/**
 * An unresolved expression node produced by the parser.
 *
 * Calling `resolve(config)` performs text measurement (the only operation
 * that needs pixel/grid knowledge) and returns a fully concrete `LayoutBox`.
 */
export interface Expr {
  resolve(config: ResolveConfig): LayoutBox;
}

// ===========================================================================
// Expression Factories  (public API — return Expr)
// ===========================================================================

/**
 * Static factory methods that build Expr objects.
 *
 * Syntax mirrors the original diagram.js names:
 *   `textBox(text, class)`, `sequence(...)`, `stack(...)`, `bypass(expr)`, `loop(expr)`
 */
export const Expression = {
  // ---- textBox --------------------------------------------------------------

  textBox(text: string, className: string): Expr {
    return {
      resolve(config): LayoutBox {
        const width = roundUpToEven(measureTextGridUnits(text, config) + 3); // +1 left stub, +1 right stub, +1 padding
        return {
          width,
          height: 2,
          baseline: 1,
          render(ctx) {
            ctx.renderTextBox(text, className, width);
          },
        };
      },
    };
  },

  // ---- sequence -------------------------------------------------------------

  sequence(...children: Expr[]): Expr {
    return {
      resolve(config): LayoutBox {
        const boxes = children.map((c) => c.resolve(config));
        const width = boxes.reduce((s, b) => s + b.width, 0) + (boxes.length - 1) * 2;
        const height = Math.max(...boxes.map((b) => b.height));
        const baseline = Math.max(...boxes.map((b) => b.baseline));

        return {
          width,
          height,
          baseline,
          render(ctx) {
            let x = 0;
            boxes.forEach((box, i) => {
              ctx.renderChild(box, x, baseline - box.baseline);
              if (i < boxes.length - 1) {
                ctx.trackBuilder
                  .start(x + box.width, baseline, Direction.EAST)
                  .forward(2)
                  .finish();
              }
              x += box.width + 2;
            });
          },
        };
      },
    };
  },

  // ---- stack ----------------------------------------------------------------

  stack(...children: Expr[]): Expr {
    return {
      resolve(config): LayoutBox {
        const boxes = children.map((c) => c.resolve(config));
        const maxChildWidth = roundUpToEven(Math.max(...boxes.map((b) => b.width)));
        const width = maxChildWidth + 4; // 2 units on each side for branching rails
        const height = boxes.reduce((s, b) => s + b.height, 0) + (boxes.length - 1) + 1;
        const baseline = boxes[0].baseline;

        return {
          width,
          height,
          baseline,
          render(ctx) {
            let currentY = 0;
            boxes.forEach((box, i) => {
              const xOffset = 2 + (maxChildWidth - box.width) / 2;
              const childBaseline = currentY + box.baseline;

              ctx.renderChild(box, xOffset, currentY);

              const childLeftX = xOffset;
              const childRightX = xOffset + box.width;

              if (i === 0) {
                // First child: straight rails to/from the connection points
                ctx.trackBuilder.start(0, baseline, Direction.EAST).forward(childLeftX).finish();
                ctx.trackBuilder
                  .start(childRightX, childBaseline, Direction.EAST)
                  .forward(width - childRightX)
                  .finish();
              } else {
                // Subsequent children: branching paths that curve down from baseline
                const vDist = childBaseline - baseline;

                ctx.trackBuilder
                  .start(0, baseline, Direction.EAST)
                  .turnRight()
                  .forward(vDist - 2)
                  .turnLeft()
                  .forward(childLeftX - 2)
                  .finish();

                ctx.trackBuilder
                  .start(width, baseline, Direction.WEST)
                  .turnLeft()
                  .forward(vDist - 2)
                  .turnRight()
                  .forward(width - childRightX - 2)
                  .finish();
              }

              currentY += box.height + 1;
            });
          },
        };
      },
    };
  },

  // ---- bypass ---------------------------------------------------------------

  /** Optional element: a rail above the child allows skipping it. */
  bypass(child: Expr): Expr {
    return {
      resolve(config): LayoutBox {
        const box = child.resolve(config);
        const width = roundUpToEven(box.width + 4);
        const height = box.height + 1;
        const baseline = box.baseline + 1;
        const childX = (width - box.width) / 2;

        return {
          width,
          height,
          baseline,
          render(ctx) {
            ctx.renderChild(box, childX, 1);

            // Arc bypass path above the child
            ctx.trackBuilder
              .start(0, baseline, Direction.EAST)
              .turnLeft()
              .forward(baseline - 2)
              .turnRight()
              .forward(width - 4)
              .turnRight()
              .forward(baseline - 2)
              .turnLeft()
              .finish();

            // Through-path stubs that connect to the child entry/exit
            ctx.trackBuilder.start(0, baseline, Direction.EAST).forward(2).finish();
            ctx.trackBuilder.start(width, baseline, Direction.WEST).forward(2).finish();
          },
        };
      },
    };
  },

  // ---- loop -----------------------------------------------------------------

  /** Repeatable element: a rail above the child allows looping back. */
  loop(child: Expr): Expr {
    return {
      resolve(config): LayoutBox {
        const box = child.resolve(config);
        const width = roundUpToEven(box.width + 4);
        const height = box.height + 1;
        const baseline = box.baseline + 1;
        const childX = (width - box.width) / 2;

        return {
          width,
          height,
          baseline,
          render(ctx) {
            ctx.renderChild(box, childX, 1);

            // Arc loop path (reverse direction = right-to-left return)
            ctx.trackBuilder
              .start(2, baseline, Direction.WEST)
              .turnRight()
              .forward(baseline - 2)
              .turnRight()
              .forward(width - 4)
              .turnRight()
              .forward(baseline - 2)
              .turnRight()
              .finish();

            // Through-path stubs
            ctx.trackBuilder.start(0, baseline, Direction.EAST).forward(2).finish();
            ctx.trackBuilder.start(width, baseline, Direction.WEST).forward(2).finish();
          },
        };
      },
    };
  },
};

// ===========================================================================
// Rendering Primitives  (implementation detail)
// ===========================================================================

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundUpToEven(value: number): number {
  return value + (value % 2);
}

/**
 * Measure text width in grid units using the configured font and grid size.
 *
 * Uses mermaid's `calculateTextDimensions` (real SVG measurement via a temporary
 * DOM element). Falls back to a character-width approximation when the DOM is
 * not available (e.g. in unit tests).
 */
function measureTextGridUnits(
  text: string,
  { gridSize, fontSize, fontFamily }: ResolveConfig
): number {
  const dims = calculateTextDimensions(text, { fontSize, fontFamily });
  if (dims.width > 0) {
    return Math.max(2, Math.ceil(dims.width / gridSize));
  }
  // Fallback: ~0.5 grid units per character + small side padding
  return Math.max(2, Math.ceil(text.length * 0.5 + 0.8));
}

// ---------------------------------------------------------------------------
// TrackBuilder
// ---------------------------------------------------------------------------

/** Fluent SVG path builder that works in grid-unit coordinates. */
class TrackBuilder {
  private readonly gridSize: number;
  private readonly group: D3Group;

  private currentPath: { commands: string[] } | null = null;
  private currentX = 0;
  private currentY = 0;
  private currentDirection: Direction = Direction.EAST;

  constructor(group: D3Group, gridSize: number) {
    this.group = group;
    this.gridSize = gridSize;
  }

  start(x: number, y: number, direction: Direction): this {
    this.currentX = x;
    this.currentY = y;
    this.currentDirection = direction;
    this.currentPath = { commands: [`M ${x * this.gridSize} ${y * this.gridSize}`] };
    return this;
  }

  forward(units: number): this {
    const d = this._delta(this.currentDirection);
    this.currentX += d.x * units;
    this.currentY += d.y * units;
    this.currentPath!.commands.push(
      `L ${this.currentX * this.gridSize} ${this.currentY * this.gridSize}`
    );
    return this;
  }

  turnLeft(): this {
    const newDir = this._turnLeft(this.currentDirection);
    this._addArc(this.currentDirection, newDir);
    this.currentDirection = newDir;
    return this;
  }

  turnRight(): this {
    const newDir = this._turnRight(this.currentDirection);
    this._addArc(this.currentDirection, newDir);
    this.currentDirection = newDir;
    return this;
  }

  finish(): this {
    this.group
      .append('path')
      .attr('d', this.currentPath!.commands.join(' '))
      .attr('class', 'rail-track');
    this.currentPath = null;
    return this;
  }

  // ---- private helpers -------------------------------------------------------

  private _delta(dir: Direction): { x: number; y: number } {
    switch (dir) {
      case Direction.NORTH:
        return { x: 0, y: -1 };
      case Direction.SOUTH:
        return { x: 0, y: 1 };
      case Direction.EAST:
        return { x: 1, y: 0 };
      case Direction.WEST:
        return { x: -1, y: 0 };
    }
  }

  private _turnLeft(dir: Direction): Direction {
    switch (dir) {
      case Direction.NORTH:
        return Direction.WEST;
      case Direction.WEST:
        return Direction.SOUTH;
      case Direction.SOUTH:
        return Direction.EAST;
      case Direction.EAST:
        return Direction.NORTH;
    }
  }

  private _turnRight(dir: Direction): Direction {
    switch (dir) {
      case Direction.NORTH:
        return Direction.EAST;
      case Direction.EAST:
        return Direction.SOUTH;
      case Direction.SOUTH:
        return Direction.WEST;
      case Direction.WEST:
        return Direction.NORTH;
    }
  }

  private _addArc(from: Direction, to: Direction): void {
    const fd = this._delta(from);
    const td = this._delta(to);

    this.currentX += fd.x;
    this.currentY += fd.y;
    const x1 = this.currentX * this.gridSize;
    const y1 = this.currentY * this.gridSize;

    this.currentX += td.x;
    this.currentY += td.y;
    const x2 = this.currentX * this.gridSize;
    const y2 = this.currentY * this.gridSize;

    this.currentPath!.commands.push(`Q ${x1} ${y1} ${x2} ${y2}`);
  }
}

// ---------------------------------------------------------------------------
// RenderContext
// ---------------------------------------------------------------------------

/** Rendering interface passed to each LayoutBox's render() method. */
export class RenderContext {
  readonly group: D3Group;
  readonly gridSize: number;
  readonly fontSize: number;
  readonly fontFamily: string;
  readonly trackBuilder: TrackBuilder;

  /** Corner radius for boxes (px): quarter of box height (box = 2 grid units tall). */
  readonly boxRadius: number;

  constructor(group: D3Group, config: ResolveConfig) {
    this.group = group;
    this.gridSize = config.gridSize;
    this.fontSize = config.fontSize;
    this.fontFamily = config.fontFamily;
    this.trackBuilder = new TrackBuilder(group, config.gridSize);
    this.boxRadius = config.gridSize * 0.5;
  }

  /** Render a child LayoutBox at the given grid-unit offset from this context. */
  renderChild(child: LayoutBox, x: number, y: number): void {
    const childGroup = this.group
      .append('g')
      .attr('transform', `translate(${x * this.gridSize}, ${y * this.gridSize})`) as D3Group;
    child.render(new RenderContext(childGroup, this));
  }

  /**
   * Render a text box (terminal or nonterminal).
   *
   * Layout:
   *   - 1-unit rail stub on the left  (x: 0..1)
   *   - rectangle + text              (x: 1..width-1)
   *   - 1-unit rail stub on the right (x: width-1..width)
   *   - height = 2 grid units; baseline = 1
   */
  renderTextBox(text: string, className: string, width: number): void {
    const height = 2;
    const boxWidth = width - 2; // inner rect (without rail stubs)

    this.trackBuilder.start(0, 1, Direction.EAST).forward(1).finish();
    this.trackBuilder
      .start(width - 1, 1, Direction.EAST)
      .forward(1)
      .finish();

    this.group
      .append('rect')
      .attr('x', 1 * this.gridSize)
      .attr('y', 0)
      .attr('rx', this.boxRadius)
      .attr('ry', this.boxRadius)
      .attr('width', boxWidth * this.gridSize)
      .attr('height', height * this.gridSize)
      .attr('class', `textbox ${className}`);

    const textEl = this.group
      .append('text')
      .attr('x', (1 + boxWidth / 2) * this.gridSize)
      .attr('y', (height / 2) * this.gridSize)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', this.fontSize)
      .attr('font-family', this.fontFamily)
      .attr('class', `textbox-text ${className}`)
      .text(text);

    if (className === 'nonterminal') {
      textEl.attr('data-rule', text);
    }
  }
}
