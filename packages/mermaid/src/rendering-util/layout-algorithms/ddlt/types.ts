import type { LayoutData } from '../../types.js';

/** Node size entry as captured in `.sizes.json` fixtures. */
export interface FixtureNodeSize {
  id: string;
  width: number;
  height: number;
  /**
   * Measured label box, i.e. what `labelHelper` returned for this node.
   *
   * Optional because fixtures captured before capture version 2 predate it.
   * It is the input a shape handler needs to rebuild its own geometry: a
   * shape's outline (and therefore its `intersect`) is a function of the label
   * box plus padding, and that is not recoverable from `width`/`height` alone
   * because the padding differs per shape and per `look`.
   */
  labelBBox?: { width: number; height: number };
}

/** Metadata used to prove captured browser sizes still describe the current fixture input. */
export interface SizesFixtureMetadata {
  /** Increment when the browser size-capture contract changes. */
  captureVersion?: number;
  /** SHA-256 of the normalized `.mmd` fixture source captured with these sizes. */
  sourceSha256?: string;
  /** Optional human-readable capture timestamp. */
  capturedAt?: string;
  /** Optional capture context, e.g. `theme=default&look=classic`. */
  capturedFrom?: string;
  /**
   * Theme and look the capture was taken at.
   *
   * Recorded in their own fields, rather than left inside the free-text
   * `capturedFrom`, because they change the measured sizes AND the shape
   * outlines (`look: 'neo'` uses different padding than `'classic'`), so a
   * fixture captured at one configuration does not describe another. Asserted
   * by `assertSizesFixtureFresh` so a re-capture at the wrong configuration
   * fails loudly instead of quietly moving the baseline.
   */
  theme?: string;
  look?: string;
}

/**
 * Measured label box of a group (cluster) node.
 *
 * Captured separately from {@link FixtureNodeSize} because a group's own
 * width/height are an OUTPUT of layout, not an input — only its label box is an
 * input, and ELK derives a compound node's minimum size from it.
 */
export interface FixtureGroupLabelSize {
  id: string;
  labelBBox: { width: number; height: number };
}

/**
 * Measured label box of an edge, keyed by edge id.
 *
 * Layouts that turn edge labels into dummy nodes (domus, swimlanes) get these
 * for free as {@link FixtureNodeSize} entries. ELK does not: it keeps the label
 * on the edge and reads `edge.width` / `edge.height`, so those have to be
 * captured in their own right.
 */
export interface FixtureEdgeLabelSize {
  id: string;
  width: number;
  height: number;
}

/**
 * JSON shape of `*.sizes.json` under `e2e/platform/dev-diagrams/layout-tests`.
 *
 * `groups` and `edges` are optional and were added after the first fixtures were
 * captured, so a fixture predating them stays valid for the backends that never
 * needed them. Backends that DO need them use the strict appliers, which throw
 * on a missing array rather than silently laying out with zero-size labels.
 */
export interface SizesFixture {
  metadata?: SizesFixtureMetadata;
  nodes: FixtureNodeSize[];
  groups?: FixtureGroupLabelSize[];
  edges?: FixtureEdgeLabelSize[];
}

/** How to prepare parsed `LayoutData` before running a layout backend. */
export type DdltFixtureProfile = 'flowchart-domus' | 'flowchart-elk' | 'swimlanes';

export interface DdltManifestEntry {
  /** Relative path without extension, e.g. `swimlanes/1-simple` or `Company-simp`. */
  id: string;
  profile: DdltFixtureProfile;
  /** When true, sweep still runs the backend but does not fail Level 1 on `validateLayout`. */
  allowLevel1Failure?: boolean;
}

export interface DdltManifest {
  fixtures?: DdltManifestEntry[];
}

export type LayoutTestBackendId = 'domus-orthogonal' | 'elk' | 'swimlanes';

/** Pure layout stage: mutates `layout` in place (DOM-free). */
export type LayoutTestBackend = (layout: LayoutData) => void | Promise<void>;

export interface LayoutTestFixture {
  /** Relative path without extension. */
  id: string;
  sizesPath: string;
  mmdPath: string;
  sizes: SizesFixture;
  profile: DdltFixtureProfile;
  allowLevel1Failure: boolean;
}

/**
 * Opaque trace object passed through to the routing backend. On the swimlanes
 * backend this is unused. Kept as a structural stand-in so call sites compile
 * before the domus subtree (which owns the rich `OrthogonalTrace` definition)
 * lands on this branch. When domus eventually merges, its richer type can
 * extend or replace this.
 */
export interface OrthogonalTrace {
  stages?: unknown[];
  edges?: Record<string, unknown>;
  bundleOrder?: Record<string, string[]>;
}
