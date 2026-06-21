import type { MermaidConfig } from '../config.type.js';
import { getConfig } from './diagramAPI.js';

/**
 * Returns a diagram section of the current (site + user) config with all
 * fields typed as present.
 *
 * `getConfig()` always merges the full `defaultConfig` (generated from the
 * config JSON schema, where every field has a default) under any user
 * overrides, so every field of every diagram section is guaranteed to be
 * defined at runtime even though the `MermaidConfig` input type marks them
 * optional. This helper centralizes that invariant so renderers don't need
 * non-null assertions on every config access.
 */
export const getRequiredConfig = <K extends keyof MermaidConfig>(
  section: K
): Required<NonNullable<MermaidConfig[K]>> =>
  getConfig()[section] as Required<NonNullable<MermaidConfig[K]>>;
