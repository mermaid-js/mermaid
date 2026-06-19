# Argos visual regression

Per-test screenshots are captured during Cypress runs but **not** uploaded in-run. A dedicated CI job composites them into folder-wise sheets and uploads once to Argos.

## Pipeline

1. **Capture** — `cy.argosScreenshot` writes PNGs to `cypress/screenshots/.../argos/` (local only; no `registerArgosTask` / no in-run upload).
2. **Batch** — `pnpm run argos:batch` groups screenshots by diagram folder, stable-sorts, chunks into fixed-tile sheets, and writes composites + JSON manifests to `cypress/argos-sheets/`.
3. **Upload** — the `argos-batch` CI job runs `argos upload` with the same GitHub Actions auth as develop (no `ARGOS_TOKEN`; OIDC or tokenless via `@argos-ci/core`). `ARGOS_SUBSET=true` on every upload.

## Manual CI run

In GitHub Actions → **E2E** → **Run workflow**:

| Input                | Default   | Description                                  |
| -------------------- | --------- | -------------------------------------------- |
| `group_argos_images` | `true`    | Batch into composite sheets before upload    |
| `spec_pattern`       | _(empty)_ | Cypress spec glob; empty runs the full suite |

When `group_argos_images` is `false`, screenshots upload individually instead of as composite sheets. Both modes use the same Argos project and auth as develop.

## Local workflow

```bash
# Capture (requires dev server on :9000)
RUN_VISUAL_TEST=true CYPRESS_useArgos=true \
  pnpm exec cypress run --spec 'cypress/integration/rendering/treemap/**'

# Composite sheets
pnpm run argos:batch
```

## Configuration

| Env var                   | Default                | Description                              |
| ------------------------- | ---------------------- | ---------------------------------------- |
| `ARGOS_SCREENSHOT_DIR`    | `cypress/screenshots`  | Input directory                          |
| `ARGOS_SHEETS_DIR`        | `cypress/argos-sheets` | Output directory                         |
| `ARGOS_TILES_PER_SHEET`   | `12`                   | Max tiles per composite sheet            |
| `ARGOS_SHEET_COLS`        | `3`                    | Grid columns per sheet                   |
| `ARGOS_SHEET_SCALE`       | `1`                    | Output scale (1 = native, 2 = 2× pixels) |
| `ARGOS_TILE_WIDTH`        | `1440`                 | Fixed cell width (Cypress viewport)      |
| `ARGOS_TILE_IMAGE_HEIGHT` | `1024`                 | Fixed image slot height                  |

CI upload uses GitHub Actions authentication (same as develop’s `registerArgosTask` path — no repo secret required). Every upload sets `ARGOS_SUBSET=true`.

Sheets are grouped by diagram folder (the path prefix before the `*.spec.*` directory segment Cypress inserts). Each cell uses a fixed 1440×1024 image slot (matching the Cypress viewport) so one diagram changing size does not alter grid layout or sibling tiles. Each sheet has a sibling `.json` manifest listing tile names, positions, and source paths for traceability.
