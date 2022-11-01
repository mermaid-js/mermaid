import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { build, InlineConfig } from 'vite';
import pkg from '../package.json' assert { type: 'json' };

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const packageOptions = {
  'mermaid-zenuml': {
    name: 'mermaid-zenuml',
    file: 'diagram-definition.ts',
  },
  'mermaid-zenuml-detector': {
    name: 'mermaid-zenuml-detector',
    file: 'detector.ts',
  },
};

interface BuildOptions {
  minify: boolean | 'esbuild';
  core?: boolean;
  watch?: boolean;
  entryName: keyof typeof packageOptions;
}

const getBuildConfig = ({ minify, entryName }: BuildOptions): InlineConfig => {
  console.log(entryName, packageOptions[entryName]);
  const { name, file } = packageOptions[entryName];
  return {
    build: {
      emptyOutDir: false,
      outDir: resolve(__dirname, `../dist`),
      lib: {
        entry: resolve(__dirname, `../src/${file}`),
        name: pkg.name,
        // the proper extensions will be added
        fileName: pkg.name,
      },
      minify,
      rollupOptions: {
        external: ['require', 'fs', 'path'],
        output: [
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
        ],
      },
    },
    resolve: {
      extensions: ['.js', '.ts', '.json'],
    },
  };
};

const buildPackage = async (entryName: keyof typeof packageOptions) => {
  return Promise.allSettled([
    build(getBuildConfig({ minify: false, entryName })),
    build(getBuildConfig({ minify: 'esbuild', entryName })),
  ]);
};

const main = async () => {
  const packageNames = Object.keys(packageOptions) as (keyof typeof packageOptions)[];
  for (const pkg of packageNames) {
    await buildPackage(pkg);
  }
};

main();
