/**
 * Batches per-test Playwright screenshots into composite "sheets" for Argos,
 * grouping by test file so a new test in one spec never alters another spec's
 * sheets. Pure planning is separated from sharp-backed compositing so the
 * grouping/ordering rules can be unit-tested without images.
 *
 * CLI usage:
 *   pnpm run argos:batch
 *   ARGOS_SCREENSHOT_DIR=e2e/argos-screenshots ARGOS_SHEETS_DIR=e2e/argos-sheets
 *     ARGOS_TILES_PER_SHEET=12 ARGOS_SHEET_COLS=3 ARGOS_SHEET_SCALE=2
 *     ARGOS_TILE_WIDTH=1440 ARGOS_TILE_IMAGE_HEIGHT=1024 pnpm run argos:batch
 */

import { readdir, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  annotateTilePosition,
  annotationFromScreenshotRelPath,
  buildSheetMetadata,
  formatTileTitle,
  listRelativeFiles,
  readTileAnnotation,
  verifyArgosMetadataSidecars,
  writeArgosMetadataSidecar,
} from '../e2e/helpers/argos-metadata.ts';
import type {
  ArgosScreenshotMetadata,
  ArgosTestAnnotation,
} from '../e2e/helpers/argos-metadata.ts';

export { formatTileTitle };

// Matches a Cypress spec-file path segment: foo.spec.js / foo.spec.ts / .cjs / .mts
const SPEC_SEGMENT_RE = /\.spec\.[cm]?[jt]s$/;

/** Fixed label band under each screenshot tile (deterministic grid sizing). */
export const LABEL_HEIGHT = 48;
/** Matches cypress.config.ts viewport — every cell uses this slot, not max(tile). */
export const DEFAULT_TILE_WIDTH = 1440;
export const DEFAULT_TILE_IMAGE_HEIGHT = 1024;
// Sized for the 1440px-wide cell: a small font has too few pixels per glyph and
// reads as pixelated when the sheet is zoomed.
const LABEL_FONT_SIZE = 28;
const LABEL_PADDING = 10;
const GRID_LINE_WIDTH = 1;
/** Inset (px, before scale) between a tile image and its cell edges/label. */
const CELL_PADDING = 16;
const GRID_LINE_COLOR = '#cccccc';
/** Default output scale for composite sheets (1 = native pixel dimensions). */
export const DEFAULT_SHEET_SCALE = 1;
/** Default sheets composited concurrently (bounded so memory stays sane). */
export const DEFAULT_SHEET_CONCURRENCY = 4;
/** zlib level for the final written sheet — uploaded then discarded, so size barely matters. */
const SHEET_PNG_COMPRESSION = 3;

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
  /**
   * Per-tile metadata, including the resolved Argos annotation. The annotation
   * is the source of truth for the grid cell → mmd/test mapping, so sidecars can
   * be regenerated (e.g. before upload) without re-reading the input screenshots.
   */
  tiles: (Tile & { title: string; annotation: ArgosTestAnnotation })[];
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

interface OverlayTile {
  col: number;
  row: number;
  title: string;
}

interface OverlayOptions {
  width: number;
  height: number;
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  labelFontSize: number;
  labelPadding: number;
  lineWidth: number;
  tiles: readonly OverlayTile[];
}

/**
 * One SVG overlay for the whole sheet — every grid line, the outer border, and
 * every tile's title label. Compositing this single buffer rasterizes the chrome
 * in one pass, instead of a separate SVG per tile label plus a grid buffer
 * (which scaled with the tile count). Labels sit on the white sheet background,
 * and the overlay is composited last so grid lines stay on top.
 */
function buildSheetOverlaySvg(o: OverlayOptions): Buffer {
  const lines: string[] = [];
  for (let c = 1; c < o.cols; c++) {
    const x = c * o.cellWidth;
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${o.height}"/>`);
  }
  for (let r = 1; r < o.rows; r++) {
    const y = r * o.cellHeight;
    lines.push(`<line x1="0" y1="${y}" x2="${o.width}" y2="${y}"/>`);
  }
  const inset = o.lineWidth / 2;
  const border = `<rect x="${inset}" y="${inset}" width="${o.width - o.lineWidth}" height="${o.height - o.lineWidth}"/>`;

  const labels = o.tiles.map((t) => {
    const x = t.col * o.cellWidth + o.labelPadding;
    const y = t.row * o.cellHeight + o.labelFontSize + o.labelPadding;
    const text = escapeXml(truncateTitle(t.title, o.cellWidth, o.labelFontSize, o.labelPadding));
    return `<text x="${x}" y="${y}">${text}</text>`;
  });

  const svg = [
    `<svg width="${o.width}" height="${o.height}" xmlns="http://www.w3.org/2000/svg">`,
    // Grid lines + border share one stroke style.
    `<g fill="none" stroke="${GRID_LINE_COLOR}" stroke-width="${o.lineWidth}">${lines.join('')}${border}</g>`,
    // Labels share one text style.
    `<g font-family="sans-serif" font-size="${o.labelFontSize}" fill="#333333">${labels.join('')}</g>`,
    `</svg>`,
  ].join('');
  return Buffer.from(svg);
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
  /** Called after each sheet is written, for progress reporting. */
  onSheetWritten?: (output: string, written: number, total: number) => void;
}

