#!/usr/bin/env bash

set -euxo pipefail
# We have to use npm instead of yarn because it causes trouble in netlify

# Link local mermaid to npm
pushd packages/mermaid
npm link
popd

# Clone the Mermaid Live Editor repository
rm -rf mermaid-live-editor
git clone --single-branch https://github.com/mermaid-js/mermaid-live-editor.git

# Link local mermaid to live editor
npm link mermaid

# Install dependencies
npm install --force

# Force Build the site
npm run build -- --force

