#!/usr/bin/env bash

# We have to use npm instead of yarn because it causes trouble in netlify

# Link local mermaid to npm
pushd packages/mermaid || exit
npm link
popd || exit

# Clone the Mermaid Live Editor repository
git clone https://github.com/mermaid-js/mermaid-live-editor.git

# Change to the repository directory
cd mermaid-live-editor || exit

# Link local mermaid to live editor
npm link mermaid

# Install dependencies
npm install

# Build the site
npm run build
