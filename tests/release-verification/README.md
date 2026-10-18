# Release verification

Three standalone HTML pages that load the **packaged** mermaid artifacts from
`./node_modules` and check, in a real browser, that the ELK-as-default release
behaves as intended. Nothing here imports the mermaid source tree, so it
exercises what consumers actually install.

| page                              | asserts                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `a-mermaid-elk-and-dagre.html`    | full `mermaid` runs ELK **and** dagre; ELK is the default; `elk.*` variants work; neither engine logs anything the other does not |
| `b-tiny-falls-back-to-dagre.html` | `@mermaid-js/tiny`, which omits ELK, still renders flowchart and state by falling back to dagre — and says so                     |
| `c-tiny-with-elk-plugin.html`     | registering `@mermaid-js/layout-elk` onto tiny actually gets you ELK, with host config reaching the plugin                        |

Each page records a list of named checks on `window.__result`; `verify.mjs`
serves the directory, drives all three in a headless browser, and prints PASS/FAIL per
check, exiting non-zero if any fail.

## Run

From this directory, against the current checkout:

```bash
pnpm build        # at the repo root, so there are dist files to pack
pnpm setup
pnpm verify
```

`setup` packs the three packages with `pnpm pack` — the same tarballs
`npm publish` uploads — and extracts them into `node_modules`.

Against published preview versions instead:

```bash
node setup.mjs --from-registry 12.0.0-preview.349 --registry https://npm.pkg.github.com
pnpm verify
```

`mermaid` is fetched as `@mermaid-js/mermaid`, the name previews are published
under, and placed at `node_modules/mermaid` so the pages are identical in both
modes. GitHub Packages needs a token with `read:packages`:

```bash
npm set //npm.pkg.github.com/:_authToken <token>
```

## Why it is built this way

**Tarballs are extracted, not `npm install`ed.** All three bundles are
self-contained, so they need no dependency resolution — and installing a
`file:` tarball whose version has not changed silently serves npm's cached
copy, which means quietly verifying a stale artifact. That happened while these
checks were being written and cost real debugging time.

**"Did ELK actually run?" is answered by geometry, not config.** Each check
compares node `transform` attributes between engines. Identical geometry means
the same engine ran, so a silent fallback cannot pass a test that claims ELK
was used.

**Warnings are attributed per render.** A warning both engines emit is
pre-existing and says nothing about ELK, so it is not charged to ELK. This is
what caught `Unknown arrow type: arrow_open`, which only ELK-laid-out state
diagrams emitted.

**(b) proves the fallback rather than assuming it** by requiring tiny's default
geometry to be _identical to explicit dagre_, and requiring the fallback to be
announced in the log.

**(c) renders once before registering the plugin** and requires that render to
match dagre, so the post-registration difference is attributable to the plugin
and not to something else changing.

**`arrowMarkerAbsolute` in (c)** is the sharpest probe that host config reaches
the plugin: it is the exact setting that broke when the plugin's own bundled
config module never saw `initialize()`.
