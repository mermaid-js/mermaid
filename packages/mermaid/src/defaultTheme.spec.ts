/**
 * The default theme is encoded in three places that have to agree:
 *
 *  1. `config.schema.yaml`, whose `theme.default` becomes `defaultConfigJson.theme`.
 *  2. `defaultConfig.ts`, which sets `themeVariables` explicitly (a non-JSON default, so the
 *     schema cannot supply it).
 *  3. `mermaidAPI.ts`, in the branch taken when no theme is given *or* an unrecognised one
 *     is given.
 *
 * If they drift, nothing throws: `theme` reports one theme while `themeVariables` carries
 * another's palette, and diagrams render in a mixture that is very hard to attribute. So
 * assert the name and the variables agree, rather than just asserting the name.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as configApi from './config.js';
import erStyles from './diagrams/er/styles.js';
import { mermaidAPI } from './mermaidAPI.js';
import themes from './themes/index.js';

const DEFAULT_THEME = 'redux-color';

/**
 * A variable only the colour themes define -- a cheap fingerprint for the palette.
 * Returns the sentinel `'none'` rather than letting `JSON.stringify(undefined)` yield the
 * *value* `undefined`, which would make a `.not.toBe('undefined')` assertion pass
 * vacuously.
 */
const fingerprint = (variables: Record<string, unknown> | undefined): string =>
  Array.isArray(variables?.borderColorArray) ? JSON.stringify(variables.borderColorArray) : 'none';

describe('default theme', () => {
  beforeEach(() => {
    configApi.reset();
    configApi.setSiteConfig({});
  });

  it(`is ${DEFAULT_THEME}`, () => {
    expect(configApi.getConfig().theme).toBe(DEFAULT_THEME);
  });

  it('ships themeVariables matching the theme it names', () => {
    const config = configApi.getConfig();
    const expected = themes[DEFAULT_THEME].getThemeVariables({}) as unknown as Record<
      string,
      unknown
    >;
    expect(fingerprint(config.themeVariables)).toBe(fingerprint(expected));
    expect(fingerprint(config.themeVariables)).not.toBe('none');
  });

  it('resolves themeVariables to the default theme when initialize is given no theme', () => {
    mermaidAPI.initialize({});
    const expected = themes[DEFAULT_THEME].getThemeVariables({}) as unknown as Record<
      string,
      unknown
    >;
    expect(fingerprint(configApi.getConfig().themeVariables)).toBe(fingerprint(expected));
  });

  it('falls back to the default theme for an unrecognised theme name', () => {
    // @ts-expect-error deliberately not a member of the theme union
    mermaidAPI.initialize({ theme: 'not-a-real-theme' });
    const expected = themes[DEFAULT_THEME].getThemeVariables({}) as unknown as Record<
      string,
      unknown
    >;
    const config = configApi.getConfig();
    expect(fingerprint(config.themeVariables)).toBe(fingerprint(expected));
    // The name has to be normalised too, not just the variables. Leaving the unrecognised
    // name in place is what this file's header warns about: `theme` reports one thing while
    // `themeVariables` carries another's palette. It is not cosmetic -- every stylesheet
    // gates its palette rules on the *name*, so the palette would be loaded and never used.
    expect(config.theme).toBe(DEFAULT_THEME);
  });

  it('emits palette CSS for an unrecognised theme name, not just palette variables', () => {
    // The consequence of the name and the variables disagreeing, asserted where it shows.
    // `createUserStyles` hands the stylesheet `config.themeVariables` together with
    // `config.theme`, and `er/styles.ts` gates on the name -- so a stale name means the
    // palette is present in the variables and absent from the CSS.
    // @ts-expect-error deliberately not a member of the theme union
    mermaidAPI.initialize({ theme: 'not-a-real-theme' });
    const config = configApi.getConfig();
    const css = erStyles({
      ...(config.themeVariables as unknown as Record<string, unknown>),
      theme: config.theme,
      look: 'classic',
      THEME_COLOR_LIMIT: 12,
    } as never);
    expect(css).toContain('[data-color-id="color-0"]');
  });

  it("preserves the 'null' sentinel, which disables the pre-defined themes", () => {
    // Documented in the schema as "Can be set to disable any pre-defined mermaid theme".
    // Normalising it to the default theme name would re-enable one, so the fallback must
    // leave this value alone even though it is not a registered theme.
    mermaidAPI.initialize({ theme: 'null' });
    expect(configApi.getConfig().theme).toBe('null');
  });

  it('still honours an explicitly chosen theme', () => {
    mermaidAPI.initialize({ theme: 'forest' });
    const config = configApi.getConfig();
    expect(config.theme).toBe('forest');
    // `forest` has no categorical colour arrays, so the fingerprint must go away.
    expect(fingerprint(config.themeVariables)).toBe('none');
  });
});
