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

/** Each marble theme variable and the base variable it defaults to. */
const MARBLE_DEFAULTS = {
  marbleTitleColor: 'titleColor',
  marbleLaneColor: 'lineColor',
  marbleLaneLabelColor: 'textColor',
  marbleAxisTextColor: 'textColor',
  marbleGridColor: 'lineColor',
  marbleEventFill: 'primaryColor',
  marbleEventStroke: 'lineColor',
  marbleEventTextColor: 'primaryTextColor',
  marbleLabelColor: 'textColor',
  marbleSpanFill: 'secondaryColor',
  marbleSpanStroke: 'lineColor',
  marbleSpanTextColor: 'secondaryTextColor',
  marbleCompleteColor: 'lineColor',
  marbleErrorColor: 'critBkgColor',
  marbleCancelColor: 'lineColor',
  marbleBreakColor: 'lineColor',
  marbleBreakBkg: 'background',
};

/** Fills every marble variable the theme has no value for from its base variable. */
export const deriveMarbleVariables = (theme) => {
  for (const [key, base] of Object.entries(MARBLE_DEFAULTS)) {
    theme[key] = theme[key] ?? theme[base];
  }
};

/**
 * Forgets the marble variables derived before the user's overrides were known (a theme's
 * constructor may already have run `updateColors()`), so they derive again from the final
 * base colours. Variables the user overrides are kept.
 */
export const resetMarbleVariables = (theme, overrides) => {
  for (const key of Object.keys(MARBLE_DEFAULTS)) {
    if (typeof overrides !== 'object' || overrides === null || !Object.hasOwn(overrides, key)) {
      theme[key] = undefined;
    }
  }
};
