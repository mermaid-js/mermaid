import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canonicalScreenshotPath, buildSpecMap } from './argos-canonicalize-screenshots.ts';

const specMap = new Map<string, string>([
  ['stateDiagram.spec.js', 'rendering/state/stateDiagram.spec.js'],
  ['iconShape.spec.ts', 'rendering/iconShape.spec.ts'],
  ['xss.spec.js', 'other/xss.spec.js'],
]);

describe('canonicalScreenshotPath', () => {
  it('re-roots a stripped path to its true spec location', () => {
    expect(canonicalScreenshotPath('state/stateDiagram.spec.js/argos/State-foo.png', specMap)).toBe(
      'rendering/state/stateDiagram.spec.js/argos/State-foo.png'
    );
  });

  it('re-roots a fully-stripped path (spec dir only)', () => {
    expect(canonicalScreenshotPath('stateDiagram.spec.js/argos/State-foo.png', specMap)).toBe(
      'rendering/state/stateDiagram.spec.js/argos/State-foo.png'
    );
  });

  it('leaves an already-canonical path unchanged', () => {
    const p = 'rendering/state/stateDiagram.spec.js/argos/State-foo.png';
    expect(canonicalScreenshotPath(p, specMap)).toBe(p);
  });

  it('different stripped variants converge to the same canonical name (determinism)', () => {
    const variants = [
      'state/stateDiagram.spec.js/argos/x.png',
      'stateDiagram.spec.js/argos/x.png',
      'rendering/state/stateDiagram.spec.js/argos/x.png',
    ];
    const canon = variants.map((v) => canonicalScreenshotPath(v, specMap));
    expect(new Set(canon).size).toBe(1);
  });

  it('re-roots the .argos.json metadata sidecar alongside its png', () => {
    expect(
      canonicalScreenshotPath('state/stateDiagram.spec.js/argos/x.png.argos.json', specMap)
    ).toBe('rendering/state/stateDiagram.spec.js/argos/x.png.argos.json');
  });

  it('preserves nested names (test titles containing a slash)', () => {
    expect(canonicalScreenshotPath('state/stateDiagram.spec.js/argos/group/x.png', specMap)).toBe(
      'rendering/state/stateDiagram.spec.js/argos/group/x.png'
    );
  });

  it('leaves paths without an /argos/ marker untouched', () => {
    expect(canonicalScreenshotPath('rendering/state/state-001.png', specMap)).toBe(
      'rendering/state/state-001.png'
    );
  });

  it('leaves screenshots of unknown specs untouched', () => {
    const p = 'whatever/unknown.spec.js/argos/x.png';
    expect(canonicalScreenshotPath(p, specMap)).toBe(p);
  });
});

describe('buildSpecMap', () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'argos-specmap-'));
    await mkdir(join(dir, 'rendering/state'), { recursive: true });
    await writeFile(join(dir, 'rendering/state/stateDiagram.spec.js'), '');
    await mkdir(join(dir, 'other'), { recursive: true });
    await writeFile(join(dir, 'other/xss.spec.js'), '');
    await writeFile(join(dir, 'other/notaspec.js'), '');
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('maps each spec basename to its path relative to the integration dir', async () => {
    const map = await buildSpecMap(dir);
    expect(Object.fromEntries(map)).toEqual({
      'stateDiagram.spec.js': 'rendering/state/stateDiagram.spec.js',
      'xss.spec.js': 'other/xss.spec.js',
    });
  });
});
