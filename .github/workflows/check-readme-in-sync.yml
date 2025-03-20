# Reference: https://github.com/Yash-Singh1/eslint-plugin-userscripts/blob/main/.github/workflows/readme-in-sync.yml

name: Check if README and docs/README are in sync

on:
  push:
    branches:
      - gh-pages
  pull_request:
    branches:
      - gh-pages

permissions:
  contents: read

jobs:
  check-readme:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Check for difference in README.md and docs/README.md
        run: |
          if [ -z "$(diff README.md docs/README.md --brief)" ]
          then
            echo "README.md and docs/README.md are in sync"
          else
            echo "Make sure that README.md and docs/README.md are in sync"
            echo
            echo "Difference:"
            echo
            diff README.md docs/README.md -u
            exit 1
          fi
