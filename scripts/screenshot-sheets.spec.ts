import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  argosMetadataSidecarPath,
  readTileOrigins,
  writeArgosMetadataSidecar,
} from '../e2e/helpers/argos-metadata.js';
import {
  collectScreenshots,
  composeSheet,
  DEFAULT_TILE_IMAGE_HEIGHT,
  DEFAULT_TILE_WIDTH,
  deriveGroupKey,
  ensureSheetMetadataSidecars,
  findUnordered,
  formatTileTitle,
  LABEL_HEIGHT,
  planSheets,
  updateOrder,
  writeSheets,
} from './screenshot-sheets.js';

const SLOT_WIDTH = 40;
const SLOT_HEIGHT = 30;

const FC = 'rendering/flowchart';
const CLS = 'rendering/class';

const FC_V2 = `${FC}/flowchart-v2.spec.js`;
const FC_MAIN = `${FC}/flowchart.spec.js`;
const CLS_V3 = `${CLS}/classDiagram-v3.spec.js`;

describe('deriveGroupKey', () => {
  it('returns the path up to and including the *.spec.js segment', () => {
    expect(deriveGroupKey(`${FC_V2}/Some Test.png`)).toBe(FC_V2);
  });
  it('handles .spec.ts specs', () => {
    expect(deriveGroupKey('rendering/treemap/treemap.spec.ts/A.png')).toBe(
      'rendering/treemap/treemap.spec.ts'
    );
  });
  it('keeps each spec file in its own group, even within one folder', () => {
    expect(deriveGroupKey(`${FC_MAIN}/x.png`)).toBe(FC_MAIN);
    expect(deriveGroupKey(`${FC}/flowchart-elk.spec.js/y.png`)).toBe(`${FC}/flowchart-elk.spec.js`);
  });
  it('groups folder-structured mmd snapshots by their diagram folder', () => {
    // mmd screenshots mirror the fixture path (diagrams/<type>/<name>), so they
    // group by their containing folder — no spec segment, no name parsing.
    expect(deriveGroupKey('diagrams/packet/should-render-a-simple-packet-diagram.png')).toBe(
      'diagrams/packet'
    );
    // Hyphenated and nested folders are preserved as-is.
    expect(deriveGroupKey('diagrams/state-diagram-v2/forks.png')).toBe('diagrams/state-diagram-v2');
    expect(deriveGroupKey('diagrams/flowchart/elk/basic.png')).toBe('diagrams/flowchart/elk');
  });
});

