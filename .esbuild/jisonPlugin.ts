import { readFile } from 'node:fs/promises';
import { transformJison } from '../.build/jisonTransformer.js';
import type { Plugin } from 'esbuild';

export const jisonPlugin: Plugin = {
  name: 'jison',
  setup(build) {
    build.onLoad({ filter: /\.jison$/ }, async (args) => {
      // Load the file from the file system
      const source = await readFile(args.path, 'utf8');
      const contents = transformJison(source);
      return { contents, warnings: [] };
    });
  },
};
