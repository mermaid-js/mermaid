// @vitest-environment node
import { build } from 'esbuild';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { chevrotainDeadEvalPlugin } from './chevrotainDeadEvalPlugin.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const bundleChevrotain = async (withPlugin: boolean) => {
  const result = await build({
    stdin: {
      contents: `export { EmbeddedActionsParser } from 'chevrotain';`,
      resolveDir: resolve(__dirname, '../packages/parser'),
    },
    bundle: true,
    minify: true,
    keepNames: true,
    write: false,
    format: 'esm',
    logLevel: 'silent',
    plugins: withPlugin ? [chevrotainDeadEvalPlugin] : [],
  });
  return { code: result.outputFiles[0].text, warnings: result.warnings };
};

describe('chevrotainDeadEvalPlugin', () => {
  // Firefox logs "unreachable code after return statement" for a statement
  // that follows a `return` in minified output (#7953).
  const deadEvalAfterReturn = /return[^;{}]*;\(0,eval\)\(/;

  it('reproduces the dead eval after return without the plugin', async () => {
    const { code } = await bundleChevrotain(false);
    expect(code).toMatch(deadEvalAfterReturn);
  });

  it('removes the dead eval from the minified bundle', async () => {
    const { code, warnings } = await bundleChevrotain(true);
    expect(code).not.toMatch(deadEvalAfterReturn);
    expect(code).not.toContain('(0,eval)');
    expect(code).toContain('"toFastProperties"');
    expect(warnings).toEqual([]);
  });
});
