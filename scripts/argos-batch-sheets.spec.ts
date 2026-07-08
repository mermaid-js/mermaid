import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  deriveGroupKey,
  planSheets,
  collectScreenshots,
  composeSheet,
  formatTileTitle,
  LABEL_HEIGHT,
  DEFAULT_TILE_WIDTH,
  DEFAULT_TILE_IMAGE_HEIGHT,
} from './argos-batch-sheets.ts';

const SLOT_WIDTH = 40;
const SLOT_HEIGHT = 30;

const FC = 'rendering/flowchart';
const CLS = 'rendering/class';

describe('deriveGroupKey', () => {
  it('returns the folder before the *.spec.js directory segment', () => {
    expect(deriveGroupKey('rendering/flowchart/flowchart-v2.spec.js/Some Test.png')).toBe(FC);
  });
  it('handles .spec.ts specs', () => {
    expect(deriveGroupKey('rendering/treemap/treemap.spec.ts/A.png')).toBe('rendering/treemap');
  });
  it('groups every spec file in a folder under the same key', () => {
    expect(deriveGroupKey('rendering/flowchart/flowchart.spec.js/x.png')).toBe(FC);
    expect(deriveGroupKey('rendering/flowchart/flowchart-elk.spec.js/y.png')).toBe(FC);
  });
});

describe('planSheets', () => {
  const paths = [
    `${FC}/flowchart-v2.spec.js/b.png`,
    `${FC}/flowchart.spec.js/a.png`,
    `${CLS}/classDiagram-v3.spec.js/c.png`,
  ];

  it('isolates diagrams into separate groups and sheets', () => {
    const sheets = planSheets(paths, { tilesPerSheet: 12, cols: 3 });
    const groups = sheets.map((s) => s.group);
    expect(groups).toContain(FC);
    expect(groups).toContain(CLS);
    // No sheet mixes two diagrams.
    for (const s of sheets) {
      expect(s.tiles.every((t) => deriveGroupKey(t.source) === s.group)).toBe(true);
    }
  });

  it('is deterministic regardless of input order', () => {
    const a = planSheets(paths, { tilesPerSheet: 12, cols: 3 });
    const b = planSheets([...paths].reverse(), { tilesPerSheet: 12, cols: 3 });
    expect(a).toStrictEqual(b);
  });

  it('chunks a folder into fixed-size sheets', () => {
    const many = Array.from(
      { length: 13 },
      (_, i) => `${FC}/flowchart.spec.js/t${String(i).padStart(2, '0')}.png`
    );
    const sheets = planSheets(many, { tilesPerSheet: 12, cols: 3 });
    expect(sheets).toHaveLength(2);
    expect(sheets[0].tiles).toHaveLength(12);
    expect(sheets[1].tiles).toHaveLength(1);
    expect(sheets[0].output).toBe(`${FC}/flowchart-001.png`);
    expect(sheets[1].output).toBe(`${FC}/flowchart-002.png`);
  });

  it('assigns row/col by column count', () => {
    const four = ['a', 'b', 'c', 'd'].map((n) => `${FC}/flowchart.spec.js/${n}.png`);
    const [sheet] = planSheets(four, { tilesPerSheet: 12, cols: 3 });
    expect(sheet.tiles.map((t) => [t.row, t.col])).toStrictEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
    ]);
  });

  it('adding a test to one diagram leaves other diagrams’ sheets byte-identical', () => {
    const before = planSheets(paths, { tilesPerSheet: 12, cols: 3 });
    const after = planSheets([...paths, `${FC}/flowchart.spec.js/aa.png`], {
      tilesPerSheet: 12,
      cols: 3,
    });
    const clsBefore = before.filter((s) => s.group === CLS);
    const clsAfter = after.filter((s) => s.group === CLS);
    expect(clsAfter).toStrictEqual(clsBefore);
  });
});

describe('formatTileTitle', () => {
  it('restores spaces from hyphenated Cypress screenshot names', () => {
    expect(formatTileTitle('1-should-render-a-basic-treemap')).toBe(
      '1 should render a basic treemap'
    );
  });
});

