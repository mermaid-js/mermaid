import { build } from 'esbuild';
import { getBuildConfig, packageOptions } from './util.js';
import { context } from 'esbuild';

const shouldWatch = process.argv.includes('--watch');

const buildPackage = async (entryName: keyof typeof packageOptions) => {
  await build(getBuildConfig({ entryName, minify: false }));
  await build(getBuildConfig({ entryName, minify: true }));
  await build(getBuildConfig({ entryName, minify: false, core: true }));
};

const handler = (e) => {
  console.error(e);
  process.exit(1);
};

const main = async () => {
  const packageNames = Object.keys(packageOptions) as (keyof typeof packageOptions)[];
  for (const pkg of packageNames) {
    await buildPackage(pkg).catch(handler);
  }
};

const watch = async () => {
  const ctx = await context(getBuildConfig({ entryName: 'mermaid', minify: false }));
  ctx.watch();
  console.log('Watching for changes');
};

void (shouldWatch ? watch : main)();
