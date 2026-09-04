/**
 * Verify the as-built tarballs can be imported into a fresh, out-of-tree TypeScript project.
 */

/* eslint-disable no-console */
import { mkdtemp, mkdir, writeFile, readFile, readdir, copyFile, rm } from 'node:fs/promises';
import { execFileSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const require_ = createRequire(import.meta.url);

/**
 * `mermaid`'s emitted `.d.ts` files reference `type-fest` and `@types/d3` directly, so the
 * throwaway project has to install them itself. Their versions are not a free choice: the
 * check compiles the *published* declarations, and those were built against exactly the
 * ranges `packages/mermaid/package.json` declares.
 *
 * They used to be written as `'*'` and a hardcoded `'^7.4.3'`, which quietly meant "whatever
 * the registry serves today". That resolved `type-fest` to a major mermaid has never been
 * compiled against and broke this job at random -- 5.9.0 added `Float16Array` to its
 * `TypedArray` union, which does not exist under the `es2020` lib below, and `skipLibCheck`
 * is deliberately off here so third-party declarations are checked too. Two runs of the same
 * commit seconds apart disagreed, depending on what npm resolved.
 *
 * Reading the ranges from the package under test is what makes this reproducible. It is also
 * what the note below the field always asked for.
 */
const MERMAID_PKG = require_('../packages/mermaid/package.json') as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/**
 * Look in both sections: `type-fest` is a devDependency while `@types/d3` is a runtime one,
 * and which section a type package sits in is not something this check should care about.
 * Throw rather than emit `undefined` -- npm reads a missing range as "latest", which is the
 * exact failure mode being fixed here, and it would come back silently.
 */
const typeDependency = (name: string): string => {
  const range = MERMAID_PKG.dependencies?.[name] ?? MERMAID_PKG.devDependencies?.[name];
  if (!range) {
    throw new Error(
      `tsc-check: packages/mermaid/package.json no longer declares '${name}'. ` +
        `Update scripts/tsc-check.ts to match wherever it moved.`
    );
  }
  return range;
};

/**
 * Packages to build and import
 */
const PACKAGES = {
  mermaid: 'mermaid',
  '@mermaid-js/layout-elk': 'mermaid-layout-elk',
  '@mermaid-js/parser': 'parser',
  // TODO: these don't import cleanly yet due to exotic tsconfig.json requirements
  // '@mermaid-js/mermaid-zenuml': 'mermaid-zenuml',
};

/**
 * Files to create in the temporary package.
 */
const SRC = {
  // a minimal description of a buildable package
  'package.json': (tarballs: Record<string, string>) =>
    JSON.stringify(
      {
        dependencies: tarballs,
        scripts: { build: 'tsc -b --verbose' },
        devDependencies: {
          // these are somewhat-unexpectedly required, and a downstream needs to match the
          // real `package.json` values -- see `typeDependency`
          'type-fest': typeDependency('type-fest'),
          '@types/d3': typeDependency('@types/d3'),
          // Deliberately unpinned: a downstream picks its own compiler, so checking against
          // the current release is the signal this job exists to give. Pinning it to the
          // repo's own TypeScript additionally needs `"type": "module"` here, or the
          // generated `src/index.ts` is treated as CommonJS under `moduleResolution:
          // nodenext` and cannot import these ESM-only packages (TS1479).
          typescript: '*',
        },
      },
      null,
      2
    ),
  // a fairly strict TypeScript configuration
  'tsconfig.json': () =>
    JSON.stringify(
      {
        compilerOptions: {
          allowSyntheticDefaultImports: true,
          composite: true,
          declaration: true,
          esModuleInterop: true,
          incremental: true,
          lib: ['dom', 'es2024'],
          module: 'nodenext',
          moduleResolution: 'nodenext',
          noEmitOnError: true,
          noImplicitAny: true,
          noUnusedLocals: true,
          sourceMap: true,
          target: 'es2024',
          rootDir: './src',
          outDir: './lib',
          strict: true,
          tsBuildInfoFile: 'lib/.tsbuildinfo',
        },
      },
      null,
      2
    ),
  // the simplest possible script: will everything even import?
  'src/index.ts': (tarballs) => {
    const imports: string[] = [];
    const outputs: string[] = [];
    let i = 0;
    for (const pkg of Object.keys(tarballs)) {
      imports.push(`import * as pkg_${i} from '${pkg}';`);
      outputs.push(`console.log(pkg_${i});`);
      i++;
    }
    return [...imports, ...outputs].join('\n');
  },
};

/**
 * Commands to run after source files are created.
 *
 * `npm` is used to detect any unwanted `pnpm`-specific runtime "features".
 */
const COMMANDS = [
  ['npm', 'install'],
  ['npm', 'run', 'build'],
];

/**
 * Built files to expect after commands are executed.
 */
const LIB = ['lib/index.js', 'lib/index.js.map', 'lib/index.d.ts', 'lib/.tsbuildinfo'];

/**
 * Run a small out-of-tree build.
 */
async function main() {
  console.warn('Checking out-of-tree TypeScript build using', Object.keys(PACKAGES).join('\n'));
  const cwd = await mkdtemp(path.join(tmpdir(), 'mermaid-tsc-check-'));
  console.warn('... creating temporary folder', cwd);
  const tarballs = await buildTarballs(cwd);

  for (const [filename, generate] of Object.entries(SRC)) {
    const dest = path.join(cwd, filename);
    await mkdir(path.dirname(dest), { recursive: true });
    console.warn('... creating', dest);
    const text = generate(tarballs);
    await writeFile(dest, text);
    console.info(text);
  }

  for (const argv of COMMANDS) {
    console.warn('... in', cwd);
    console.warn('>>>', ...argv);
    // `stdio: 'inherit'`, or a failure prints the compiler output as `<Buffer 0a 3e ...>` and
    // the actual diagnostic never reaches the log.
    execFileSync(argv[0], argv.slice(1), { cwd, stdio: 'inherit' });
  }

  for (const lib of LIB) {
    const checkLib = path.join(cwd, lib);
    console.warn('... checking built file', checkLib);
    await readFile(checkLib, 'utf-8');
  }

  console.warn('... deleting', cwd);
  await rm(cwd, { recursive: true, force: true });
  console.warn('... tsc-check OK for\n', Object.keys(PACKAGES).join('\n'));
}

/** Build all the tarballs. */
async function buildTarballs(tmp: string): Promise<Record<string, string>> {
  const dist = path.join(tmp, 'dist');
  await mkdir(dist);
  const promises: Promise<void>[] = [];
  const tarballs: Record<string, string> = {};
  for (const [pkg, srcPath] of Object.entries(PACKAGES)) {
    promises.push(buildOneTarball(pkg, srcPath, dist, tarballs));
  }
  await Promise.all(promises);
  return tarballs;
}

/** Build a single tarball. */
async function buildOneTarball(
  pkg: string,
  srcPath: string,
  dist: string,
  tarballs: Record<string, string>
): Promise<void> {
  const cwd = await mkdtemp(path.join(dist, 'pack-'));
  const pkgDir = path.join(__dirname, '../packages', srcPath);
  const argv = ['pnpm', 'pack', '--pack-destination', cwd];
  console.warn('>>>', ...argv);
  execFileSync(argv[0], argv.slice(1), { cwd: pkgDir });
  const built = await readdir(cwd);
  const dest = path.join(dist, built[0]);
  await copyFile(path.join(cwd, built[0]), dest);
  await rm(cwd, { recursive: true, force: true });
  tarballs[pkg] = dest;
}

void main().catch((err) => {
  console.error(err);
  console.error('!!! tsc-check FAIL: temp folder left in place. see logs above for failure notes');
  process.exit(1);
});
