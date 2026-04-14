<!-- crag:auto-start -->
# GEMINI.md

> Generated from governance.md by crag. Regenerate: `crag compile --target gemini`

## Project Context

- **Name:** mermaid-monorepo
- **Description:** Markdownish syntax for generating flowcharts, sequence diagrams, class diagrams, gantt charts and git graphs.
- **Stack:** node, typescript, docker
- **Runtimes:** node

## Rules

### Quality Gates

Run these checks in order before committing any changes:

1. [lint] `npm run lint`
2. [lint] `npx tsc --noEmit`
3. [test] `npm run test`
4. [build] `npm run build`
5. [ci (inferred from workflow)] `pnpm run --filter mermaid types:build-config`
6. [ci (inferred from workflow)] `pnpm run docs:build`
7. [ci (inferred from workflow)] `pnpm run build:viz`
8. [ci (inferred from workflow)] `ERROR_MESSAGE+=' make sure your packages are up-to-date by running `pnpm install`.'`
9. [ci (inferred from workflow)] `ERROR_MESSAGE+=' You may also need to delete your prettier cache by running'`
10. [ci (inferred from workflow)] `ERROR_MESSAGE+=' `rm ./node_modules/.cache/prettier/.prettier-cache`.'`
11. [ci (inferred from workflow)] `ERROR_MESSAGE+=' `pnpm run --filter mermaid types:build-config`'`
12. [ci (inferred from workflow)] `ERROR_MESSAGE+=' Run `pnpm run --filter mermaid checkCircle` on your local machine'`

### Security

- No hardcoded secrets — grep for sk_live, AKIA, password= before commit

### Workflow

- Follow project commit conventions
- Run quality gates before committing
- Review security implications of all changes

<!-- crag:auto-end -->
