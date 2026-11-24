import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const RENDERING_UTIL = dirname(fileURLToPath(import.meta.url));

// The shape layer is where a diagram's shapes are defined and registered by id.
const SHAPE_LAYER = [join('rendering-elements', 'shapes.ts'), join('rendering-elements', 'shapes')];

const DIAGRAM_SHAPE_ID = /["'`]bpmn-/;

function sourcesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? sourcesUnder(path) : [path];
  });
}

const isShared = (file: string): boolean => {
  const local = relative(RENDERING_UTIL, file);
  return (
    /\.(ts|js)$/.test(local) &&
    !/\.(spec|test)\./.test(local) &&
    !SHAPE_LAYER.some((layer) => local === layer || local.startsWith(layer + sep))
  );
};

describe('shared rendering code', () => {
  it('does not name a diagram-specific shape id', () => {
    const offenders = sourcesUnder(RENDERING_UTIL)
      .filter(isShared)
      .filter((file) => DIAGRAM_SHAPE_ID.test(readFileSync(file, 'utf8')))
      .map((file) => relative(RENDERING_UTIL, file));

    expect(offenders).toEqual([]);
  });
});
