---
trigger: always_on
description: Governance rules for mermaid-monorepo — compiled from governance.md by crag
---

# Windsurf Rules — mermaid-monorepo

Generated from governance.md by crag. Regenerate: `crag compile --target windsurf`

## Project

Markdownish syntax for generating flowcharts, sequence diagrams, class diagrams, gantt charts and git graphs.

**Stack:** node, typescript, docker

## Runtimes

node

## Cascade Behavior

When Windsurf's Cascade agent operates on this project:

- **Always read governance.md first.** It is the single source of truth for quality gates and policies.
- **Run all mandatory gates before proposing changes.** Stop on first failure.
- **Respect classifications.** OPTIONAL gates warn but don't block. ADVISORY gates are informational.
- **Respect path scopes.** Gates with a `path:` annotation must run from that directory.
- **No destructive commands.** Never run rm -rf, dd, DROP TABLE, force-push to main, curl|bash, docker system prune.
- - No hardcoded secrets — grep for sk_live, AKIA, password= before commit
- Follow the project commit conventions.

## Quality Gates (run in order)

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run test`
4. `npm run build`
5. `pnpm run --filter mermaid types:build-config`
6. `pnpm run docs:build`
7. `pnpm run build:viz`
8. `ERROR_MESSAGE+=' make sure your packages are up-to-date by running `pnpm install`.'`
9. `ERROR_MESSAGE+=' You may also need to delete your prettier cache by running'`
10. `ERROR_MESSAGE+=' `rm ./node_modules/.cache/prettier/.prettier-cache`.'`
11. `ERROR_MESSAGE+=' `pnpm run --filter mermaid types:build-config`'`
12. `ERROR_MESSAGE+=' Run `pnpm run --filter mermaid checkCircle` on your local machine'`

## Rules of Engagement

1. **Minimal changes.** Don't rewrite files that weren't asked to change.
2. **No new dependencies** without explicit approval.
3. **Prefer editing** existing files over creating new ones.
4. **Always explain** non-obvious changes in commit messages.
5. **Ask before** destructive operations (delete, rename, migrate schema).

---

**Tool:** crag — https://www.npmjs.com/package/@whitehatd/crag
