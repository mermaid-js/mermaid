import { resolve } from 'path';
import { fileURLToPath } from 'url';
import type { BuildOptions } from 'esbuild';
import { readFileSync } from 'fs';
import jsonSchemaPlugin from './jsonSchemaPlugin.js';
import { packageOptions } from '../.build/common.js';
import { jisonPlugin } from './jisonPlugin.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

interface MermaidBuildOptions {
  minify: boolean;
  core?: boolean;
  metafile?: boolean;
  entryName: keyof typeof packageOptions;
}

const buildOptions = (override: BuildOptions): BuildOptions => {
  return {
    bundle: true,
    splitting: true,
    minify: true,
    keepNames: true,
    banner: { js: '"use strict";' },
    format: 'esm',
    platform: 'browser',
    tsconfig: 'tsconfig.json',
    resolveExtensions: ['.ts', '.js', '.json', '.jison', '.yaml'],
    external: ['require', 'fs', 'path'],
    outdir: 'dist',
    plugins: [jisonPlugin, jsonSchemaPlugin],
    sourcemap: 'external',
    outExtension: { '.js': '.mjs' },
    ...override,
  };
};

export const getBuildConfig = ({
  minify,
  core,
  entryName,
  metafile,
}: MermaidBuildOptions): BuildOptions => {
  const external: string[] = ['require', 'fs', 'path'];
  const { name, file, packageName } = packageOptions[entryName];
  let output: BuildOptions = buildOptions({
    absWorkingDir: resolve(__dirname, `../packages/${packageName}`),
    entryPoints: {
      [`${name}${core ? '.core' : '.esm'}${minify ? '.min' : ''}`]: `src/${file}`,
    },
    metafile,
  });

  if (core) {
    const { dependencies } = JSON.parse(
      readFileSync(resolve(__dirname, `../packages/${packageName}/package.json`), 'utf-8')
    );
    // Core build is used to generate file without bundled dependencies.
    // This is used by downstream projects to bundle dependencies themselves.
    // Ignore dependencies and any dependencies of dependencies
    external.push(...Object.keys(dependencies));
    output.external = external;
  }
  return output;
};
