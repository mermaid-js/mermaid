#!/usr/bin/env bash

watchify src/mermaid.js    -s mermaid    -o dist/mermaid.js &
live-server ./test/examples &
node node_modules/eslint-watch/bin/esw src -w
