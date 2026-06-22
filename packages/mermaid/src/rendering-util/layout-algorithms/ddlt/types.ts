import type { LayoutData } from '../../types.js';

/** Node size entry as captured in `.sizes.json` fixtures. */
export interface FixtureNodeSize {
  id: string;
  width: number;
  height: number;
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
}

/** JSON shape of `*.sizes.json` under `cypress/platform/dev-diagrams/layout-tests`. */
export interface SizesFixture {
  metadata?: SizesFixtureMetadata;
  nodes: FixtureNodeSize[];
}

/** How to prepare parsed `LayoutData` before running a layout backend. */
export type DdltFixtureProfile = 'flowchart-domus' | 'swimlanes';

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

export type LayoutTestBackendId = 'domus-orthogonal' | 'swimlanes';

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
