#!/usr/bin/env bash

set -euxo pipefail

pushd packages/mermaid
# Append commit hash to version
jq ".version = .version + \"+${COMMIT_REF:0:7}\"" package.json > package.tmp.json
mv package.tmp.json package.json
popd

pnpm run -r clean
pnpm build:types
pnpm build:mermaid

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

