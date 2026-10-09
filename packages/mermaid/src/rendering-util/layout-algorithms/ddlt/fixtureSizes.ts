import { readFileSync } from 'node:fs';
import type { LayoutData } from '../../types.js';
import type { SizesFixture } from './types.js';
import { assertSizesFixtureFresh } from './fixtureFreshness.js';

export function loadSizesFixture(path: string): SizesFixture {
  return JSON.parse(readFileSync(path, 'utf-8')) as SizesFixture;
}

export function loadFreshSizesFixture(
  sizesPath: string,
  mmdPath: string,
  fixtureId: string
): SizesFixture {
  const sizes = loadSizesFixture(sizesPath);
  assertSizesFixtureFresh(sizes, {
    fixtureId,
    mmdSource: readFileSync(mmdPath, 'utf-8'),
    requireMetadata: true,
  });
  return sizes;
}

export interface SyntheticSizesOptions {
  /** Minimum width applied to every node. */
  minWidth?: number;
  /** Height applied to every node. */
  height?: number;
  /** Approximate per-character width used to grow nodes with long labels. */
  charWidth?: number;
  /** Extra horizontal padding around the label. */
  padding?: number;
}

const DEFAULTS_CONTENT: Required<SyntheticSizesOptions> = {
  minWidth: 120,
  height: 60,
  charWidth: 8,
  padding: 16,
};

const DEFAULTS_LABEL: Required<SyntheticSizesOptions> = {
  minWidth: 40,
  height: 20,
  charWidth: 7,
  padding: 8,
};

function sizeForLabel(label: string, opts: Required<SyntheticSizesOptions>): number {
  const trimmed = label.length > 0 ? label : '';
  return Math.max(opts.minWidth, trimmed.length * opts.charWidth + opts.padding);
}

/**
 * Pull a printable string from a node without tripping
 * `@typescript-eslint/no-base-to-string`. Prefers `label` when it is already a
 * string; falls back to `id`; otherwise empty.
 */
function readNodeLabel(node: { label?: unknown; id?: unknown }): string {
  const lbl = node.label;
  if (typeof lbl === 'string') {
    return lbl;
  }
  const id = node.id;
  return typeof id === 'string' ? id : '';
}

/**
 * DOM-free stand-in for `createGraphWithElements` content sizing.
 *
 * Use this in DDLT specs whose inputs are synthetic (inline `flowchart` strings
 * or hand-built `LayoutData`) and therefore have no captured `.sizes.json`.
 * Sizes are deterministic functions of the label length so the layout
 * algorithm sees realistic-but-stable rectangles without touching JSDOM.
 *
 * For specs backed by a real `.mmd` fixture, prefer
 * {@link applyFixtureContentSizesStrict} so the test reflects production sizing.
 */
export function applySyntheticContentSizes(
  layout: LayoutData,
  options: SyntheticSizesOptions = {}
): void {
  const opts: Required<SyntheticSizesOptions> = { ...DEFAULTS_CONTENT, ...options };
  for (const node of layout.nodes ?? []) {
    if (node.isGroup) {
      continue;
    }
    if ((node as { isEdgeLabel?: boolean }).isEdgeLabel) {
      continue;
    }
    const label = readNodeLabel(node);
    (node as { width: number }).width = sizeForLabel(label, opts);
    (node as { height: number }).height = opts.height;
  }
}

/** DOM-free stand-in for sizing `isEdgeLabel: true` dummy label nodes. */
export function applySyntheticLabelSizes(
  layout: LayoutData,
  options: SyntheticSizesOptions = {}
): void {
  const opts: Required<SyntheticSizesOptions> = { ...DEFAULTS_LABEL, ...options };
  for (const node of layout.nodes ?? []) {
    if (!(node as { isEdgeLabel?: boolean }).isEdgeLabel) {
      continue;
    }
    const label = readNodeLabel(node);
    (node as { width: number }).width = sizeForLabel(label, opts);
    (node as { height: number }).height = opts.height;
  }
}

function fixtureSizeById(fixture: SizesFixture, id: string) {
  return fixture.nodes.find((n) => n.id === id);
}

/** Apply captured bbox sizes to non-group content nodes (strict: every non-group must have a fixture row). */
export function applyFixtureContentSizesStrict(layout: LayoutData, fixture: SizesFixture): void {
  const known = fixture.nodes.map((n) => n.id).join(', ');
  for (const node of layout.nodes) {
    if (node.isGroup) {
      continue;
    }
    const size = fixtureSizeById(fixture, node.id);
    if (!size) {
      throw new Error(
        `Fixture missing size for parser-produced content node "${node.id}". Known ids: ${known}`
      );
    }
    (node as { width: number; height: number }).width = size.width;
    (node as { width: number; height: number }).height = size.height;
  }
}

/** Apply sizes to nodes with `isEdgeLabel` (strict). */
export function applyFixtureLabelSizesStrict(layout: LayoutData, fixture: SizesFixture): void {
  const known = fixture.nodes.map((n) => n.id).join(', ');
  for (const node of layout.nodes) {
    if (!(node as { isEdgeLabel?: boolean }).isEdgeLabel) {
      continue;
    }
    const size = fixtureSizeById(fixture, node.id);
    if (!size) {
      throw new Error(`Fixture missing label size for "${node.id}". Known ids: ${known}`);
    }
    (node as { width: number; height: number }).width = size.width;
    (node as { width: number; height: number }).height = size.height;
  }
}
