/**
 * Batches per-test Cypress screenshots into composite "sheets" for Argos,
 * grouping by diagram folder so a new test in one diagram never alters another
 * diagram's sheets. Pure planning is separated from sharp-backed compositing so
 * the grouping/ordering rules can be unit-tested without images.
 *
 * CLI usage:
 *   pnpm run argos:batch
 *   ARGOS_SCREENSHOT_DIR=cypress/screenshots ARGOS_SHEETS_DIR=cypress/argos-sheets
 *     ARGOS_TILES_PER_SHEET=12 ARGOS_SHEET_COLS=3 ARGOS_SHEET_SCALE=2
 *     ARGOS_TILE_WIDTH=1440 ARGOS_TILE_IMAGE_HEIGHT=1024 pnpm run argos:batch
 */

import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Matches a Cypress spec-file path segment: foo.spec.js / foo.spec.ts / .cjs / .mts
const SPEC_SEGMENT_RE = /\.spec\.[cm]?[jt]s$/;

/** Fixed label band under each screenshot tile (deterministic grid sizing). */
export const LABEL_HEIGHT = 24;
/** Matches cypress.config.ts viewport — every cell uses this slot, not max(tile). */
export const DEFAULT_TILE_WIDTH = 1440;
export const DEFAULT_TILE_IMAGE_HEIGHT = 1024;
const LABEL_FONT_SIZE = 11;
const LABEL_PADDING = 4;
const GRID_LINE_WIDTH = 1;
const GRID_LINE_COLOR = '#cccccc';
/** Default output scale for composite sheets (1 = native pixel dimensions). */
export const DEFAULT_SHEET_SCALE = 1;
/** Default sheets composited concurrently (bounded so memory stays sane). */
export const DEFAULT_SHEET_CONCURRENCY = 4;
/** zlib level for the final written sheet — uploaded then discarded, so size barely matters. */
const SHEET_PNG_COMPRESSION = 3;
/** Transient buffers are re-decoded during composite; skip zlib effort entirely. */
const INTERMEDIATE_PNG_COMPRESSION = 0;

function scaled(value: number, scale: number): number {
  return Math.round(value * scale);
}

export interface SheetManifest {
  sheet: string;
  group: string;
  grid: {
    cols: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    imageHeight: number;
    labelHeight: number;
    scale: number;
  };
  tiles: (Tile & { title: string })[];
}

export interface Sheet {
  group: string;
  index: number;
  output: string;
  cols: number;
  tiles: Tile[];
}

export interface Tile {
  index: number;
  row: number;
  col: number;
  name: string;
  source: string;
}

/** Cypress screenshot names use hyphens instead of spaces; restore for display. */
export function formatTileTitle(name: string): string {
  return name.replace(/-/g, ' ');
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateTitle(title: string, maxWidth: number, fontSize: number, padding: number): string {
  const maxChars = Math.floor((maxWidth - padding * 2) / (fontSize * 0.55));
  if (title.length <= maxChars) {
    return title;
  }
  return `${title.slice(0, Math.max(0, maxChars - 1))}…`;
}

function createLabelSvg(
  title: string,
  width: number,
  height: number,
  fontSize: number,
  padding: number
): Buffer {
  const text = escapeXml(truncateTitle(title, width, fontSize, padding));
  const baseline = fontSize + padding;
  const svg = [
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<text x="${padding}" y="${baseline}" font-family="sans-serif" font-size="${fontSize}" fill="#333333">${text}</text>`,
    `</svg>`,
  ].join('');
  return Buffer.from(svg);
}

function createGridLinesSvg(
  width: number,
  height: number,
  cols: number,
  rows: number,
  cellWidth: number,
  cellHeight: number,
  lineWidth: number
): Buffer {
  const lines: string[] = [];
  for (let c = 1; c < cols; c++) {
    const x = c * cellWidth;
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${GRID_LINE_COLOR}" stroke-width="${lineWidth}"/>`
    );
  }
  for (let r = 1; r < rows; r++) {
    const y = r * cellHeight;
    lines.push(
      `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${GRID_LINE_COLOR}" stroke-width="${lineWidth}"/>`
    );
  }
  const inset = lineWidth / 2;
  lines.push(
    `<rect x="${inset}" y="${inset}" width="${width - lineWidth}" height="${height - lineWidth}" fill="none" stroke="${GRID_LINE_COLOR}" stroke-width="${lineWidth}"/>`
  );
  const svg = [
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
    ...lines,
    `</svg>`,
  ].join('');
  return Buffer.from(svg);
}

