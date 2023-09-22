#!/usr/bin/env bash

set -euxo pipefail
pnpm build

echo "$COMMIT_REF"

# Clone the Mermaid Live Editor repository
rm -rf mermaid-live-editor
git clone --single-branch https://github.com/mermaid-js/mermaid-live-editor.git

cd mermaid-live-editor

# We have to use npm instead of yarn because it causes trouble in netlify
# Install dependencies
npm install

# Link local mermaid to live editor
npm link ../packages/mermaid     

# Force Build the site
npm run build -- --force

