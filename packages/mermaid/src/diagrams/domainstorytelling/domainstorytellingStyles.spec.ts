/**
 * A theme that leaves the four `domainstorytelling*Color` variables unset used to
 * interpolate them into the stylesheet as the literal `undefined` — a declaration
 * browsers drop silently, so actor and work object icons lost their color and
 * sequence circles their fill, with nothing in the console. That was live on 6 of
 * the 11 registered themes, because the unit tests only ever rendered the default
 * theme and the e2e spec pins no theme at all.
 *
 * All 11 now define the variables and `domainstorytellingStyles.ts` carries a
 * fallback besides, so these tests are a guard rather than a fix: they fail if a
 * theme is added without the variables and without the fallback holding, and they
 * pin the documented override path the Styling docs promise.
 */
import { describe, expect, it } from 'vitest';
import themes from '../../themes/index.js';
import getStyles from './domainstorytellingStyles.js';

const themeNames = Object.keys(themes) as (keyof typeof themes)[];

// The rationale comments in the stylesheet quote the word "undefined", so match on
// declarations rather than raw text.
const undefinedDeclarations = (css: string) =>
  css
    .replace(/\/\*[\S\s]*?\*\//g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[a-z-]+\s*:\s*undefined\s*;?$/i.test(line));

describe('domainstorytelling styles', () => {
  it.each(themeNames)('%s renders no undefined declaration', (name) => {
    const css = getStyles(themes[name].getThemeVariables({}));
    expect(undefinedDeclarations(css)).toEqual([]);
  });

  it.each(themeNames)('%s honours the documented theme variable overrides', (name) => {
    const css = getStyles(
      themes[name].getThemeVariables({
        domainstorytellingActorColor: '#AA0011',
        domainstorytellingWorkobjectColor: '#00BB22',
        domainstorytellingSequenceColor: '#3300CC',
        domainstorytellingGroupColor: '#DD8800',
      })
    );

    expect(css).toContain('#AA0011');
    expect(css).toContain('#00BB22');
    expect(css).toContain('#3300CC');
    expect(css).toContain('#DD8800');
  });
});