describe('compositor', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'argos-batch-'));
    const specDir = join(dir, 'rendering/flowchart/flowchart.spec.js');
    await mkdir(specDir, { recursive: true });
    // Three differently-sized solid PNGs.
    const tiles = [
      { name: 'a.png', w: 20, h: 10, c: { r: 255, g: 0, b: 0, alpha: 1 } },
      { name: 'b.png', w: 10, h: 30, c: { r: 0, g: 255, b: 0, alpha: 1 } },
      { name: 'c.png', w: 40, h: 15, c: { r: 0, g: 0, b: 255, alpha: 1 } },
    ];
    for (const t of tiles) {
      const buf = await sharp({
        create: { width: t.w, height: t.h, channels: 4, background: t.c },
      })
        .png()
        .toBuffer();
      await writeFile(join(specDir, t.name), buf);
    }
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('collectScreenshots returns sorted relative png paths', async () => {
    const paths = await collectScreenshots(dir);
    expect(paths).toStrictEqual([
      'rendering/flowchart/flowchart.spec.js/a.png',
      'rendering/flowchart/flowchart.spec.js/b.png',
      'rendering/flowchart/flowchart.spec.js/c.png',
    ]);
  });

  it('composes a fixed viewport cell grid with title labels', async () => {
    const paths = await collectScreenshots(dir);
    const [plan] = planSheets(paths, { tilesPerSheet: 12, cols: 3 });
    const slot = { tileWidth: SLOT_WIDTH, tileImageHeight: SLOT_HEIGHT };
    const { buffer, manifest } = await composeSheet(plan, { inputDir: dir, ...slot });
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(SLOT_WIDTH * 3);
    expect(meta.height).toBe(SLOT_HEIGHT + LABEL_HEIGHT);
    expect(manifest.grid).toStrictEqual({
      cols: 3,
      rows: 1,
      cellWidth: SLOT_WIDTH,
      cellHeight: SLOT_HEIGHT + LABEL_HEIGHT,
      imageHeight: SLOT_HEIGHT,
      labelHeight: LABEL_HEIGHT,
      scale: 1,
    });
    expect(manifest.tiles[0]).toMatchObject({ name: 'a', title: 'a', row: 0, col: 0 });
  });

  it('keeps grid dimensions when tile screenshot sizes differ', async () => {
    const specDir = join(dir, 'rendering/flowchart/flowchart.spec.js');
    const huge = await sharp({
      create: { width: 200, height: 150, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer();
    await writeFile(join(specDir, 'huge.png'), huge);

    const slot = { tileWidth: SLOT_WIDTH, tileImageHeight: SLOT_HEIGHT };
    const [smallPlan] = planSheets(['rendering/flowchart/flowchart.spec.js/a.png'], {
      tilesPerSheet: 12,
      cols: 3,
    });
    const [hugePlan] = planSheets(['rendering/flowchart/flowchart.spec.js/huge.png'], {
      tilesPerSheet: 12,
      cols: 3,
    });

    const small = await composeSheet(smallPlan, { inputDir: dir, ...slot });
    const withHuge = await composeSheet(hugePlan, { inputDir: dir, ...slot });

    expect(withHuge.manifest.grid).toStrictEqual(small.manifest.grid);
  });

  it('defaults to the Cypress viewport slot size', () => {
    expect(DEFAULT_TILE_WIDTH).toBe(1440);
    expect(DEFAULT_TILE_IMAGE_HEIGHT).toBe(1024);
  });

  it('scales output dimensions when scale > 1', async () => {
    const paths = (await collectScreenshots(dir)).filter((p) => !p.endsWith('huge.png'));
    const [plan] = planSheets(paths, { tilesPerSheet: 12, cols: 3 });
    const slot = { tileWidth: SLOT_WIDTH, tileImageHeight: SLOT_HEIGHT, scale: 2 as const };
    const { buffer, manifest } = await composeSheet(plan, { inputDir: dir, ...slot });
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(SLOT_WIDTH * 3 * 2);
    expect(meta.height).toBe((SLOT_HEIGHT + LABEL_HEIGHT) * 2);
    expect(manifest.grid.scale).toBe(2);
    expect(manifest.grid.cellWidth).toBe(SLOT_WIDTH * 2);
  });

  it('produces byte-identical output on re-run (determinism)', async () => {
    const paths = (await collectScreenshots(dir)).filter((p) => !p.endsWith('huge.png'));
    const [plan] = planSheets(paths, { tilesPerSheet: 12, cols: 3 });
    const slot = { tileWidth: SLOT_WIDTH, tileImageHeight: SLOT_HEIGHT };
    const first = await composeSheet(plan, { inputDir: dir, ...slot });
    const second = await composeSheet(plan, { inputDir: dir, ...slot });
    expect(first.buffer.equals(second.buffer)).toBe(true);
  });
});
