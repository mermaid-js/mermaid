/**
 * Note text is drawn as `<text class="noteText">` wrapping one `<tspan>` per line. The weight the
 * user asked for — `sequence.noteFontWeight`, schema default 400 — is applied by `drawText` as an
 * inline style on the `<text>` element only; the tspan elements carry no weight of their own and inherit it.
 *
 * So a stylesheet rule matching `.noteText > tspan` beats the config outright: the inline style on
 * the parent never reaches the tspan that actually renders the glyphs. That is how the redux themes
 * came to force bold notes — they set the *theme variable* `noteFontWeight` to 600, which is a
 * different value from the identically-named sequence config key, and the stylesheet emitted it at
 * tspan level.
 *
 * The theme variable cannot simply be lowered: `git/styles.js` reads it as its bold-label weight
 * under redux and neo (`useReduxGeometry` / `useNeoColorGen`), so changing it there would un-bold
 * git branch and commit labels. The fix therefore belongs here — sequence stops emitting a weight
 * into its stylesheet, and the documented config key governs note weight on every theme.
 */
import { describe, expect, it } from 'vitest';
import themes from '../../themes/index.js';
import getStyles from './styles.js';

const themeNames = Object.keys(themes) as (keyof typeof themes)[];

/** The declaration block for a selector, as emitted into the stylesheet. */
const ruleFor = (css: string, selector: string): string | undefined =>
  new RegExp(`(?:^|\\})[^{}]*${selector.replaceAll('.', '\\.')}[^{}]*\\{([^}]*)\\}`).exec(css)?.[1];

describe('sequence note font weight', () => {
  it.each(themeNames)('does not force a weight on note text under the %s theme', (themeName) => {
    const css = getStyles(themes[themeName].getThemeVariables());

    const noteTextRule = ruleFor(css, '.noteText');
    expect(noteTextRule).toBeDefined();
    expect(noteTextRule).not.toMatch(/font-weight/);
  });

  it('leaves the theme variable alone, because git depends on it', () => {
    // Pinning the constraint that forced a sequence-scoped fix rather than a theme change.
    expect(themes['redux-color'].getThemeVariables().noteFontWeight).toBe(600);
    expect(themes.redux.getThemeVariables().noteFontWeight).toBe(600);
  });
});
