import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { getBuildConfig } from './util.js';
import { packageOptions } from '../.build/common.js';

const shouldVisualize = process.argv.includes('--visualize');

const buildPackage = async (entryName: keyof typeof packageOptions) => {
  await build(getBuildConfig({ entryName, minify: false }));
  const { metafile } = await build(
    getBuildConfig({ entryName, minify: true, metafile: shouldVisualize })
  );
  if (metafile) {
    // Upload metafile into https://esbuild.github.io/analyze/
    await writeFile(`stats/meta-${entryName}.json`, JSON.stringify(metafile));
  }
  await build(getBuildConfig({ entryName, minify: false, core: true }));
};

const handler = (e) => {
  console.error(e);
  process.exit(1);
};

const main = async () => {
  await mkdir('stats').catch(() => {});
  const packageNames = Object.keys(packageOptions) as (keyof typeof packageOptions)[];
  for (const pkg of packageNames) {
    await buildPackage(pkg).catch(handler);
  }
};

void main();
