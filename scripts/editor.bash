#!/usr/bin/env bash

set -euxo pipefail
# We have to use npm instead of yarn because it causes trouble in netlify

# Link local mermaid to npm
pushd packages/mermaid
npm link
popd

# Clone the Mermaid Live Editor repository
git clone https://github.com/mermaid-js/mermaid-live-editor.git

# Change to the repository directory
cd mermaid-live-editor

# Link local mermaid to live editor
npm link mermaid

# Install dependencies
npm install

# Build the site
npm run build
