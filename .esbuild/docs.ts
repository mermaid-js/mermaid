import { execFileSync } from 'child_process';
import { build } from 'esbuild';
import { rm } from 'fs/promises';
import { generateLangium } from '../.build/generateLangium.js';
import type { MermaidBuildOptions } from './util.js';
import { defaultOptions, getBuildConfig } from './util.js';

const buildDocs = async () => {
  const option: MermaidBuildOptions = {
    ...defaultOptions,
    options: {
      file: 'rendering-util/rendering-elements/shapes.cli.ts',
      name: 'mermaid-shapes',
      packageName: 'mermaid',
    },
  } as const;

  await build({ ...getBuildConfig(option), splitting: false, sourcemap: false });
};

const handler = (e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
};

const main = async () => {
  await generateLangium();
  await buildDocs().catch(handler);
  execFileSync('node', ['packages/mermaid/dist/mermaid-shapes.esm.mjs']);
  await rm('packages/mermaid/dist/mermaid-shapes.esm.mjs');
};

void main();
