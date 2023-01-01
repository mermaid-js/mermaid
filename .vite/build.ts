import { build, InlineConfig, type PluginOption } from 'vite';
import { createVuePlugin as vue } from 'vite-plugin-vue2';

import { resolve } from 'path';
import { fileURLToPath } from 'url';
import jisonPlugin from './jisonPlugin.js';
import { readFileSync } from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';
import type { TemplateType } from 'rollup-plugin-visualizer/dist/plugin/template-types.js';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const visualize = process.argv.includes('--visualize');
const watch = process.argv.includes('--watch');
const mermaidOnly = process.argv.includes('--mermaid');
const __dirname = fileURLToPath(new URL('.', import.meta.url));

type OutputOptions = Exclude<
  Exclude<InlineConfig['build'], undefined>['rollupOptions'],
  undefined
>['output'];

const visualizerOptions = (packageName: string, core = false): PluginOption[] => {
  if (packageName !== 'mermaid' || !visualize) {
    return [];
  }
  return ['network', 'treemap', 'sunburst'].map((chartType) =>
    visualizer({
      filename: `./stats/${chartType}${core ? '.core' : ''}.html`,
      template: chartType as TemplateType,
      gzipSize: true,
      brotliSize: true,
    })
  );
};

const packageOptions = {
  mermaid: {
    name: 'mermaid',
    packageName: 'mermaid',
    file: 'mermaid.ts',
  },
  'mermaid-mindmap': {
    name: 'mermaid-mindmap',
    packageName: 'mermaid-mindmap',
    file: 'detector.ts',
  },
  'mermaid-zenuml/zenuml/core': {
    name: 'zenuml',
    packageName: 'mermaid-zenuml/zenuml/core',
    file: 'core.ts',
  },
  'mermaid-zenuml': {
    name: 'mermaid-zenuml',
    packageName: 'mermaid-zenuml',
    file: 'detector.ts',
  },
};

interface BuildOptions {
  minify: boolean | 'esbuild';
  core?: boolean;
  watch?: boolean;
  entryName: keyof typeof packageOptions;
}

