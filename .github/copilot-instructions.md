<!-- crag:auto-start -->

# Copilot Instructions — mermaid-monorepo

> Generated from governance.md by crag. Regenerate: `crag compile --target copilot`

Markdownish syntax for generating flowcharts, sequence diagrams, class diagrams, gantt charts and git graphs.

**Stack:** node, typescript, docker

## Runtimes

node

## Quality Gates

When you propose changes, the following checks must pass before commit:

- **lint**: `npm run lint`
- **lint**: `npx tsc --noEmit`
- **test**: `npm run test`
- **build**: `npm run build`
- **ci (inferred from workflow)**: `pnpm run --filter mermaid types:build-config`
- **ci (inferred from workflow)**: `pnpm run docs:build`
- **ci (inferred from workflow)**: `pnpm run build:viz`
- **ci (inferred from workflow)**: `ERROR_MESSAGE+=' make sure your packages are up-to-date by running `pnpm install`.'`
- **ci (inferred from workflow)**: `ERROR_MESSAGE+=' You may also need to delete your prettier cache by running'`
- **ci (inferred from workflow)**: `ERROR_MESSAGE+=' `rm ./node_modules/.cache/prettier/.prettier-cache`.'`
- **ci (inferred from workflow)**: `ERROR_MESSAGE+=' `pnpm run --filter mermaid types:build-config`'`
- **ci (inferred from workflow)**: `ERROR_MESSAGE+=' Run `pnpm run --filter mermaid checkCircle` on your local machine'`

## Expectations for AI-Assisted Code

1. **Run gates before suggesting a commit.** If you cannot run them (no shell access), explicitly remind the human to run them.
2. **Respect classifications.** `MANDATORY` gates must pass. `OPTIONAL` gates should pass but may be overridden with a note. `ADVISORY` gates are informational only.
3. **Respect workspace paths.** When a gate is scoped to a subdirectory, run it from that directory.
4. **No hardcoded secrets.** - No hardcoded secrets — grep for sk_live, AKIA, password= before commit
5. Follow project commit conventions.
6. **Conservative changes.** Do not rewrite unrelated files. Do not add new dependencies without explaining why.

## Tool Context

This project uses **crag** (https://www.npmjs.com/package/@whitehatd/crag) as its AI-agent governance layer. The `governance.md` file is the authoritative source. If you have shell access, run `crag check` to verify the infrastructure and `crag diff` to detect drift.

<!-- crag:auto-end -->
