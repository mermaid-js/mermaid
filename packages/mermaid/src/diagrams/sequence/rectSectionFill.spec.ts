/**
 * A `rect` block shades a section of a sequence diagram. When the author gives no colour, the fill
 * comes from the theme — `rectBkgColor`, falling back to `actorBkg`
 * (`sequenceRenderer.ts` RECT_START).
 *
 * Every theme derives `rectBkgColor` from `tertiaryColor`, and the three modern light themes pin
 * `tertiaryColor = '#ffffff'` against a `#ffffff` background. The band was therefore drawn white on
 * white: present in the DOM, invisible on screen, and impossible to spot in a unit test that only
 * asserts the rect exists.
 *
 * These assertions are about the resolved value rather than about any one theme, so a new theme
 * that lands with the same collision fails here rather than shipping an invisible section.
 */
import { describe, expect, it } from 'vitest';
import themes from '../../themes/index.js';

const themeNames = Object.keys(themes) as (keyof typeof themes)[];

/** The fill RECT_START resolves when the author gives no colour. */
const resolvedRectFill = (theme: Record<string, string>) =>
  theme.rectBkgColor || theme.actorBkg || 'rgba(128, 128, 128, 0.5)';

describe('sequence rect section fill', () => {
  it.each(themeNames)('is distinguishable from the background on the %s theme', (themeName) => {
    const theme = themes[themeName].getThemeVariables() as unknown as Record<string, string>;

    expect(resolvedRectFill(theme).toLowerCase()).not.toBe(theme.background.toLowerCase());
  });

  it.each(themeNames)(
    'stays distinguishable when the background is overridden to black, on the %s theme',
    (themeName) => {
      // darken() is a no-op at #000000, so a derivation that only darkens quietly reproduces the
      // white-on-white bug at the other end of the range. Black-on-black hid from the bare
      // getThemeVariables() assertions above, which never exercise an override.
      const theme = themes[themeName].getThemeVariables({
        background: '#000000',
      }) as unknown as Record<string, string>;

      expect(resolvedRectFill(theme).toLowerCase()).not.toBe('#000000');
    }
  );

  it('is still overridable through themeVariables', () => {
    const theme = themes.redux.getThemeVariables({
      rectBkgColor: '#abcdef',
    }) as unknown as Record<string, string>;

    expect(resolvedRectFill(theme)).toBe('#abcdef');
  });
});
