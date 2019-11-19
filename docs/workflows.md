# Workflows

The automation of mermaid relies on [GitHub Actions](https://github.com/features/actions). There are several workflows to automate common tasks or for CI/CD.

## CI
Builds run on push or pull requests. They are done in a matrix build with `Node 10` and `Node 12`.

The yarn cache is preserved between runs to increase build time. The cache is set up with the hash of the `yarn.lock` file. This means that every time it changes the cache get's regenerated. This ensures always up to date packages with minimal total cache size.

## CD

*wip*
