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
import { mermaidAPI } from './mermaidAPI.js';
import themes from './themes/index.js';

const DEFAULT_THEME = 'redux-color';

/**
 * A variable only the colour themes define -- a cheap fingerprint for the palette.
 * Coalesces to `'none'` rather than letting `JSON.stringify(undefined)` return the value
 * `undefined`, which would make a `.not.toBe('undefined')` assertion pass vacuously.
 */
const fingerprint = (variables: Record<string, unknown> | undefined): string =>
  JSON.stringify(variables?.borderColorArray ?? null) === 'null'
    ? 'none'
    : JSON.stringify(variables?.borderColorArray);

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
    expect(fingerprint(configApi.getConfig().themeVariables)).toBe(fingerprint(expected));
  });

  it('still honours an explicitly chosen theme', () => {
    mermaidAPI.initialize({ theme: 'forest' });
    const config = configApi.getConfig();
    expect(config.theme).toBe('forest');
    // `forest` has no categorical colour arrays, so the fingerprint must go away.
    expect(fingerprint(config.themeVariables)).toBe('none');
  });
});
