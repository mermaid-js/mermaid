import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { MermaidBuildOptions, defaultConfig, getBuildConfig } from './util.js';
import { packageOptions } from '../.build/common.js';

const shouldVisualize = process.argv.includes('--visualize');

const buildPackage = async (entryName: keyof typeof packageOptions) => {
  const commonConfig = { ...defaultConfig, entryName };
  const configs = [
    { ...commonConfig },
    {
      ...commonConfig,
      minify: true,
      metafile: shouldVisualize,
    },
    { ...commonConfig, core: true },
  ];

  if (entryName === 'mermaid') {
    const iifeConfig: MermaidBuildOptions = { ...commonConfig, format: 'iife' };
    configs.push(
      { ...iifeConfig },
      { ...iifeConfig, minify: true },
      {
        ...iifeConfig,
        minify: true,
        includeLargeDiagrams: false,
        metafile: shouldVisualize,
      }
    );
  }

  const results = await Promise.all(configs.map((config) => build(getBuildConfig(config))));

  if (shouldVisualize) {
    for (const { metafile } of results) {
      if (!metafile) {
        continue;
      }
      const fileName = Object.keys(metafile.outputs)
        .filter((key) => key.includes('.min') && key.endsWith('js'))[0]
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
