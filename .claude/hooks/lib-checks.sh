#!/bin/bash
# Shared helpers for Claude Code hook scripts

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 1

exists() { command -v "$1" &>/dev/null; }

has_script() {
  [[ -f package.json ]] &&
    jq -e ".scripts.$1" package.json &>/dev/null &&
    ! jq -r ".scripts.$1" package.json | grep -q "ERROR: Configure"
}
