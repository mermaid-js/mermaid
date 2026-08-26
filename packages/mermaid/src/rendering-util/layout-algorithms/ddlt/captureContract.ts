/**
 * Capture contract version.
 *
 * 2 — added per-node `labelBBox` and `theme`/`look` metadata, both required by
 *     the JSDOM measure path (it re-runs the real shape handlers, which need
 *     the label box, and shape geometry depends on `look`).
 * 1 — node/group/edge sizes only.
 */
export const DDLT_SIZE_CAPTURE_VERSION = 2;
