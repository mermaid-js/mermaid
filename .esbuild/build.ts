import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { MermaidBuildOptions, defaultOptions, getBuildConfig } from './util.js';
import { packageOptions } from '../.build/common.js';

const shouldVisualize = process.argv.includes('--visualize');

const buildPackage = async (entryName: keyof typeof packageOptions) => {
  const commonOptions = { ...defaultOptions, entryName } as const;
  const buildConfigs = [
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
      if (!metafile) {
        continue;
      }
      const fileName = Object.keys(metafile.outputs)
        .filter((file) => !file.includes('chunks') && file.endsWith('js'))[0]
        .replace('dist/', '');
      await writeFile(`stats/${fileName}.meta.json`, JSON.stringify(metafile));
    }
  }
};

const handler = (e) => {
  console.error(e);
  process.exit(1);
};

const main = async () => {
  await mkdir('stats').catch(() => {});
  const packageNames = Object.keys(packageOptions) as (keyof typeof packageOptions)[];
  await Promise.allSettled(packageNames.map((pkg) => buildPackage(pkg).catch(handler)));
};

void main();
