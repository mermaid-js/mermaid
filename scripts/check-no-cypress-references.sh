#!/usr/bin/env bash
# Mermaid has moved on from Cypress to Playwright: the E2E suite now lives in
# `e2e/` and runs via `pnpm e2e`. This check fails CI when any tracked file
# path or file content still references Cypress, so stale references (or an
# accidental reintroduction) can't creep back in.
#
# Run it locally with: ./scripts/check-no-cypress-references.sh
#
# cspell:ignore toplevel PATHSPECS

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# The only files allowed to mention Cypress are this check and its workflow.
ALLOWED_PATHS=(
  'scripts/check-no-cypress-references.sh'
  '.github/workflows/no-cypress-references.yml'
)

EXCLUDE_PATHSPECS=()
GREP_EXCLUDES=()
for path in "${ALLOWED_PATHS[@]}"; do
  EXCLUDE_PATHSPECS+=(":(exclude)${path}")
  GREP_EXCLUDES+=(-e "^${path}$")
done

failed=0

path_matches=$(git ls-files | grep -i cypress | grep -v "${GREP_EXCLUDES[@]}" || true)
if [[ -n $path_matches ]]; then
  echo 'Tracked paths referencing Cypress:'
  echo "$path_matches"
  failed=1
fi

if content_matches=$(git grep -I -i -n cypress -- . "${EXCLUDE_PATHSPECS[@]}"); then
  echo 'File contents referencing Cypress:'
  echo "$content_matches"
  failed=1
fi

if [[ $failed -ne 0 ]]; then
  cat >&2 <<'EOF'

✖ Cypress references found.

We've moved on from Cypress to Playwright. The E2E suite lives in `e2e/` and
runs via `pnpm e2e` (see `playwright.config.ts`). Please remove the references
listed above — point docs, comments, and configs at their Playwright
equivalents instead of Cypress.
EOF
  exit 1
fi

echo '✓ No Cypress references found (E2E testing uses Playwright, see e2e/).'