/**
 * Maps a screenshot path to its group key. Spec-based screenshots group by the
 * path up to and including the `*.spec.*` segment. mmd-snapshot screenshots are
 * written under a folder that mirrors the fixture's storage (e.g.
 * `diagrams/<type>/<name>.png` — see util.ts `screenshotPath`), so they have no
 * spec segment and group by their containing folder, preserving the diagram
 * folder structure (including hyphenated and nested folders).
 */
export function deriveGroupKey(relPath: string): string {
  const parts = relPath.split('/');
  const specIdx = parts.findIndex((p) => SPEC_SEGMENT_RE.test(p));
  if (specIdx >= 0) {
    return parts.slice(0, specIdx + 1).join('/');
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
    const basename = (key.split('/').pop() ?? 'sheet').replace(SPEC_SEGMENT_RE, '');
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
  return listRelativeFiles(dir, (name) => name.endsWith('.png'));
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
  const cellPadding = scaled(CELL_PADDING, scale);
  const rows = Math.max(...plan.tiles.map((t) => t.row)) + 1;

  // The image sits in a padded box inside the cell's image area, so diagrams
  // don't touch the grid lines or the label.
  const contentWidth = Math.max(1, cellWidth - 2 * cellPadding);
  const contentHeight = Math.max(1, imageHeight - 2 * cellPadding);

  // Enlarge each screenshot to fill the padded box: `fit: 'inside'` scales it up
  // (or down) to the largest size that fits while preserving aspect ratio (sharp
  // enlarges by default — `withoutEnlargement` is off). Decode to raw pixels (not
  // PNG) so the sheet composite below consumes them directly, skipping a per-tile
  // PNG encode + re-decode round-trip. `info` carries the resolved dimensions and
  // channel count needed to place and re-wrap each buffer.
  const tileBuffers = await Promise.all(
    plan.tiles.map((t) =>
      sharp(join(inputDir, t.source))
        .resize(contentWidth, contentHeight, {
          fit: 'inside',
          kernel: sharp.kernel.lanczos3,
        })
        .raw()
        .toBuffer({ resolveWithObject: true })
    )
  );

  const sheetWidth = cellWidth * cols;
  const sheetHeight = cellHeight * rows;

  // Tile images, each centered in its padded box below the label.
  const tileComposites = plan.tiles.map((t, i) => {
    const { data, info } = tileBuffers[i];
    return {
      input: data,
      raw: { width: info.width, height: info.height, channels: info.channels },
      left: t.col * cellWidth + cellPadding + Math.round((contentWidth - info.width) / 2),
      top:
        t.row * cellHeight +
        labelHeight +
        cellPadding +
        Math.round((contentHeight - info.height) / 2),
    };
  });

  // All grid lines, border, and labels in a single overlay rasterized once.
  const overlay = buildSheetOverlaySvg({
    width: sheetWidth,
    height: sheetHeight,
    cols,
    rows,
    cellWidth,
    cellHeight,
    labelFontSize,
    labelPadding,
    lineWidth: gridLineWidth,
    tiles: plan.tiles.map((t) => ({ col: t.col, row: t.row, title: formatTileTitle(t.name) })),
  });

  const buffer = await sharp({
    create: { width: sheetWidth, height: sheetHeight, channels: 4, background },
  })
    .composite([...tileComposites, { input: overlay, left: 0, top: 0 }])
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
      // Resolve the rich annotation (real spec file/line/column when an input
      // sidecar exists) once, here, so it is persisted in the manifest.
      annotation: readTileAnnotation(inputDir, t.source),
    })),
  };

  return { buffer, manifest };
}

/** Build a sheet's Argos sidecar metadata from its tile manifest (the source of truth). */
function sheetMetadataFromManifest(manifest: SheetManifest): ArgosScreenshotMetadata {
  const sheetBasename =
    manifest.sheet
      .split('/')
      .pop()
      ?.replace(/\.png$/, '') ?? manifest.sheet;
  const tileAnnotations = manifest.tiles.map((tile) =>
    annotateTilePosition(
      tile.row,
      tile.col,
      // Pre-annotation manifests (older artifacts) lack the resolved annotation;
      // fall back to path inference for them.
      tile.annotation ?? annotationFromScreenshotRelPath(tile.source)
    )
  );
  return buildSheetMetadata({ group: manifest.group, sheetBasename, tileAnnotations });
}

