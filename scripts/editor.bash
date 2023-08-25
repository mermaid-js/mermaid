#!/usr/bin/env bash

set -euxo pipefail
# We have to use npm instead of yarn because it causes trouble in netlify

# Link local mermaid to npm
pushd packages/mermaid
npm link
popd

# Clone or update the Mermaid Live Editor repository
if [ ! -d "mermaid-live-editor" ]; then
  git clone --single-branch https://github.com/mermaid-js/mermaid-live-editor.git
  cd mermaid-live-editor
else
  cd mermaid-live-editor
  git pull
fi

# Link local mermaid to live editor
npm link mermaid

# Install dependencies
npm install

# Build the site
npm run build
