// @vitest-environment node
import { mkdtemp, mkdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build, type Plugin } from 'esbuild';
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

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

// Use the production plugin list so removing the build registration also
// fails the regression, without requiring a full Mermaid build first.
const productionPlugins = (): Plugin[] =>
  getBuildConfig({
    ...defaultOptions,
    minify: true,
    format: 'iife',
    options: packageOptions.mermaid,
  }).plugins ?? [];

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
    plugins: usePlugin ? productionPlugins() : [],
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

  it('guards the eval inside the installed @chevrotain/utils helper', async () => {
    // Resolve the real dependency instead of the local fixture.
    // @chevrotain/utils exports only its api entry — neither package.json nor
    // the deep helper file is resolvable through Node's exports map. The one
    // stable route to the helper is the import upstream itself uses, so bundle
    // chevrotain's resolved entry and read the metafile to locate the
    // installed helper regardless of the package-manager layout.
    const requireMermaid = createRequire(
      new URL('../packages/mermaid/package.json', import.meta.url)
    );
    const chevrotainEntry = await realpath(requireMermaid.resolve('chevrotain'));
    const chevrotainDir = dirname(chevrotainEntry);
    const discovery = await build({
      entryPoints: [chevrotainEntry],
      bundle: true,
      format: 'esm',
      write: false,
      metafile: true,
      logLevel: 'silent',
      absWorkingDir: chevrotainDir,
    });
    const helperInput = Object.keys(discovery.metafile?.inputs ?? {}).find(
      (input) =>
        input.replaceAll('\\', '/').includes('@chevrotain/utils/') &&
        input.endsWith('to-fast-properties.js')
    );
    if (helperInput === undefined) {
      throw new Error(
        'bundling chevrotain did not include @chevrotain/utils to-fast-properties.js; upstream may have moved or removed the helper this plugin targets'
      );
    }
    const helperEntry = join(chevrotainDir, helperInput);
    expect(
      await pathExists(helperEntry),
      `installed @chevrotain/utils has no to-fast-properties.js at ${helperEntry}; upstream may have moved or removed the helper this plugin targets`
    ).toBe(true);
    const bundleInstalled = (plugins: Plugin[]) =>
      build({
        entryPoints: [helperEntry],
        bundle: true,
        minify: true,
        format: 'iife',
        globalName: 'helpers',
        write: false,
        logLevel: 'silent',
        plugins,
      });

    const original = await bundleInstalled([]);
    expect(
      findUnreachableExpressions(original.outputFiles[0].text),
      'installed @chevrotain/utils no longer has the return-then-eval shape this plugin targets; the plugin may be removable'
    ).toHaveLength(1);

    const result = await bundleInstalled(productionPlugins());
    expect(findUnreachableExpressions(result.outputFiles[0].text)).toEqual([]);
    expect(result.outputFiles[0].text).toMatch(/\beval\b/);
    // Non-empty means upstream changed the helper and the rewrite did not
    // apply — that warning, not silence, is the intended signal.
    expect(
      result.warnings,
      'upstream @chevrotain/utils helper changed shape; the deadCodePlugin rewrite did not apply and may need updating or removal'
    ).toEqual([]);

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
