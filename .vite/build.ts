import { build, InlineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import jisonPlugin from './jisonPlugin.js';
import pkg from '../package.json' assert { type: 'json' };
type OutputOptions = Exclude<
  Exclude<InlineConfig['build'], undefined>['rollupOptions'],
  undefined
>['output'];

const { dependencies } = pkg;
const watch = process.argv.includes('--watch');
const __dirname = fileURLToPath(new URL('.', import.meta.url));

interface BuildOptions {
  minify: boolean | 'esbuild';
  core?: boolean;
  watch?: boolean;
}

export const getBuildConfig = ({ minify, core, watch }: BuildOptions): InlineConfig => {
  const external = ['require', 'fs', 'path'];
  let output: OutputOptions = [
    {
      name: 'mermaid',
      format: 'esm',
      sourcemap: true,
      entryFileNames: `[name].esm${minify ? '.min' : ''}.mjs`,
    },
    {
      name: 'mermaid',
      format: 'umd',
      sourcemap: true,
      entryFileNames: `[name]${minify ? '.min' : ''}.js`,
    },
  ];

  if (core) {
    // Core build is used to generate file without bundled dependencies.
    // This is used by downstream projects to bundle dependencies themselves.
    external.push(...Object.keys(dependencies));
    // This needs to be an array. Otherwise vite will build esm & umd with same name and overwrite esm with umd.
    output = [
      {
        format: 'esm',
        sourcemap: true,
        entryFileNames: `[name].core.mjs`,
      },
    ];
  }

  const config: InlineConfig = {
    configFile: false,
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, '../src/mermaid.ts'),
        name: 'mermaid',
        // the proper extensions will be added
        fileName: 'mermaid',
      },
      minify,
      rollupOptions: {
        external,
        output,
      },
    },
    resolve: {
      extensions: ['.jison', '.js', '.ts', '.json'],
    },
    plugins: [jisonPlugin()],
  };

  if (watch && config.build) {
    config.build.watch = {
      include: 'src/**',
    };
  }

  return config;
};

if (watch) {
  build(getBuildConfig({ minify: false, watch }));
} else {
  build(getBuildConfig({ minify: false }));
  build(getBuildConfig({ minify: 'esbuild' }));
  build(getBuildConfig({ minify: false, core: true }));
}