describe('planSheets', () => {
  const paths = [`${FC_V2}/b.png`, `${FC_MAIN}/a.png`, `${CLS_V3}/c.png`];

  it('isolates each spec file into separate groups and sheets', () => {
    const sheets = planSheets(paths, { tilesPerSheet: 12, cols: 3 });
    const groups = sheets.map((s) => s.group);
    expect(groups).toContain(FC_V2);
    expect(groups).toContain(FC_MAIN);
    expect(groups).toContain(CLS_V3);
    // No sheet mixes two spec files.
    for (const s of sheets) {
      expect(s.tiles.every((t) => deriveGroupKey(t.source) === s.group)).toBe(true);
    }
  });

  it('is deterministic regardless of input order', () => {
    const a = planSheets(paths, { tilesPerSheet: 12, cols: 3 });
    const b = planSheets([...paths].reverse(), { tilesPerSheet: 12, cols: 3 });
    expect(a).toStrictEqual(b);
  });

  it('chunks a spec into fixed-size sheets', () => {
    const many = Array.from(
      { length: 13 },
      (_, i) => `${FC_MAIN}/t${String(i).padStart(2, '0')}.png`
    );
    const sheets = planSheets(many, { tilesPerSheet: 12, cols: 3 });
    expect(sheets).toHaveLength(2);
    expect(sheets[0].tiles).toHaveLength(12);
    expect(sheets[1].tiles).toHaveLength(1);
    expect(sheets[0].output).toBe(`${FC_MAIN}/flowchart-001.png`);
    expect(sheets[1].output).toBe(`${FC_MAIN}/flowchart-002.png`);
  });

  it('assigns row/col by column count', () => {
    const four = ['a', 'b', 'c', 'd'].map((n) => `${FC_MAIN}/${n}.png`);
    const [sheet] = planSheets(four, { tilesPerSheet: 12, cols: 3 });
    expect(sheet.tiles.map((t) => [t.row, t.col])).toStrictEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
    ]);
  });

  it('adding a test to one spec leaves other specs’ sheets byte-identical', () => {
    const before = planSheets(paths, { tilesPerSheet: 12, cols: 3 });
    const after = planSheets([...paths, `${FC_MAIN}/aa.png`], {
      tilesPerSheet: 12,
      cols: 3,
    });
    const clsBefore = before.filter((s) => s.group === CLS_V3);
    const clsAfter = after.filter((s) => s.group === CLS_V3);
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

  it('writes Argos metadata sidecars with one tile annotation per source', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'argos-out-'));
    const mmdDir = join(dir, 'diagrams/packet');
    await mkdir(mmdDir, { recursive: true });
    const mmdTile = 'diagrams/packet/simple-diagram.png';
    const mmdBuf = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 255, g: 255, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    await writeFile(join(dir, mmdTile), mmdBuf);
    await writeArgosMetadataSidecar(join(dir, mmdTile), {
      automationLibrary: { name: 'playwright', version: '1.0.0' },
      sdk: { name: '@argos-ci/cli', version: '5.0.0' },
      test: {
        title: 'simple diagram',
        annotations: [
          {
            type: 'mmd-fixture',
            description: 'e2e/diagrams/packet/simple-diagram.mmd',
            location: { file: 'e2e/diagrams/packet/simple-diagram.mmd', line: 1, column: 1 },
          },
        ],
      },
    });

    const [plan] = planSheets([mmdTile], { tilesPerSheet: 12, cols: 3 });
    await writeSheets([plan], {
      inputDir: dir,
      outDir,
      tileWidth: SLOT_WIDTH,
      tileImageHeight: SLOT_HEIGHT,
    });

    const sheetPath = join(outDir, plan.output);
    const sidecarPath = argosMetadataSidecarPath(sheetPath);
    await access(sidecarPath);
    const sidecar = JSON.parse(await readFile(sidecarPath, 'utf8'));
    expect(sidecar.test.annotations).toStrictEqual([
      {
        type: 'tile',
        description: 'R1 C1: e2e/diagrams/packet/simple-diagram.mmd',
        location: { file: 'e2e/diagrams/packet/simple-diagram.mmd', line: 1, column: 1 },
      },
    ]);

    await rm(outDir, { recursive: true, force: true });
  });

  it('regenerates sidecars from tile manifests via ensureSheetMetadataSidecars', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'argos-out-'));
    const mmdTile = 'diagrams/packet/simple-diagram.png';
    await mkdir(join(dir, 'diagrams/packet'), { recursive: true });
    await writeFile(
      join(dir, mmdTile),
      await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 4,
          background: { r: 0, g: 128, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer()
    );

    const [plan] = planSheets([mmdTile], { tilesPerSheet: 12, cols: 3 });
    await writeSheets([plan], {
      inputDir: dir,
      outDir,
      tileWidth: SLOT_WIDTH,
      tileImageHeight: SLOT_HEIGHT,
    });

    const sidecarPath = argosMetadataSidecarPath(join(outDir, plan.output));
    await rm(sidecarPath);

    expect(await ensureSheetMetadataSidecars(outDir)).toBe(1);
    const sidecar = JSON.parse(await readFile(sidecarPath, 'utf8'));
    expect(sidecar.test.annotations).toHaveLength(1);
    expect(sidecar.test.annotations[0].description).toContain('simple-diagram.mmd');

    await rm(outDir, { recursive: true, force: true });
  });

  it('preserves rich per-tile annotations (real spec file/line/column) through regeneration', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'argos-out-'));
    const specTile = 'rendering/flowchart/flowchart.spec.js/should-do-a-thing.png';
    await mkdir(join(dir, 'rendering/flowchart/flowchart.spec.js'), { recursive: true });
    await writeFile(
      join(dir, specTile),
      await sharp({
        create: { width: 10, height: 10, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 1 } },
      })
        .png()
        .toBuffer()
    );
    // Input sidecar carries the real test location (line/column ≠ 1) that pure
    // path inference cannot recover.
    await writeArgosMetadataSidecar(join(dir, specTile), {
      automationLibrary: { name: 'playwright', version: '1.0.0' },
      sdk: { name: '@argos-ci/cli', version: '5.0.0' },
      test: {
        title: 'should do a thing',
        titlePath: ['flowchart.spec.js', 'Flowchart', 'should do a thing'],
        annotations: [
          {
            type: 'test',
            description: 'Flowchart › should do a thing',
            location: { file: 'e2e/rendering/flowchart/flowchart.spec.js', line: 42, column: 7 },
          },
        ],
      },
    });

    const [plan] = planSheets([specTile], { tilesPerSheet: 12, cols: 3 });
    await writeSheets([plan], {
      inputDir: dir,
      outDir,
      tileWidth: SLOT_WIDTH,
      tileImageHeight: SLOT_HEIGHT,
    });

    const sidecarPath = argosMetadataSidecarPath(join(outDir, plan.output));
    await rm(sidecarPath);

    // Regeneration reads the manifest (source of truth) — it must NOT downgrade
    // the location to line 1 / column 1 the way path inference would.
    expect(await ensureSheetMetadataSidecars(outDir)).toBe(1);
    const sidecar = JSON.parse(await readFile(sidecarPath, 'utf8'));
    expect(sidecar.test.annotations).toStrictEqual([
      {
        type: 'tile',
        description: 'R1 C1: Flowchart › should do a thing',
        location: { file: 'e2e/rendering/flowchart/flowchart.spec.js', line: 42, column: 7 },
      },
    ]);

    await rm(outDir, { recursive: true, force: true });
  });
});

