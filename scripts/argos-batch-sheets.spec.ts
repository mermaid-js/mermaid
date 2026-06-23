import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  deriveGroupKey,
  planSheets,
  collectScreenshots,
  composeSheet,
  writeSheets,
  ensureSheetMetadataSidecars,
  formatTileTitle,
  LABEL_HEIGHT,
  DEFAULT_TILE_WIDTH,
  DEFAULT_TILE_IMAGE_HEIGHT,
} from './argos-batch-sheets.ts';
import {
  argosMetadataSidecarPath,
  writeArgosMetadataSidecar,
} from '../e2e/helpers/argos-metadata.ts';

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
