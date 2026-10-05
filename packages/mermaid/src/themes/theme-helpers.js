import { adjust } from 'khroma';

export const mkBorder = (col, darkMode) =>
  darkMode ? adjust(col, { s: -40, l: 10 }) : adjust(col, { s: -40, l: -10 });

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The value a theme variable takes once the user's override is applied.
 *
 * An object-valued variable such as `xyChart` keeps every key the theme generated and takes the
 * user's keys on top, so overriding one of them does not discard the rest.
 */
export const applyOverride = (generated, override) =>
  isPlainObject(generated) && isPlainObject(override) ? { ...generated, ...override } : override;