describe('append-only tile order', () => {
  // The order manifest is keyed by group (deriveGroupKey) with the group prefix
  // stripped, so a per-spec group's tiles are bare filenames.
  const tiles = (n: number, prefix = 'a'): string[] =>
    Array.from({ length: n }, (_, i) => `${FC_MAIN}/${prefix}-${String(i).padStart(3, '0')}.png`);

  const sheetSig = (paths: string[], order?: Record<string, string[]>): string[] =>
    planSheets(paths, { tilesPerSheet: 12, cols: 3, order }).map(
      (s) => `${s.group}#${s.index}:${s.tiles.map((t) => t.source).join(',')}`
    );

  it('updateOrder appends new sources at the group tail and drops removed ones', () => {
    const base = updateOrder(tiles(3));
    // Add z-new, remove a-000.
    const next = updateOrder(
      [`${FC_MAIN}/a-001.png`, `${FC_MAIN}/a-002.png`, `${FC_MAIN}/z-new.png`],
      base
    );
    expect(next[FC_MAIN]).toEqual([
      'a-001.png', // kept, original order
      'a-002.png',
      'z-new.png', // appended at the tail, not sorted into the middle
    ]);
  });

  it('inserting a mid-sorted tile leaves all prior sheets byte-identical (the churn fix)', () => {
    const initial = tiles(26); // 26 tiles, N=12 → sheets [0..11],[12..23],[24..25]
    const order = updateOrder(initial);
    const before = sheetSig(initial, order);

    const inserted = `${FC_MAIN}/a-005-INSERTED.png`; // name sorts into the middle
    const orderAfter = updateOrder([...initial, inserted], order); // append-only manifest
    const after = sheetSig([...initial, inserted], orderAfter);

    expect(after[0]).toBe(before[0]); // sheet 0 untouched
    expect(after[1]).toBe(before[1]); // sheet 1 untouched
    const changed = before.filter((s, i) => s !== after[i]).length + (after.length - before.length);
    expect(changed).toBeLessThanOrEqual(2);
  });

  it('alphabetical insertion (no manifest) shifts the tail — the problem this fixes', () => {
    const initial = tiles(26);
    const before = sheetSig(initial); // no order → alphabetical
    const inserted = `${FC_MAIN}/a-005-INSERTED.png`;
    const after = sheetSig([...initial, inserted]);
    const changed = before.filter((s, i) => s !== after[i]).length + (after.length - before.length);
    expect(changed).toBeGreaterThan(2);
  });

  it('findUnordered flags only sources absent from the manifest, grouped by key', () => {
    const order = updateOrder(tiles(2));
    expect(findUnordered([...tiles(2), `${FC_MAIN}/brand-new.png`], order)).toEqual({
      [FC_MAIN]: ['brand-new.png'],
    });
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

describe('declaration-order fallback for unpinned tiles', () => {
  // Every *.spec.* group is missing from the committed manifest today (it only
  // covers the mmd `diagrams/*` folders), so these groups take layoutGroup's
  // fallback on every run. Alphabetical there means a new test can take cell 1
  // and push every other tile one cell along; declaration order appends instead.
  const SPEC_FILE = `e2e/${FC_MAIN}`;

  /** Sources with their `test()` call line, as the capture sidecars record it. */
  const declared = (entries: [string, number][]) => ({
    sources: entries.map(([name]) => `${FC_MAIN}/${name}`),
    origins: new Map(
      entries.map(([name, line]) => [`${FC_MAIN}/${name}`, { file: SPEC_FILE, line, column: 3 }])
    ),
  });

  const cells = (
    sources: string[],
    origins?: Map<string, { file: string; line: number; column: number }>
  ) =>
    planSheets(sources, { tilesPerSheet: 12, cols: 3, origins }).flatMap((sheet) =>
      sheet.tiles.map((t) => t.name)
    );

  it('lays an unpinned group out in declaration order, not alphabetically', () => {
    const { sources, origins } = declared([
      ['zebra.png', 10],
      ['apple.png', 20],
      ['mango.png', 30],
    ]);
    expect(cells(sources, origins)).toEqual(['zebra', 'apple', 'mango']);
    expect(cells(sources)).toEqual(['apple', 'mango', 'zebra']); // today's fallback
  });

  it('a test added at the end of its spec appends, leaving every other tile in place', () => {
    const { sources, origins } = declared([
      ['basic-er-diagram.png', 10],
      ['crows-foot-notation.png', 20],
      ['zzz-last-one.png', 30],
    ]);
    const before = cells(sources, origins);

    // Alphabetically first, but declared last — the case that used to take cell 1.
    const added = `${FC_MAIN}/aaa-newly-added-test.png`;
    const after = cells(
      [...sources, added],
      new Map([...origins, [added, { file: SPEC_FILE, line: 40, column: 3 }]])
    );

    expect(after).toEqual([...before, 'aaa-newly-added-test']);
    expect(after.slice(0, before.length)).toEqual(before); // nothing shifted
  });

  it('keeps earlier sheets byte-identical when a test is appended to a multi-sheet group', () => {
    const entries: [string, number][] = Array.from({ length: 26 }, (_, i) => [
      `t-${String(i).padStart(3, '0')}.png`,
      (i + 1) * 10,
    ]);
    const { sources, origins } = declared(entries);
    const sig = (paths: string[], o: typeof origins) =>
      planSheets(paths, { tilesPerSheet: 12, cols: 3, origins: o }).map(
        (sheet) => `${sheet.group}#${sheet.index}:${sheet.tiles.map((t) => t.source).join(',')}`
      );

    const before = sig(sources, origins);
    const added = `${FC_MAIN}/aaa-appended.png`; // sorts first, declared last
    const after = sig(
      [...sources, added],
      new Map([...origins, [added, { file: SPEC_FILE, line: 999, column: 3 }]])
    );

    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
    expect(after).toHaveLength(before.length); // 27 tiles still fit in 3 sheets
    expect(after[2]).toBe(`${before[2]},${added}`);
  });

  it('falls back to path order for tiles sharing one call site (loop-registered tests)', () => {
    const { sources, origins } = declared([
      ['loop-b.png', 12],
      ['loop-a.png', 12],
      ['later.png', 20],
    ]);
    expect(cells(sources, origins)).toEqual(['loop-a', 'loop-b', 'later']);
  });

  it('leaves mmd fixture groups on alphabetical order (one runner call site for all)', () => {
    // mmd-snapshots.spec.ts registers every fixture from a single test() call, so
    // all of its captures report the same declaration position and tie — the mmd
    // `diagrams/*` groups (the only ones the committed manifest covers) keep the
    // layout they have today.
    const runner = { file: 'e2e/rendering/mmd-snapshots.spec.ts', line: 26, column: 5 };
    const fixtures = ['diagrams/packet/zebra.png', 'diagrams/packet/apple.png'];
    const origins = new Map(fixtures.map((f) => [f, runner]));
    const tiles = planSheets(fixtures, { tilesPerSheet: 12, cols: 3, origins })[0].tiles;
    expect(tiles.map((t) => t.source)).toEqual([...fixtures].sort());
  });

  it('sorts sidecar-less tiles after placed ones, alphabetically among themselves', () => {
    const { sources, origins } = declared([['declared.png', 10]]);
    const orphans = [`${FC_MAIN}/no-sidecar-b.png`, `${FC_MAIN}/no-sidecar-a.png`];
    expect(cells([...orphans, ...sources], origins)).toEqual([
      'declared',
      'no-sidecar-a',
      'no-sidecar-b',
    ]);
  });

  it('appends the unpinned tail of a manifest-pinned group in declaration order too', () => {
    const { sources, origins } = declared([
      ['pinned-a.png', 10],
      ['pinned-b.png', 20],
      ['new-zebra.png', 30],
      ['new-apple.png', 40],
    ]);
    const order = { [FC_MAIN]: ['pinned-a.png', 'pinned-b.png'] };
    const [sheet] = planSheets(sources, { tilesPerSheet: 12, cols: 3, order, origins });
    expect(sheet.tiles.map((t) => t.name)).toEqual([
      'pinned-a',
      'pinned-b',
      'new-zebra', // declared before new-apple, so it appends first
      'new-apple',
    ]);
  });

  it('updateOrder folds newly-seen screenshots in declaration order', () => {
    const { sources, origins } = declared([
      ['kept.png', 10],
      ['new-zebra.png', 20],
      ['new-apple.png', 30],
    ]);
    const next = updateOrder(sources, { [FC_MAIN]: ['kept.png'] }, origins);
    expect(next[FC_MAIN]).toEqual(['kept.png', 'new-zebra.png', 'new-apple.png']);
    // Without origins the same input sorts the new pair alphabetically.
    expect(updateOrder(sources, { [FC_MAIN]: ['kept.png'] })[FC_MAIN]).toEqual([
      'kept.png',
      'new-apple.png',
      'new-zebra.png',
    ]);
  });

  it('reads declaration positions from the capture sidecars on disk', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'argos-origins-'));
    const source = `${FC_MAIN}/a.png`;
    await mkdir(join(dir, FC_MAIN), { recursive: true });
    await writeArgosMetadataSidecar(join(dir, source), {
      $schema: 'https://api.argos-ci.com/v2/screenshot-metadata.json',
      test: {
        title: 'a',
        location: { file: SPEC_FILE, line: 42, column: 3 },
        annotations: [],
      },
      automationLibrary: { name: 'playwright', version: '1' },
      sdk: { name: '@argos-ci/cli', version: '1' },
    });
    await writeFile(join(dir, FC_MAIN, 'b.png.argos.json'), 'not json');

    const origins = readTileOrigins(dir, [source, `${FC_MAIN}/b.png`, `${FC_MAIN}/c.png`]);
    expect(origins.get(source)).toEqual({ file: SPEC_FILE, line: 42, column: 3 });
    expect(origins.has(`${FC_MAIN}/b.png`)).toBe(false); // corrupt sidecar
    expect(origins.has(`${FC_MAIN}/c.png`)).toBe(false); // no sidecar
    await rm(dir, { recursive: true, force: true });
  });
});

describe('blank cells for removed tests', () => {
  const order = { [FC_MAIN]: ['a.png', 'b.png', 'c.png'] };

  it('keeps a removed test’s slot as a blank tile (no shift of later tiles)', () => {
    // b removed; its group (the spec) still ran (a and c present).
    const present = [`${FC_MAIN}/a.png`, `${FC_MAIN}/c.png`];
    const [sheet] = planSheets(present, { tilesPerSheet: 12, cols: 3, order });
    expect(sheet.tiles.map((t) => [t.name, t.missing ?? false])).toEqual([
      ['a', false],
      ['b', true], // blank placeholder, keeps position 1
      ['c', false], // still at position 2 — not shifted up
    ]);
  });

  it('produces no sheet (no stray blanks) for a manifest group that did not run', () => {
    // Unlike the coarse-grouped upstream, our group key IS the scoping unit, so a
    // scoped-out group simply has no captured screenshots → no sheet, no blanks.
    const present = [`${FC_V2}/x.png`];
    const sheets = planSheets(present, { tilesPerSheet: 12, cols: 3, order });
    expect(sheets.map((s) => s.group)).toEqual([FC_V2]);
    expect(sheets.flatMap((s) => s.tiles).every((t) => !t.missing)).toBe(true);
  });

  it('composeSheet renders a missing tile as a blank cell without reading a file', async () => {
    const plan = planSheets([`${FC_MAIN}/a.png`, `${FC_MAIN}/c.png`], {
      tilesPerSheet: 12,
      cols: 3,
      order,
    })[0];
    // Empty inputDir: only present tiles would be read, so reading a missing tile
    // would throw. Mark every slot missing → pure blank-cell render.
    const emptyDir = await mkdtemp(join(tmpdir(), 'argos-missing-'));
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
