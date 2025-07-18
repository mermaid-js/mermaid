import { build } from 'esbuild';
import { cp, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
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
      { ...iifeOptions, minify: true, metafile: shouldVisualize },
      // mermaid.tiny.min.js
      {
        ...iifeOptions,
        minify: true,
        includeLargeFeatures: false,
        metafile: shouldVisualize,
        sourcemap: false,
      }
    );
  }
  if (entryName === 'mermaid-zenuml') {
    const iifeOptions: MermaidBuildOptions = {
      ...commonOptions,
      format: 'iife',
      globalName: 'mermaid-zenuml',
    };
    buildConfigs.push(
      // mermaid-zenuml.js
      { ...iifeOptions },
      // mermaid-zenuml.min.js
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

const buildTinyMermaid = async () => {
  await mkdir('./packages/tiny/dist', { recursive: true });
  await rename(
    './packages/mermaid/dist/mermaid.tiny.min.js',
    './packages/tiny/dist/mermaid.tiny.js'
  );
  // Copy version from mermaid's package.json to tiny's package.json
  const mermaidPkg = JSON.parse(await readFile('./packages/mermaid/package.json', 'utf8'));
  const tinyPkg = JSON.parse(await readFile('./packages/tiny/package.json', 'utf8'));
  tinyPkg.version = mermaidPkg.version;

  await writeFile('./packages/tiny/package.json', JSON.stringify(tinyPkg, null, 2) + '\n');
  await cp('./packages/mermaid/CHANGELOG.md', './packages/tiny/CHANGELOG.md');
};

const main = async () => {
  await generateLangium();
  await mkdir('stats', { recursive: true });
  const packageNames = Object.keys(packageOptions) as (keyof typeof packageOptions)[];
  // it should build `parser` before `mermaid` because it's a dependency
  for (const pkg of packageNames) {
    await buildPackage(pkg).catch(handler);
  }
  await buildTinyMermaid();
};

void main();
