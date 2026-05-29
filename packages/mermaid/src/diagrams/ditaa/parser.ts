/**
 * Ditaa ASCII art parser for Mermaid.
 *
 * Parses a monospace character grid into a structured diagram model consisting
 * of boxes, connecting lines, arrow-headed connectors, and free-floating text.
 *
 * Grid character conventions:
 *   Box corners : `+`
 *   Box borders  : `-` (horizontal), `|` (vertical)
 *   Arrow heads  : `<`, `>`, `^`, `v`
 *   Dashed lines : `=` (horizontal dashed), `:` (vertical dashed)
 *   Rounded box  : `/` or `\` used instead of `+` at corners
 *   Free text    : Any other printable character not consumed by the above
 */

import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import type {
  DitaaArrow,
  DitaaBox,
  DitaaDiagram,
  DitaaGrid,
  DitaaLine,
  DitaaText,
} from './types.js';
import { DitaaDBImpl } from './db.js';

// ─── Character classification helpers ─────────────────────────────────────────

const HORIZONTAL_SOLID = new Set(['-', '+', '<', '>']);
const HORIZONTAL_DASHED = new Set(['=']);
const VERTICAL_SOLID = new Set(['|', '+', '^', 'v']);
const VERTICAL_DASHED = new Set([':']);
const CORNER_CHARS = new Set(['+', '/', '\\']);
const ARROW_CHARS = new Set(['<', '>', '^', 'v']);

function isCorner(ch: string): boolean {
  return CORNER_CHARS.has(ch);
}

function isArrow(ch: string): boolean {
  return ARROW_CHARS.has(ch);
}

function isPrintable(ch: string): boolean {
  return ch !== ' ' && ch !== '\0';
}

// ─── Grid utilities ────────────────────────────────────────────────────────────

function getCell(grid: DitaaGrid, row: number, col: number): string {
  if (row < 0 || row >= grid.height || col < 0 || col >= grid.width) {
    return '\0';
  }
  return grid.cells[row * grid.width + col] ?? '\0';
}

function setCell(grid: DitaaGrid, row: number, col: number, ch: string): void {
  if (row < 0 || row >= grid.height || col < 0 || col >= grid.width) {
    return;
  }
  grid.cells[row * grid.width + col] = ch;
}

/**
 * Build the grid from raw diagram text lines (after the `ditaa` keyword line).
 */
function buildGrid(lines: string[]): DitaaGrid {
  const height = lines.length;
  const width = Math.max(0, ...lines.map((l) => l.length));
  // Pad every row to `width` with spaces
  const cells: string[] = [];
  for (const line of lines) {
    for (let col = 0; col < width; col++) {
      cells.push(col < line.length ? line[col] : ' ');
    }
  }
  return { width, height, cells };
}

// ─── Box detection ─────────────────────────────────────────────────────────────

/**
 * Attempt to detect and extract a box whose top-left corner is at (row, col).
 * Returns the box on success, or null if the top-left `+`/`/` is not part of a
 * valid rectangle.
 */
function tryExtractBox(grid: DitaaGrid, startRow: number, startCol: number): DitaaBox | null {
  const topLeft = getCell(grid, startRow, startCol);
  if (!isCorner(topLeft)) {
    return null;
  }

  // Peek at the next character to determine horizontal border style
  const nextHoriz = getCell(grid, startRow, startCol + 1);
  // Dashed if the next character is '=' even if corners are '+'
  const dashed = HORIZONTAL_DASHED.has(nextHoriz);
  const rounded = topLeft === '/' || topLeft === '\\';

  // Walk right along the top edge to find the top-right corner
  let endCol = startCol + 1;
  while (endCol < grid.width) {
    const ch = getCell(grid, startRow, endCol);
    if (isCorner(ch)) {
      break;
    }
    // Accept both solid AND dashed horizontal chars regardless of style so
    // '+======+' works (corners are '+', middle is '=')
    if (!HORIZONTAL_SOLID.has(ch) && !HORIZONTAL_DASHED.has(ch) && ch !== ' ' && !isArrow(ch)) {
      return null; // invalid top edge character
    }
    endCol++;
  }
  if (endCol >= grid.width || !isCorner(getCell(grid, startRow, endCol))) {
    return null;
  }
  if (endCol <= startCol + 1) {
    return null; // zero-width box
  }

  // Walk down along the left edge to find the bottom-left corner
  let endRow = startRow + 1;
  while (endRow < grid.height) {
    const ch = getCell(grid, endRow, startCol);
    if (isCorner(ch)) {
      break;
    }
    // Accept both solid AND dashed vertical chars (same flexibility as horiz edges)
    if (!VERTICAL_SOLID.has(ch) && !VERTICAL_DASHED.has(ch) && ch !== ' ' && !isArrow(ch)) {
      return null;
    }
    endRow++;
  }
  if (endRow >= grid.height || !isCorner(getCell(grid, endRow, startCol))) {
    return null;
  }
  if (endRow <= startRow + 1) {
    return null; // zero-height box
  }

  // Validate the bottom edge (bottom-left → bottom-right)
  for (let col = startCol + 1; col < endCol; col++) {
    const ch = getCell(grid, endRow, col);
    if (!HORIZONTAL_SOLID.has(ch) && !HORIZONTAL_DASHED.has(ch) && ch !== ' ' && !isArrow(ch)) {
      return null;
    }
  }

  // Validate the right edge (top-right → bottom-right)
  for (let row = startRow + 1; row < endRow; row++) {
    const ch = getCell(grid, row, endCol);
    if (!VERTICAL_SOLID.has(ch) && !VERTICAL_DASHED.has(ch) && ch !== ' ' && !isArrow(ch)) {
      return null;
    }
  }

  // Validate the bottom-right corner
  if (!isCorner(getCell(grid, endRow, endCol))) {
    return null;
  }

  // Extract text from the interior of the box
  const textLines: string[] = [];
  for (let r = startRow + 1; r < endRow; r++) {
    let line = '';
    for (let c = startCol + 1; c < endCol; c++) {
      line += getCell(grid, r, c);
    }
    textLines.push(line.trim());
  }
  const text = textLines.filter((l) => l.length > 0).join('\n');

  return {
    col: startCol,
    row: startRow,
    cols: endCol - startCol + 1,
    rows: endRow - startRow + 1,
    text,
    rounded,
    dashed,
  };
}

