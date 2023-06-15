# Contributing

Please read in detail about how to contribute documentation and code on the [Mermaid documentation site.](https://mermaid-js.github.io/mermaid/#/development)

---

# Mermaid contribution cheat-sheet

## Requirements

- [volta](https://volta.sh/) to manage node versions.
- [Node.js](https://nodejs.org/en/). `volta install node`
- [pnpm](https://pnpm.io/) package manager. `volta install pnpm`

## Development Installation

```bash
git clone git@github.com:mermaid-js/mermaid.git
cd mermaid
# npx is required for first install as volta support for pnpm is not added yet.
npx pnpm install
pnpm test
```

## Testing

```bash
# Run unit test
pnpm test
# Run unit test in watch mode
pnpm test:watch
# Run E2E test
pnpm e2e
# Debug E2E tests
pnpm dev
pnpm cypress:open # in another terminal
```

## Branch name format:

```text
   [feature | bug | chore | docs]/[issue number]_[short description using dashes ('-') or underscores ('_') instead of spaces]
```

eg: `feature/2945_state-diagram-new-arrow-florbs`, `bug/1123_fix_random_ugly_red_text`

## Documentation

Documentation is necessary for all non bugfix/refactoring changes.

Only make changes to files are in [`/packages/mermaid/src/docs`](packages/mermaid/src/docs)

**_DO NOT CHANGE FILES IN `/docs`_**

[Join our slack community if you want closer contact!](https://join.slack.com/t/mermaid-talk/shared_invite/enQtNzc4NDIyNzk4OTAyLWVhYjQxOTI2OTg4YmE1ZmJkY2Y4MTU3ODliYmIwOTY3NDJlYjA0YjIyZTdkMDMyZTUwOGI0NjEzYmEwODcwOTE)