async function createGridLinesBuffer(
  width: number,
  height: number,
  cols: number,
  rows: number,
  cellWidth: number,
  cellHeight: number,
  lineWidth: number
): Promise<Buffer> {
  return sharp(createGridLinesSvg(width, height, cols, rows, cellWidth, cellHeight, lineWidth))
    .png({ compressionLevel: INTERMEDIATE_PNG_COMPRESSION })
    .toBuffer();
}

// Grid lines depend only on dimensions, which repeat across same-shape sheets
// (every full sheet shares them). Rasterize once per shape and reuse.
const gridBufferCache = new Map<string, Promise<Buffer>>();
function getGridBuffer(
  width: number,
  height: number,
  cols: number,
  rows: number,
  cellWidth: number,
  cellHeight: number,
  lineWidth: number
): Promise<Buffer> {
  const key = `${width}:${height}:${cols}:${rows}:${cellWidth}:${cellHeight}:${lineWidth}`;
  let buffer = gridBufferCache.get(key);
  if (!buffer) {
    buffer = createGridLinesBuffer(width, height, cols, rows, cellWidth, cellHeight, lineWidth);
    gridBufferCache.set(key, buffer);
  }
  return buffer;
}

export interface PlanSheetsOptions {
  tilesPerSheet?: number;
  cols?: number;
}

export interface ComposeSheetOptions {
  inputDir: string;
  background?: { r: number; g: number; b: number; alpha: number };
  /** Output scale factor (1 = native screenshot size, 2 = 2× pixels). */
  scale?: number;
  /** Fixed image slot width in pixels before scale (default: Cypress viewport width). */
  tileWidth?: number;
  /** Fixed image slot height in pixels before scale (default: Cypress viewport height). */
  tileImageHeight?: number;
}

export interface WriteSheetsOptions {
  inputDir: string;
  outDir: string;
  scale?: number;
  tileWidth?: number;
  tileImageHeight?: number;
  concurrency?: number;
}

/** Maps a screenshot path to its diagram folder (prefix before the `*.spec.*` segment). */
export function deriveGroupKey(relPath: string): string {
  const parts = relPath.split('/');
  const specIdx = parts.findIndex((p) => SPEC_SEGMENT_RE.test(p));
  if (specIdx > 0) {
    return parts.slice(0, specIdx).join('/');
  }
  if (specIdx === 0) {
    return parts[0].replace(SPEC_SEGMENT_RE, '');
  }
  return parts.slice(0, -1).join('/') || 'root';
}

/** Groups, stable-sorts, and chunks screenshots into fixed-size grid sheets. */
export function planSheets(relPaths: string[], options: PlanSheetsOptions = {}): Sheet[] {
  const tilesPerSheet = options.tilesPerSheet ?? 12;
  const cols = options.cols ?? 3;

  const groups = new Map<string, string[]>();
  for (const p of relPaths) {
    const key = deriveGroupKey(p);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(p);
    } else {
      groups.set(key, [p]);
    }
  }

  const sheets: Sheet[] = [];
  for (const key of [...groups.keys()].sort()) {
    const tiles = [...(groups.get(key) ?? [])].sort();
    const basename = key.split('/').pop() ?? 'sheet';
    for (let start = 0; start < tiles.length; start += tilesPerSheet) {
      const chunk = tiles.slice(start, start + tilesPerSheet);
      const index = start / tilesPerSheet;
      const output = `${key}/${basename}-${String(index + 1).padStart(3, '0')}.png`;
      sheets.push({
        group: key,
        index,
        output,
        cols,
        tiles: chunk.map((source, i) => ({
          index: i,
          row: Math.floor(i / cols),
          col: i % cols,
          name:
            source
              .split('/')
              .pop()
              ?.replace(/\.png$/, '') ?? '',
          source,
        })),
      });
    }
  }
  return sheets;
}

/** Recursively collects PNG paths under `dir`, relative with forward slashes, sorted. */
export async function collectScreenshots(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.png'))
    .map((e) =>
      relative(dir, join(e.parentPath ?? e.path, e.name))
        .split(sep)
        .join('/')
    )
    .sort();
}