/**
 * Find all boxes in the grid (scanning top-left to bottom-right).
 * Consumed box cells are blanked out so they don't interfere with line tracing.
 */
function extractBoxes(grid: DitaaGrid): DitaaBox[] {
  const boxes: DitaaBox[] = [];
  // Track which top-left corners we've already claimed
  const claimed = new Set<number>();

  for (let row = 0; row < grid.height; row++) {
    for (let col = 0; col < grid.width; col++) {
      const ch = getCell(grid, row, col);
      if (!isCorner(ch)) {
        continue;
      }
      const key = row * grid.width + col;
      if (claimed.has(key)) {
        continue;
      }

      const box = tryExtractBox(grid, row, col);
      if (!box) {
        continue;
      }

      boxes.push(box);

      // Blank out all border characters (but NOT interior text — they'll be
      // cleared in a second pass; we keep corners/borders so we can detect
      // overlapping shapes correctly before clearing).
      const { cols, rows } = box;
      const endRow = row + rows - 1;
      const endCol = col + cols - 1;

      // Mark all four corners as claimed
      claimed.add(row * grid.width + col);
      claimed.add(row * grid.width + endCol);
      claimed.add(endRow * grid.width + col);
      claimed.add(endRow * grid.width + endCol);

      // Blank borders
      for (let c = col; c <= endCol; c++) {
        setCell(grid, row, c, ' ');
        setCell(grid, endRow, c, ' ');
      }
      for (let r = row + 1; r < endRow; r++) {
        setCell(grid, r, col, ' ');
        setCell(grid, r, endCol, ' ');
        // Blank interior too
        for (let c = col + 1; c < endCol; c++) {
          setCell(grid, r, c, ' ');
        }
      }
    }
  }

  return boxes;
}

// ─── Line / Arrow detection ────────────────────────────────────────────────────

/**
 * Follow a connector starting at (row, col) moving in direction (dr, dc).
 * Collects points and detects dashed style and arrow heads.
 */
function traceConnector(
  grid: DitaaGrid,
  startRow: number,
  startCol: number,
  dr: number,
  dc: number
): {
  points: { col: number; row: number }[];
  dashed: boolean;
  startArrow: boolean;
  endArrow: boolean;
} | null {
  const points: { col: number; row: number }[] = [{ col: startCol, row: startRow }];
  let dashed = false;
  let startArrow = false;
  let endArrow = false;

  const startCh = getCell(grid, startRow, startCol);
  if (isArrow(startCh)) {
    startArrow = true;
  }

  let r = startRow + dr;
  let c = startCol + dc;

  while (r >= 0 && r < grid.height && c >= 0 && c < grid.width) {
    const ch = getCell(grid, r, c);

    // Arrow terminator
    if (isArrow(ch)) {
      endArrow = true;
      points.push({ col: c, row: r });
      setCell(grid, r, c, ' ');
      break;
    }

    const isHoriz = dc !== 0;
    const solid = isHoriz
      ? HORIZONTAL_SOLID.has(ch) || ch === '+'
      : VERTICAL_SOLID.has(ch) || ch === '+';
    const dashedMatch = isHoriz ? HORIZONTAL_DASHED.has(ch) : VERTICAL_DASHED.has(ch);

    if (solid) {
      points.push({ col: c, row: r });
      setCell(grid, r, c, ' ');
    } else if (dashedMatch) {
      dashed = true;
      points.push({ col: c, row: r });
      setCell(grid, r, c, ' ');
    } else {
      break;
    }

    r += dr;
    c += dc;
  }

  if (points.length < 2) {
    return null;
  }

  return { points, dashed, startArrow, endArrow };
}

