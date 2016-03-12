#!/usr/bin/env bash

watchify src/mermaid.js    -s mermaid -t babelify  -o dist/mermaid.js &
gulp live-server &
node node_modules/eslint-watch/bin/esw src -w