/** Recursively collects sheet tile manifest paths (`*.json` with a sibling PNG). */
export async function collectSheetManifests(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const toRel = (e: (typeof entries)[number]): string =>
    relative(dir, join(e.parentPath ?? e.path, e.name))
      .split(sep)
      .join('/');
  // Build the PNG set from the same walk so the sibling-PNG check needs no extra stat per manifest.
  const pngs = new Set(entries.filter((e) => e.isFile() && e.name.endsWith('.png')).map(toRel));
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.json') && !e.name.endsWith('.argos.json'))
    .map(toRel)
    .filter((manifestRel) => pngs.has(manifestRel.replace(/\.json$/, '.png')))
    .sort();
}

/**
 * (Re)write `.png.argos.json` sidecars from tile manifests. Manifests carry the
 * resolved annotation, so this reproduces the sidecars losslessly (without the
 * input screenshots) — e.g. as a pre-upload safety net.
 */
export async function ensureSheetMetadataSidecars(outDir: string): Promise<number> {
  const manifests = await collectSheetManifests(outDir);
  let written = 0;
  for (const manifestRel of manifests) {
    const manifest = JSON.parse(await readFile(join(outDir, manifestRel), 'utf8')) as SheetManifest;
    await writeArgosMetadataSidecar(
      join(outDir, manifest.sheet),
      sheetMetadataFromManifest(manifest)
    );
    written += 1;
  }
  return written;
}

/** Writes composite PNGs, tile manifests (`.json`), and Argos metadata sidecars. */
export async function writeSheets(plans: Sheet[], options: WriteSheetsOptions): Promise<void> {
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_SHEET_CONCURRENCY);
  let written = 0;
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
    await writeArgosMetadataSidecar(sheetPath, sheetMetadataFromManifest(manifest));

    // Single-threaded increment between awaits, so the count is consistent even
    // though sheets within a batch complete in nondeterministic order.
    options.onSheetWritten?.(plan.output, (written += 1), plans.length);
  };
  for (let start = 0; start < plans.length; start += concurrency) {
    await Promise.all(plans.slice(start, start + concurrency).map(writeOne));
  }
}

/** Progress/diagnostic logging for the CLI run (stdout, so it shows in CI logs). */
function log(message: string): void {
  process.stdout.write(`[argos-batch] ${message}\n`);
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  const inputDir = process.env.ARGOS_SCREENSHOT_DIR ?? 'e2e/argos-screenshots';
  const outDir = process.env.ARGOS_SHEETS_DIR ?? 'e2e/argos-sheets';
  const tilesPerSheet = Number(process.env.ARGOS_TILES_PER_SHEET ?? 12);
  const cols = Number(process.env.ARGOS_SHEET_COLS ?? 3);
  const scale = Number(process.env.ARGOS_SHEET_SCALE ?? DEFAULT_SHEET_SCALE);
  const tileWidth = Number(process.env.ARGOS_TILE_WIDTH ?? DEFAULT_TILE_WIDTH);
  const tileImageHeight = Number(process.env.ARGOS_TILE_IMAGE_HEIGHT ?? DEFAULT_TILE_IMAGE_HEIGHT);
  const concurrency = Number(process.env.ARGOS_SHEET_CONCURRENCY ?? DEFAULT_SHEET_CONCURRENCY);

  log(
    `config: in=${inputDir} out=${outDir} tilesPerSheet=${tilesPerSheet} cols=${cols} scale=${scale} concurrency=${concurrency}`
  );

  const relPaths = await collectScreenshots(inputDir);
  log(`collected ${relPaths.length} screenshots from ${inputDir}`);

  const plans = planSheets(relPaths, { tilesPerSheet, cols });
  const groupCount = new Set(plans.map((p) => p.group)).size;
  if (plans.length === 0) {
    log('no screenshots found — nothing to composite');
    return;
  }
  log(`planned ${plans.length} sheets across ${groupCount} groups`);

  await writeSheets(plans, {
    inputDir,
    outDir,
    scale,
    tileWidth,
    tileImageHeight,
    concurrency,
    onSheetWritten: (output, written, total) => log(`wrote [${written}/${total}] ${output}`),
  });

  // writeSheets already wrote each sidecar from the manifest; just verify them.
  const metaCheck = await verifyArgosMetadataSidecars(outDir);
  log(
    `metadata check: ${metaCheck.withAnnotations}/${metaCheck.pngs} sheets with tile annotations` +
      (metaCheck.missingSidecars.length
        ? `, missing sidecars: ${metaCheck.missingSidecars.slice(0, 3).join(', ')}`
        : '')
  );
  if (
    metaCheck.missingSidecars.length > 0 ||
    metaCheck.corruptSidecars.length > 0 ||
    metaCheck.emptyAnnotations.length > 0
  ) {
    throw new Error(
      `Argos metadata incomplete: ${metaCheck.missingSidecars.length} missing sidecars, ` +
        `${metaCheck.corruptSidecars.length} corrupt, ${metaCheck.emptyAnnotations.length} without annotations`
    );
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  log(`done in ${seconds}s: ${relPaths.length} screenshots → ${plans.length} sheets in ${outDir}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
