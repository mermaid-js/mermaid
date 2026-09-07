/* eslint-disable no-console */
/**
 * Puts the three packages under test into ./node_modules.
 *
 * Two modes, because only `mermaid` is currently published as a preview:
 *
 *   pnpm setup            (equivalent to --from-checkout ../..)
 *   node setup.mjs --from-checkout <path-to-mermaid-repo>
 *       `pnpm pack`s mermaid, @mermaid-js/layout-elk and @mermaid-js/tiny from a
 *       built checkout, then extracts the tarballs. `pnpm pack` produces exactly
 *       what `npm publish` uploads, so this exercises the publishable artifacts.
 *
 *   node setup.mjs --from-registry <version> [--registry <url>]
 *       Fetches published versions instead, e.g.
 *         --from-registry 12.0.0-preview.349 --registry https://npm.pkg.github.com
 *       `mermaid` is fetched as `@mermaid-js/mermaid`, the name the preview is
 *       published under, and placed at node_modules/mermaid so the pages are
 *       identical in both modes. GitHub Packages needs
 *       `npm set //npm.pkg.github.com/:_authToken <token>` with read:packages.
 *
 * Tarballs are extracted directly rather than installed. All three bundles are
 * self-contained, so they need no dependency resolution — and going through
 * `npm install` with `file:` specifiers silently serves a cached copy when a
 * rebuilt tarball keeps the same version, which quietly tests stale artifacts.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const MODULES = join(ROOT, 'node_modules');
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const run = (cmd, cmdArgs, cwd) => execFileSync(cmd, cmdArgs, { cwd, stdio: 'inherit' });

const checkout = flag('--from-checkout');
const version = flag('--from-registry');
const registry = flag('--registry');
if (!checkout && !version) {
  console.error('Pass --from-checkout <repo> or --from-registry <version>. See the header.');
  process.exit(2);
}

const PKGS = join(ROOT, 'pkgs');
rmSync(PKGS, { recursive: true, force: true });
mkdirSync(PKGS, { recursive: true });

// `mermaid` is the directory the pages import from; `spec` is what to fetch.
const TARGETS = [
  { dir: 'mermaid', workspace: 'mermaid', published: '@mermaid-js/mermaid', match: /^mermaid-\d/ },
  {
    dir: join('@mermaid-js', 'layout-elk'),
    workspace: 'mermaid-layout-elk',
    published: '@mermaid-js/layout-elk',
    match: /^mermaid-js-layout-elk-/,
  },
  {
    dir: join('@mermaid-js', 'tiny'),
    workspace: 'tiny',
    published: '@mermaid-js/tiny',
    match: /^mermaid-js-tiny-/,
  },
];

for (const target of TARGETS) {
  if (checkout) {
    run('pnpm', ['pack', '--pack-destination', PKGS], join(checkout, 'packages', target.workspace));
  } else {
    run(
      'npm',
      ['pack', `${target.published}@${version}`, ...(registry ? ['--registry', registry] : [])],
      PKGS
    );
  }
}

for (const target of TARGETS) {
  const tarball = readdirSync(PKGS).find((f) => target.match.test(f));
  if (!tarball) {
    throw new Error(`no tarball matching ${target.match} in ${PKGS}`);
  }
  const dest = join(MODULES, target.dir);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  run('tar', ['-xzf', join(PKGS, tarball), '-C', dest, '--strip-components=1']);
  console.log(`extracted ${tarball} -> node_modules/${target.dir}`);
}

if (!existsSync(join(MODULES, 'playwright'))) {
  console.error(
    '\nplaywright is missing. It is a devDependency of this package — run `pnpm install` at the repo root.'
  );
  process.exit(1);
}
console.log('\nNow run: pnpm verify');
