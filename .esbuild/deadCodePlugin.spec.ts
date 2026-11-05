// @vitest-environment node
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import { afterEach, describe, expect, it } from 'vitest';
import ts from 'typescript';
import { packageOptions } from '../.build/common.js';
import { defaultOptions, getBuildConfig } from './util.js';

const helper = `export function toFastProperties(value) {
  function FakeConstructor() {}
  FakeConstructor.prototype = value;
  const fakeInstance = new FakeConstructor();
  function fakeAccess() { return typeof fakeInstance.bar; }
  fakeAccess();
  fakeAccess();
  // Always true condition to suppress the Firefox warning of unreachable
  // code after a return statement.
  if (1) return value;
  (0, eval)(value);
}`;

const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

// Check only the small helper output, not Mermaid's multi-megabyte dist bundle.
// This detects the specific #7953 structure rather than all Firefox warnings.
const findUnreachableExpressions = (code: string): ts.ExpressionStatement[] => {
  const sourceFile = ts.createSourceFile('helper.js', code, ts.ScriptTarget.ESNext, false);
  const unreachable: ts.ExpressionStatement[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isBlock(node)) {
      const returnIndex = node.statements.findIndex(ts.isReturnStatement);
      if (returnIndex !== -1) {
        unreachable.push(
          ...node.statements.slice(returnIndex + 1).filter(ts.isExpressionStatement)
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return unreachable;
};

const bundleHelper = async (
  source: string,
  packageName = '@chevrotain/utils',
  usePlugin = true
) => {
  const root = await mkdtemp(join(tmpdir(), 'mermaid-dead-code-'));
  temporaryDirectories.push(root);
  const directory = join(root, 'node_modules', packageName);
  await mkdir(directory, { recursive: true });
  const entry = join(directory, 'to-fast-properties.js');
  await writeFile(entry, source);
  return build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'helpers',
    write: false,
    logLevel: 'silent',
    // Use the production plugin list so removing the build registration also
    // fails the regression, without requiring a full Mermaid build first.
    plugins: usePlugin
      ? getBuildConfig({
          ...defaultOptions,
          minify: true,
          format: 'iife',
          options: packageOptions.mermaid,
        }).plugins
      : [],
  });
};

describe('deadCodePlugin', () => {
  it('detects an expression after an unconditional return', () => {
    expect(findUnreachableExpressions('function f() { return 1; (0, eval)(1); }')).toHaveLength(1);
  });

  it('does not flag an expression after a conditional return', () => {
    expect(
      findUnreachableExpressions('function f() { if (check()) return 1; (0, eval)(1); }')
    ).toEqual([]);
  });

  it('guards the retained eval when minifying the helper with the production plugins', async () => {
    const original = await bundleHelper(helper, '@chevrotain/utils', false);
    expect(findUnreachableExpressions(original.outputFiles[0].text)).toHaveLength(1);

    const result = await bundleHelper(helper);
    expect(findUnreachableExpressions(result.outputFiles[0].text)).toEqual([]);
    expect(result.outputFiles[0].text).toMatch(/\beval\b/);
    expect(result.warnings).toEqual([]);
  });

  it('preserves the original return value and number of getter accesses', async () => {
    const result = await bundleHelper(helper);
    const context = { helpers: { toFastProperties: (value: object) => value } };
    runInNewContext(result.outputFiles[0].text, context);
    let accesses = 0;
    const value = {
      get bar() {
        accesses++;
        return undefined;
      },
    };
    expect(context.helpers.toFastProperties(value)).toBe(value);
    expect(accesses).toBe(2);
    expect(result.outputFiles[0].text).toMatch(/\beval\b/);
    expect(result.warnings).toEqual([]);
  });

  it('leaves unrelated packages with the same filename unchanged', async () => {
    const result = await bundleHelper(helper, 'other-utils');
    const original = await bundleHelper(helper, 'other-utils', false);
    expect(result.outputFiles[0].text).toBe(original.outputFiles[0].text);
    expect(result.warnings).toEqual([]);
  });

  it('warns without rewriting an unexpected upstream helper', async () => {
    const result = await bundleHelper('export const toFastProperties = (value) => value;');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].text).toContain('upstream may have fixed or removed it');
  });

  it('does not rewrite a helper whose access function can return false', async () => {
    const source = helper.replace('return typeof fakeInstance.bar;', 'return false;');
    const result = await bundleHelper(source);
    const original = await bundleHelper(source, '@chevrotain/utils', false);
    expect(result.outputFiles[0].text).toBe(original.outputFiles[0].text);
    expect(result.warnings).toHaveLength(1);
    const context = { helpers: { toFastProperties: (value: object) => value } };
    runInNewContext(result.outputFiles[0].text, context);
    const value = {};
    expect(context.helpers.toFastProperties(value)).toBe(value);
  });
});
