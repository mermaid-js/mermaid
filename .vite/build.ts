import type { InlineConfig } from 'vite';
import { build, type PluginOption } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import jisonPlugin from './jisonPlugin.js';
import jsonSchemaPlugin from './jsonSchemaPlugin.js';
import typescript from '@rollup/plugin-typescript';
import { visualizer } from 'rollup-plugin-visualizer';
import type { TemplateType } from 'rollup-plugin-visualizer/dist/plugin/template-types.js';
import istanbul from 'vite-plugin-istanbul';
import { packageOptions } from '../.build/common.js';
import { generateLangium } from '../.build/generateLangium.js';

const visualize = process.argv.includes('--visualize');
const watch = process.argv.includes('--watch');
const mermaidOnly = process.argv.includes('--mermaid');
const coverage = process.env.VITE_COVERAGE === 'true';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const sourcemap = false;

type OutputOptions = Exclude<
  Exclude<InlineConfig['build'], undefined>['rollupOptions'],
  undefined
>['output'];

const visualizerOptions = (packageName: string, core = false): PluginOption[] => {
  if (packageName !== 'mermaid' || !visualize) {
    return [];
  }
  return ['network', 'treemap', 'sunburst'].map(
    (chartType) =>
      visualizer({
        filename: `./stats/${chartType}${core ? '.core' : ''}.html`,
        template: chartType as TemplateType,
        gzipSize: true,
        brotliSize: true,
      }) as PluginOption
  );
};

interface BuildOptions {
  minify: boolean | 'esbuild';
  core?: boolean;
  watch?: boolean;
  entryName: keyof typeof packageOptions;
}

export const getBuildConfig = ({ minify, core, watch, entryName }: BuildOptions): InlineConfig => {
  const external: (string | RegExp)[] = ['require', 'fs', 'path'];
  // eslint-disable-next-line no-console
  console.log(entryName, packageOptions[entryName]);
  const { name, file, packageName } = packageOptions[entryName];
  const output: OutputOptions = [
    {
      name,
      format: 'esm',
      sourcemap,
      entryFileNames: `${name}.esm${minify ? '.min' : ''}.mjs`,
    },
  ];

  const config: InlineConfig = {
    configFile: false,
    build: {
      emptyOutDir: false,
      outDir: resolve(__dirname, `../packages/${packageName}/dist`),
      lib: {
        entry: resolve(__dirname, `../packages/${packageName}/src/${file}`),
        name,
        // the proper extensions will be added
        fileName: name,
      },
      minify,
      rollupOptions: {
        external,
        output,
      },
    },
    define: {
      'import.meta.vitest': 'undefined',
    },
    resolve: {
      extensions: [],
    },
    plugins: [
      jisonPlugin(),
      jsonSchemaPlugin(), // handles `.schema.yaml` files
      typescript({ compilerOptions: { declaration: false } }),
      istanbul({
        exclude: ['node_modules', 'test/', '__mocks__', 'generated'],
        extension: ['.js', '.ts'],
        requireEnv: true,
        forceBuildInstrument: coverage,
      }),
      ...visualizerOptions(packageName, core),
    ],
  };

  if (watch && config.build) {
    config.build.watch = {
      include: ['packages/mermaid-example-diagram/src/**', 'packages/mermaid/src/**'],
    };
  }

  return config;
};

const buildPackage = async (entryName: keyof typeof packageOptions) => {
  await build(getBuildConfig({ minify: false, entryName }));
};

const main = async () => {
  const packageNames = Object.keys(packageOptions) as (keyof typeof packageOptions)[];
  for (const pkg of packageNames.filter(
    (pkg) => !mermaidOnly || pkg === 'mermaid' || pkg === 'parser'
  )) {
    await buildPackage(pkg);
  }
};

await generateLangium();

if (watch) {
  await build(getBuildConfig({ minify: false, watch, core: false, entryName: 'parser' }));
  void build(getBuildConfig({ minify: false, watch, core: false, entryName: 'mermaid' }));
  if (!mermaidOnly) {
    void build(getBuildConfig({ minify: false, watch, entryName: 'mermaid-example-diagram' }));
    void build(getBuildConfig({ minify: false, watch, entryName: 'mermaid-zenuml' }));
  }
} else if (visualize) {
  await build(getBuildConfig({ minify: false, watch, core: false, entryName: 'parser' }));
  await build(getBuildConfig({ minify: false, core: true, entryName: 'mermaid' }));
  await build(getBuildConfig({ minify: false, core: false, entryName: 'mermaid' }));
} else {
  void main();
}
