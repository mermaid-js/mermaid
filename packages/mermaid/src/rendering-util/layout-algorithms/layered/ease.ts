// Based on Pele (https://github.com/obsidianmd/pele), src/layout/layered.ts.
// Copyright (c) 2026 kepano. MIT License: see packages/mermaid/THIRD_PARTY_NOTICES.
// Ported from mermaid-v13 `packages/core/src/layout/layered/layered.ts` (`ease`).
// Kept in a module of its own so the shared edge drawing (`routePath`) can use it without
// pulling the whole engine into the core bundle. `layered.ts` re-exports it unchanged.
// cspell:ignore kepano

// How far along the flow the handles of a plain S reach, as a share of the way it travels along
// it. Half gives an even S. One that runs more than eight times as far across as along turns
// sooner and crosses in a straighter line, down to a quarter at sixteen times. The layout uses
// this to tell how near two curves will pass, and the drawing to draw them.
export function ease(across: number, along: number): number {
  return Math.max(0.25, Math.min(0.5, (4 * Math.abs(along)) / (Math.abs(across) || 1)));
}
