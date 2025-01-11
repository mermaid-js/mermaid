import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { packageOptions } from '../.build/common.js';
import { generateLangium } from '../.build/generateLangium.js';
import type { MermaidBuildOptions } from './util.js';
import { defaultOptions, getBuildConfig } from './util.js';

const shouldVisualize = process.argv.includes('--visualize');

const buildPackage = async (entryName: keyof typeof packageOptions) => {
  const commonOptions: MermaidBuildOptions = {
    ...defaultOptions,
    options: packageOptions[entryName],
  } as const;
  const buildConfigs: MermaidBuildOptions[] = [
    // package.mjs
    { ...commonOptions },
    // package.min.mjs
    {
      ...commonOptions,
      minify: true,
      metafile: shouldVisualize,
    },
    // package.core.mjs
    { ...commonOptions, core: true },
  ];

  if (entryName === 'mermaid') {
    const iifeOptions: MermaidBuildOptions = { ...commonOptions, format: 'iife' };
    buildConfigs.push(
      // mermaid.js
      { ...iifeOptions },
      // mermaid.min.js
      { ...iifeOptions, minify: true, metafile: shouldVisualize }
    );
  }

  const results = await Promise.all(buildConfigs.map((option) => build(getBuildConfig(option))));

  if (shouldVisualize) {
    for (const { metafile } of results) {
      if (!metafile?.outputs) {
        continue;
      }
      const fileName = Object.keys(metafile.outputs)
        .find((file) => !file.includes('chunks') && file.endsWith('js'))!
        .replace('dist/', '');
      // Upload metafile into https://esbuild.github.io/analyze/
      await writeFile(`stats/${fileName}.meta.json`, JSON.stringify(metafile));
    }
  }
};

const handler = (e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
};

const main = async () => {
  await generateLangium();
  await mkdir('stats', { recursive: true });
  const packageNames = Object.keys(packageOptions) as (keyof typeof packageOptions)[];
  // it should build `parser` before `mermaid` because it's a dependency
  for (const pkg of packageNames) {
    await buildPackage(pkg).catch(handler);
  }
};

void main();
