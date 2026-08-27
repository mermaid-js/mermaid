/**
 * The per-item palette is opt-in per diagram: `clusters.js` and the shape files stamp a
 * `data-color-id` attribute unconditionally, and a diagram only renders colour if its
 * stylesheet emits the matching rules. That gate is a `COLOR_THEMES` set duplicated in
 * each stylesheet, so it is easy to widen one by accident.
 *
 * These assertions are about the gate, not the colours: a stylesheet must stay silent for
 * every theme outside the colour pair, and must emit one rule per palette slot inside it.
 */
import { describe, expect, it } from 'vitest';
import themes from '../../themes/index.js';
import classStyles from '../class/styles.js';
import flowchartStyles from '../flowchart/styles.js';

const STYLESHEETS = {
  class: classStyles,
  flowchart: flowchartStyles,
} as const;

const COLOUR_THEMES = ['redux-color', 'redux-dark-color'];
const PLAIN_THEMES = [
  'default',
  'base',
  'dark',
  'forest',
  'neutral',
  'neo',
  'neo-dark',
  'redux',
  'redux-dark',
];

const render = (name: keyof typeof STYLESHEETS, themeName: string) => {
  const themeVariables = themes[themeName as keyof typeof themes].getThemeVariables({});
  return STYLESHEETS[name]({
    ...(themeVariables as unknown as Record<string, unknown>),
    theme: themeName,
    look: 'classic',
  } as never);
};

describe.each(Object.keys(STYLESHEETS) as (keyof typeof STYLESHEETS)[])('%s stylesheet', (name) => {
  it.each(PLAIN_THEMES)('emits no per-item colour rules for %s', (themeName) => {
    expect(render(name, themeName)).not.toContain('data-color-id');
  });

  it.each(COLOUR_THEMES)('emits one rule per palette slot for %s', (themeName) => {
    const css = render(name, themeName);
    const slots = new Set([...css.matchAll(/data-color-id="(color-\d+)"/g)].map((m) => m[1]));
    expect(slots.size).toBe(12);
  });

  it.each(COLOUR_THEMES)('never marks palette rules !important for %s', (themeName) => {
    // User `classDef` / `style` declarations land in an inline `style` attribute. If the
    // palette rules were !important they would silently outrank explicit user intent.
    // Match only the declaration body of each palette rule -- the rest of the stylesheet
    // uses !important legitimately.
    const css = render(name, themeName);
    const bodies = [...css.matchAll(/\[data-color-id="color-\d+"][^{]*{([^}]*)}/g)].map(
      (m) => m[1]
    );
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.filter((body) => body.includes('!important'))).toEqual([]);
  });
});