export const getBuildConfig = ({ minify, core, watch, entryName }: BuildOptions): InlineConfig => {
  const external: (string | RegExp)[] = ['require', 'fs', 'path'];
  console.log(entryName, packageOptions[entryName]);
  const { name, file, packageName } = packageOptions[entryName];
  let output: OutputOptions = [
    {
      name,
      format: 'esm',
      sourcemap: true,
      entryFileNames: `${name}.esm${minify ? '.min' : ''}.mjs`,
    },
    {
      name,
      format: 'umd',
      sourcemap: true,
      entryFileNames: `${name}${minify ? '.min' : ''}.js`,
    },
  ];

  if (core) {
    const { dependencies } = JSON.parse(
      readFileSync(resolve(__dirname, `../packages/${packageName}/package.json`), 'utf-8')
    );
    // Core build is used to generate file without bundled dependencies.
    // This is used by downstream projects to bundle dependencies themselves.
    // Ignore dependencies and any dependencies of dependencies
    // Adapted from the RegEx used by `rollup-plugin-node`
    external.push(new RegExp('^(?:' + Object.keys(dependencies).join('|') + ')(?:/.+)?$'));
    // This needs to be an array. Otherwise vite will build esm & umd with same name and overwrite esm with umd.
    output = [
      {
        name,
        format: 'esm',
        sourcemap: true,
        entryFileNames: `${name}.core.mjs`,
      },
    ];
  }

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
    resolve: {
      extensions: ['.jison', '.js', '.ts', '.json'],
    },
    plugins: [jisonPlugin(), ...visualizerOptions(packageName, core)],
  };

  if (watch && config.build) {
    config.build.watch = {
      include: [
        'packages/mermaid-zenuml/zenuml/core/src/**',
        'packages/mermaid-zenuml/src/**',
        'packages/mermaid-mindmap/src/**',
        'packages/mermaid/src/**',
        // 'packages/mermaid-example-diagram/src/**',
      ],
    };
  }

  if (entryName === 'mermaid-zenuml/zenuml/core') {
    config.plugins.push(vue());
    config.plugins.push(cssInjectedByJsPlugin());
    config.css = {
      postcss: {
        plugins: [
          tailwindcss({
            important: '.zenuml',
            content: [
              './packages/mermaid-zenuml/zenuml/core/**/*.html',
              './packages/mermaid-zenuml/zenuml/core/src/**/*.vue',
            ],
            theme: {
              extend: {
                textColor: {
                  skin: {
                    title:
                      'var(--color-text-title, var(--color-text-message, var(--color-text-base, #000)))',
                    participant:
                      'var(--color-text-participant, var(--color-text-message, var(--color-text-base, #000)))',
                    message: 'var(--color-text-message, var(--color-text-base, #000))',
                    'message-arrow':
                      'var(--color-message-arrow, var(--color-border-frame, var(--color-border-base, #000)))', // message arrow head
                    'message-hover': 'var(--color-text-message-hover, var(--color-bg-base, #fff))',
                    comment:
                      'var(--color-text-comment, var(--color-text-secondary, var(--color-text-base, #000)))',
                    'fragment-header':
                      'var(--color-text-fragment-header, var(--color-text-message, #000))',
                    fragment: 'var(--color-text-fragment, var(--color-text-message, #000))',
                    base: 'var(--color-text-base)',
                    header: 'var(--color-text-header)',
                    secondary: 'var(--color-text-secondary)',
                    control:
                      'var(--color-text-control, var(--color-text-secondary, var(--color-text-base, #000)))',
                    muted: 'var(--color-text-muted)',
                    hover: 'var(--color-text-hover)',
                    link: `var(--color-text-link, var(--color-text-secondary, var(--color-text-base, #000)))`,
                    fill: `var(--color-text-fill)`,
                  },
                },
                backgroundColor: {
                  skin: {
                    canvas: 'var(--color-bg-canvas, var(--color-bg-base, #fff))',
                    frame:
                      'var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff)))',
                    title:
                      'var(--color-bg-title, var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff))))',
                    participant:
                      'var(--color-bg-participant, var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff))))',
                    lifeline:
                      'var(--color-border-participant, var(--color-border-participant, var(--color-border-frame, var(--color-border-base, #000))))',
                    divider:
                      'var(--color-border-participant, var(--color-border-frame, var(--color-border-base, #000)))',
                    'message-hover': 'var(--color-bg-message-hover, var(--color-text-base, #000))',
                    'fragment-header': 'var(--color-bg-fragment-header, transparent)',
                    occurrence:
                      'var(--color-bg-occurrence, var(--color-bg-participant, var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff)))))',
                    base: 'var(--color-bg-base)',
                    secondary: 'var(--color-bg-secondary)',
                    hover: 'var(--color-bg-hover)',
                    fill: 'var(--color-bg-fill)',
                  },
                },
                borderColor: {
                  skin: {
                    frame: 'var(--color-border-frame, var(--color-border-base, #000))',
                    participant:
                      'var(--color-border-participant, var(--color-border-frame, var(--color-border-base, #000)))',
                    'message-arrow':
                      'var(--color-message-arrow, var(--color-border-frame,  var(--color-border-base, #000)))', // message arrow line
                    fragment:
                      'var(--color-border-fragment, var(--color-border-frame,  var(--color-border-base, #000)))',
                    occurrence:
                      'var(--color-border-occurrence, var(--color-border-frame,  var(--color-border-base, #000)))',
                    base: 'var(--color-border-base)',
                    secondary: 'var(--color-border-secondary)',
                  },
                },
                gradientColorStops: {
                  skin: {
                    base: 'var(--color-bg-base)',
                    secondary: 'var(--color-bg-secondary)',
                  },
                },
              },
            },
            plugins: [],
          }),
          autoprefixer,
        ],
      },
    };
  }
  return config;
};

const buildPackage = async (entryName: keyof typeof packageOptions) => {
  return Promise.allSettled([
    build(getBuildConfig({ minify: false, entryName })),
    build(getBuildConfig({ minify: 'esbuild', entryName })),
    build(getBuildConfig({ minify: false, core: true, entryName })),
  ]);
};

const main = async () => {
  const packageNames = Object.keys(packageOptions) as (keyof typeof packageOptions)[];
  for (const pkg of packageNames.filter((pkg) => !mermaidOnly || pkg === 'mermaid')) {
    await buildPackage(pkg);
  }
};

if (watch) {
  build(getBuildConfig({ minify: false, watch, core: false, entryName: 'mermaid' }));
  if (!mermaidOnly) {
    build(getBuildConfig({ minify: false, watch, entryName: 'mermaid-mindmap' }));
    build(getBuildConfig({ minify: false, watch, entryName: 'mermaid-zenuml' }));
    build(getBuildConfig({ minify: false, watch, entryName: 'mermaid-zenuml/zenuml/core' }));
    // build(getBuildConfig({ minify: false, watch, entryName: 'mermaid-example-diagram' }));
  }
} else if (visualize) {
  await build(getBuildConfig({ minify: false, core: true, entryName: 'mermaid' }));
  await build(getBuildConfig({ minify: false, core: false, entryName: 'mermaid' }));
} else {
  void main();
}