/**
 * Scan the grid for any remaining connector characters and trace them into
 * DitaaLine / DitaaArrow objects.
 */
function extractConnectors(grid: DitaaGrid): { lines: DitaaLine[]; arrows: DitaaArrow[] } {
  const lines: DitaaLine[] = [];
  const arrows: DitaaArrow[] = [];

  for (let row = 0; row < grid.height; row++) {
    for (let col = 0; col < grid.width; col++) {
      const ch = getCell(grid, row, col);

      // Horizontal connectors: `-` `=` `<` `>`
      if (HORIZONTAL_SOLID.has(ch) || HORIZONTAL_DASHED.has(ch)) {
        const result = traceConnector(grid, row, col, 0, 1);
        setCell(grid, row, col, ' ');
        if (result && result.points.length >= 2) {
          if (result.startArrow || result.endArrow) {
            arrows.push(result as DitaaArrow);
          } else {
            lines.push({ points: result.points, dashed: result.dashed });
          }
        }
      }

      // Vertical connectors: `|` `:` `^` `v`
      if (VERTICAL_SOLID.has(ch) || VERTICAL_DASHED.has(ch)) {
        const result = traceConnector(grid, row, col, 1, 0);
        setCell(grid, row, col, ' ');
        if (result && result.points.length >= 2) {
          if (result.startArrow || result.endArrow) {
            arrows.push(result as DitaaArrow);
          } else {
            lines.push({ points: result.points, dashed: result.dashed });
          }
        }
      }
    }
  }

  return { lines, arrows };
}

// ─── Text extraction ───────────────────────────────────────────────────────────

/**
 * Collect contiguous runs of printable characters in each row as text labels.
 */
function extractTexts(grid: DitaaGrid): DitaaText[] {
  const texts: DitaaText[] = [];

  for (let row = 0; row < grid.height; row++) {
    let col = 0;
    while (col < grid.width) {
      const ch = getCell(grid, row, col);
      if (isPrintable(ch)) {
        const startCol = col;
        let run = '';
        while (col < grid.width && isPrintable(getCell(grid, row, col))) {
          run += getCell(grid, row, col);
          col++;
        }
        const trimmed = run.trim();
        if (trimmed.length > 0) {
          texts.push({ col: startCol, row, text: trimmed });
        }
      } else {
        col++;
      }
    }
  }

  return texts;
}

// ─── Main parse entry point ────────────────────────────────────────────────────

/**
 * Parse the raw ditaa diagram text into a structured DitaaDiagram.
 * The first line (containing the `ditaa` keyword) is stripped before parsing.
 */
export function parseDitaa(rawText: string): DitaaDiagram {
  // Strip the `ditaa` keyword line (first non-empty line)
  const allLines = rawText.split('\n');
  const bodyStartIndex = allLines.findIndex((l) => /^\s*ditaa/.test(l));
  const bodyLines = bodyStartIndex >= 0 ? allLines.slice(bodyStartIndex + 1) : allLines;

  // Remove trailing empty lines
  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') {
    bodyLines.pop();
  }

  const grid = buildGrid(bodyLines);
  log.debug('DitaaGrid:', grid);

  // Work on a mutable copy of the grid
  const workingGrid: DitaaGrid = {
    width: grid.width,
    height: grid.height,
    cells: [...grid.cells],
  };

  // Phase 1: extract boxes (clears consumed cells)
  const boxes = extractBoxes(workingGrid);
  log.debug('Ditaa boxes:', boxes);

  // Phase 2: extract connectors (clears consumed cells)
  const { lines, arrows } = extractConnectors(workingGrid);
  log.debug('Ditaa lines:', lines, 'arrows:', arrows);

  // Phase 3: remaining printable chars are free-floating text
  const texts = extractTexts(workingGrid);
  log.debug('Ditaa texts:', texts);

  return { boxes, lines, arrows, texts, grid };
}

// ─── ParserDefinition wrapper ──────────────────────────────────────────────────

export const parser: ParserDefinition = {
  parser: { yy: undefined as unknown as DitaaDBImpl },
  parse: (text: string): void => {
    const db = parser.parser?.yy;
    if (!(db instanceof DitaaDBImpl)) {
      throw new Error(
        'parser.parser?.yy was not a DitaaDBImpl. This is a bug in Mermaid — please report it.'
      );
    }
    try {
      const diagram = parseDitaa(text);
      db.setDiagram(diagram);
    } catch (error) {
      log.error('Error parsing ditaa diagram:', error);
      throw error;
    }
  },
};
