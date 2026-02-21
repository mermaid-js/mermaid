# CLAUDE.md

## Commands

```bash
pnpm install          # Install deps (uses pnpm workspaces)
pnpm build            # Full build (esbuild + TypeScript declarations)
pnpm build:mermaid    # Build only the mermaid package
pnpm lint             # ESLint + Prettier check
pnpm lint:fix         # Auto-fix lint + formatting issues
pnpm ci               # Unit tests only (vitest)
pnpm test             # Lint + unit tests
pnpm e2e              # Cypress end-to-end tests
pnpm dev              # Dev server (esbuild)
pnpm dev:vite         # Dev server (vite)
```

Use pnpm (not npm/yarn). This is a monorepo — packages are in `packages/`.

## Architecture

TypeScript monorepo with pnpm workspaces. Core library is `packages/mermaid/`. Parser is `packages/parser/`. Other packages: `mermaid-layout-elk`, `mermaid-layout-tidy-tree`, `mermaid-zenuml`, `mermaid-example-diagram`.

Build: esbuild for bundling (`.esbuild/build.ts`), tsc for type declarations. Dev server via Vite.

Tests: vitest for unit tests, Cypress for e2e tests (with image snapshots). Coverage via `@vitest/coverage-v8`.

Config: ESLint flat config (`eslint.config.js`), Prettier (`.prettierrc.json` — 100 char width, 2 spaces, single quotes).

## Git Workflow

Commits MUST use [Conventional Commits](https://www.conventionalcommits.org/) (`<type>(<scope>): <desc>`). Types: feat, fix, refactor, docs, test, chore, ci, style, perf, build. Use `!` for breaking changes.

Husky pre-commit hook runs lint-staged (ESLint fix + Prettier on staged files).

## Code Style

- Fail loudly: throw errors over logging warnings for critical issues
- Let exceptions propagate — only catch with a specific recovery action
- Un-nest conditionals; combine related checks

## Pull Requests

Use the `/pr-creation` skill. Include a `## Lessons Learned` section if you discovered generalizable insights — the `phone-home.yaml` workflow propagates these to the template repo on merge.

### Hook Errors

**NEVER disable, bypass, or work around hooks.** If a hook fails, **tell the user** what failed and why, then fix the underlying issue. If any hook fails (SessionStart, PreToolUse, PostToolUse, Stop, or git hooks), you MUST:

1. **Warn prominently** — identify which hook, the error output, and files involved
2. **Propose a fix PR** — check `.claude/hooks/` or `.husky/` for the source
3. **Assess scope** — repo-specific issues: fix here. General issues: also PR the [template repo](https://github.com/alexander-turner/claude-automation-template)
