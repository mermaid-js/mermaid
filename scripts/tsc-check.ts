/**
 * Verify the as-built tarballs can be imported into a fresh, out-of-tree TypeScript project.
 */

/* eslint-disable no-console */
import { mkdtemp, mkdir, writeFile, readFile, readdir, copyFile, rm } from 'node:fs/promises';
import { execFileSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'node:os';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

/**
 * Packages to build and import
 */
const PACKAGES = {
  mermaid: 'mermaid',
  '@mermaid-js/layout-elk': 'mermaid-layout-elk',
  // TODO: these don't import cleanly yet due to exotic tsconfig.json requirements
  // '@mermaid-js/mermaid-zenuml': 'mermaid-zenuml',
  // '@mermaid-js/parser': 'parser',
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
          // these are somewhat-unexpectedly required, and a downstream would need
          // to match the real `package.json` values
          'type-fest': '*',
          '@types/d3': '^7.4.3',
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
          lib: ['dom', 'es2020'],
          module: 'esnext',
          moduleResolution: 'node',
          noEmitOnError: true,
          noImplicitAny: true,
          noUnusedLocals: true,
          sourceMap: true,
          target: 'es2020',
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
    execFileSync(argv[0], argv.slice(1), { cwd });
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
