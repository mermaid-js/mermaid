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
  updateOrder,
  findUnordered,
  LABEL_HEIGHT,
  DEFAULT_TILE_WIDTH,
  DEFAULT_TILE_IMAGE_HEIGHT,
} from './screenshot-sheets.ts';

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
    dir = await mkdtemp(join(tmpdir(), 'screenshot-sheets-'));
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

describe('append-only tile order', () => {
  // 26 flowchart tiles → with N=12 that's sheets [0..11], [12..23], [24..25].
  const tiles = (n: number, prefix = 'a') =>
    Array.from(
      { length: n },
      (_, i) => `${FC}/spec.spec.js/argos/${prefix}-${String(i).padStart(3, '0')}.png`
    );

  const sheetSig = (paths: string[], order?: Record<string, string[]>) =>
    planSheets(paths, { tilesPerSheet: 12, cols: 3, order }).map(
      (s) => `${s.group}#${s.index}:${s.tiles.map((t) => t.source).join(',')}`
    );

  it('updateOrder appends new sources at the group tail and drops removed ones', () => {
    const base = updateOrder(tiles(3));
    // add one, remove the first
    const next = updateOrder(
      [
        `${FC}/spec.spec.js/argos/a-001.png`,
        `${FC}/spec.spec.js/argos/a-002.png`,
        `${FC}/spec.spec.js/argos/z-new.png`,
      ],
      base
    );
    expect(next[FC]).toEqual([
      'spec.spec.js/argos/a-001.png', // kept, original order
      'spec.spec.js/argos/a-002.png',
      'spec.spec.js/argos/z-new.png', // appended at tail (not sorted into the middle)
    ]);
  });

  it('inserting a mid-sorted tile leaves all prior sheets byte-identical (the churn fix)', () => {
    const initial = tiles(26);
    const order = updateOrder(initial);
    const before = sheetSig(initial, order);

    // A new tile whose NAME sorts into the middle ('m-...' < many 'a-0xx'? no — pick one that sorts early)
    const inserted = `${FC}/spec.spec.js/argos/a-005-INSERTED.png`;
    const orderAfter = updateOrder([...initial, inserted], order); // append-only manifest
    const after = sheetSig([...initial, inserted], orderAfter);

    // Append-only: only the last sheet changes; sheets 0..1 are untouched.
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
    const changed = before.filter((s, i) => s !== after[i]).length + (after.length - before.length);
    expect(changed).toBeLessThanOrEqual(2);
  });

  it('alphabetical insertion (no manifest) shifts the tail — demonstrates the problem it fixes', () => {
    const initial = tiles(26);
    const before = sheetSig(initial); // no order → alphabetical
    const inserted = `${FC}/spec.spec.js/argos/a-005-INSERTED.png`;
    const after = sheetSig([...initial, inserted]); // still alphabetical
    // The inserted tile lands mid-list and pushes the tail across sheet boundaries.
    const changed = before.filter((s, i) => s !== after[i]).length + (after.length - before.length);
    expect(changed).toBeGreaterThan(2);
  });

  it('findUnordered flags only sources absent from the manifest, grouped by key', () => {
    const order = updateOrder(tiles(2));
    const withNew = [...tiles(2), `${FC}/spec.spec.js/argos/brand-new.png`];
    expect(findUnordered(withNew, order)).toEqual({ [FC]: ['spec.spec.js/argos/brand-new.png'] });
    expect(findUnordered(tiles(2), order)).toEqual({});
  });

  it('planSheets without an order is unchanged (alphabetical fallback)', () => {
    const paths = tiles(5).reverse();
    const fallback = planSheets(paths, { tilesPerSheet: 12, cols: 3 });
    const empty = planSheets(paths, { tilesPerSheet: 12, cols: 3, order: {} });
    expect(fallback[0].tiles.map((t) => t.source)).toEqual(empty[0].tiles.map((t) => t.source));
    expect(fallback[0].tiles.map((t) => t.source)).toEqual([...paths].sort());
  });
});

describe('empty cells for removed tests', () => {
  const order = {
    [FC]: ['s.spec.js/argos/a.png', 's.spec.js/argos/b.png', 's.spec.js/argos/c.png'],
  };

  it('keeps a removed test’s slot as a blank tile (no shift of later tiles)', () => {
    // b removed; its spec `s` still ran (a and c present).
    const present = [`${FC}/s.spec.js/argos/a.png`, `${FC}/s.spec.js/argos/c.png`];
    const [sheet] = planSheets(present, { tilesPerSheet: 12, cols: 3, order });
    expect(sheet.tiles.map((t) => [t.name, t.missing ?? false])).toEqual([
      ['a', false],
      ['b', true], // blank placeholder, keeps position 1
      ['c', false], // still at position 2 — not shifted up
    ]);
  });

  it('drops manifest tiles whose spec did not run (scoped run — no stray blanks)', () => {
    // Only spec `t` captured; spec `s` (the whole manifest) didn't run.
    const present = [`${FC}/t.spec.js/argos/x.png`];
    const [sheet] = planSheets(present, { tilesPerSheet: 12, cols: 3, order });
    expect(sheet.tiles.map((t) => t.name)).toEqual(['x']); // no a/b/c blanks
    expect(sheet.tiles.every((t) => !t.missing)).toBe(true);
  });

  it('composeSheet renders a missing tile as a blank cell without reading a file', async () => {
    const plan = planSheets([`${FC}/s.spec.js/argos/a.png`, `${FC}/s.spec.js/argos/c.png`], {
      tilesPerSheet: 12,
      cols: 3,
      order,
    })[0];
    // inputDir intentionally empty: only present tiles would be read, and there
    // are none on disk — so this throws if it tries to read a missing tile.
    const emptyDir = await mkdtemp(join(tmpdir(), 'screenshot-sheets-missing-'));
    // Drop the present tiles so every slot is missing → pure blank-cell render.
    const blankPlan = { ...plan, tiles: plan.tiles.map((t) => ({ ...t, missing: true })) };
    const { buffer, manifest } = await composeSheet(blankPlan, {
      inputDir: emptyDir,
      tileWidth: SLOT_WIDTH,
      tileImageHeight: SLOT_HEIGHT,
    });
    expect((await sharp(buffer).metadata()).width).toBe(SLOT_WIDTH * 3);
    expect(manifest.tiles.every((t) => t.missing)).toBe(true);
    await rm(emptyDir, { recursive: true, force: true });
  });
});
