import { withBase } from 'vitepress';

/**
 * Prefixes a root-relative path with the site base, unless it already has it. The mermaid.ai
 * deploy rewrites `/icons/` and `/user-avatars/` in the built JS to `/open-source/...`, and
 * this keeps those paths from being prefixed twice.
 */
export const addBase = (path: string, base: string): string =>
  base !== '/' && path.startsWith(base) ? path : `${base}${path.replace(/^\//, '')}`;

/** {@link addBase} with the current site's base. */
export const withSiteBase = (path: string): string => addBase(path, withBase('/'));