/** Composites one sheet into a deterministic PNG plus a tile manifest. */
export async function composeSheet(
  plan: Sheet,
  options: ComposeSheetOptions
): Promise<{ buffer: Buffer; manifest: SheetManifest }> {
  const { inputDir } = options;
  const background = options.background ?? { r: 255, g: 255, b: 255, alpha: 1 };
  const { cols } = plan;

  const scale = options.scale ?? 1;
  const baseCellWidth = options.tileWidth ?? DEFAULT_TILE_WIDTH;
  const baseImageHeight = options.tileImageHeight ?? DEFAULT_TILE_IMAGE_HEIGHT;
  const cellWidth = scaled(baseCellWidth, scale);
  const imageHeight = scaled(baseImageHeight, scale);
  const labelHeight = scaled(LABEL_HEIGHT, scale);
  const cellHeight = imageHeight + labelHeight;
  const labelFontSize = scaled(LABEL_FONT_SIZE, scale);
  const labelPadding = scaled(LABEL_PADDING, scale);
  const gridLineWidth = scaled(GRID_LINE_WIDTH, scale);
  const rows = Math.max(...plan.tiles.map((t) => t.row)) + 1;

  const tileBuffers = await Promise.all(
    plan.tiles.map((t) =>
      sharp(join(inputDir, t.source))
        .resize(cellWidth, imageHeight, {
          fit: 'inside',
          kernel: sharp.kernel.lanczos3,
        })
        .png({ compressionLevel: INTERMEDIATE_PNG_COMPRESSION })
        .toBuffer()
    )
  );

  // Label SVGs are composited directly; sharp rasterizes them in the sheet
  // pipeline, avoiding a per-tile PNG encode + decode round-trip.
  const composites = plan.tiles.flatMap((t, i) => [
    {
      input: createLabelSvg(
        formatTileTitle(t.name),
        cellWidth,
        labelHeight,
        labelFontSize,
        labelPadding
      ),
      left: t.col * cellWidth,
      top: t.row * cellHeight,
    },
    {
      input: tileBuffers[i],
      left: t.col * cellWidth,
      top: t.row * cellHeight + labelHeight,
    },
  ]);

  const sheetWidth = cellWidth * cols;
  const sheetHeight = cellHeight * rows;
  const gridBuffer = await getGridBuffer(
    sheetWidth,
    sheetHeight,
    cols,
    rows,
    cellWidth,
    cellHeight,
    gridLineWidth
  );

  const buffer = await sharp({
    create: { width: sheetWidth, height: sheetHeight, channels: 4, background },
  })
    .composite([...composites, { input: gridBuffer, left: 0, top: 0 }])
    .png({ compressionLevel: SHEET_PNG_COMPRESSION })
    .toBuffer();

  const manifest: SheetManifest = {
    sheet: plan.output,
    group: plan.group,
    grid: {
      cols,
      rows,
      cellWidth,
      cellHeight,
      imageHeight,
      labelHeight,
      scale,
    },
    tiles: plan.tiles.map((t) => ({
      index: t.index,
      row: t.row,
      col: t.col,
      name: t.name,
      source: t.source,
      title: formatTileTitle(t.name),
    })),
  };

  return { buffer, manifest };
}

/** Writes composite PNGs and sibling `.json` manifests under outDir. */
export async function writeSheets(plans: Sheet[], options: WriteSheetsOptions): Promise<void> {
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_SHEET_CONCURRENCY);
  const writeOne = async (plan: Sheet): Promise<void> => {
    const { buffer, manifest } = await composeSheet(plan, {
      inputDir: options.inputDir,
      scale: options.scale,
      tileWidth: options.tileWidth,
      tileImageHeight: options.tileImageHeight,
    });
    const sheetPath = join(options.outDir, plan.output);
    await mkdir(dirname(sheetPath), { recursive: true });
    await writeFile(sheetPath, buffer);
    await writeFile(sheetPath.replace(/\.png$/, '.json'), JSON.stringify(manifest, null, 2) + '\n');
  };
  for (let start = 0; start < plans.length; start += concurrency) {
    await Promise.all(plans.slice(start, start + concurrency).map(writeOne));
  }
}

async function main(): Promise<void> {
  const inputDir = process.env.ARGOS_SCREENSHOT_DIR ?? 'cypress/screenshots';
  const outDir = process.env.ARGOS_SHEETS_DIR ?? 'cypress/argos-sheets';
  const tilesPerSheet = Number(process.env.ARGOS_TILES_PER_SHEET ?? 12);
  const cols = Number(process.env.ARGOS_SHEET_COLS ?? 3);
  const scale = Number(process.env.ARGOS_SHEET_SCALE ?? DEFAULT_SHEET_SCALE);
  const tileWidth = Number(process.env.ARGOS_TILE_WIDTH ?? DEFAULT_TILE_WIDTH);
  const tileImageHeight = Number(process.env.ARGOS_TILE_IMAGE_HEIGHT ?? DEFAULT_TILE_IMAGE_HEIGHT);
  const concurrency = Number(process.env.ARGOS_SHEET_CONCURRENCY ?? DEFAULT_SHEET_CONCURRENCY);

  const relPaths = await collectScreenshots(inputDir);
  const plans = planSheets(relPaths, { tilesPerSheet, cols });
  await writeSheets(plans, { inputDir, outDir, scale, tileWidth, tileImageHeight, concurrency });
  process.stdout.write(
    `[argos-batch] ${relPaths.length} screenshots → ${plans.length} sheets in ${outDir}\n`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
