/**
 * The theme name and the theme variables have to agree. If they drift nothing throws --
 * `theme` names one theme while `themeVariables` carries another's palette, and diagrams
 * render in a mixture. Resolution order is `config.appearance.spec.ts`'s subject, not this
 * file's.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as configApi from './config.js';
import erStyles from './diagrams/er/styles.js';
import { mermaidAPI } from './mermaidAPI.js';
import themes from './themes/index.js';

/** What mermaid renders with when neither the user nor the diagram type says otherwise. */
const GLOBAL_DEFAULT_THEME = 'default';

/** What the diagram types redesigned for it default to instead. */
const DIAGRAM_DEFAULT_THEME = 'redux-color';

/**
 * A variable only the colour themes define -- a cheap fingerprint for the palette.
 * Returns the sentinel `'none'` rather than letting `JSON.stringify(undefined)` yield the
 * *value* `undefined`, which would make a `.not.toBe('undefined')` assertion pass
 * vacuously.
 */
const fingerprint = (variables: Record<string, unknown> | undefined): string =>
  Array.isArray(variables?.borderColorArray) ? JSON.stringify(variables.borderColorArray) : 'none';

const fingerprintOf = (name: keyof typeof themes) =>
  fingerprint(themes[name].getThemeVariables({}) as unknown as Record<string, unknown>);

describe('default theme', () => {
  beforeEach(() => {
    configApi.saveConfigFromInitialize({});
    configApi.setSiteConfig({});
    configApi.reset();
  });

  it(`is ${GLOBAL_DEFAULT_THEME} outside of any diagram`, () => {
    expect(configApi.getConfig().theme).toBe(GLOBAL_DEFAULT_THEME);
  });

  it('ships themeVariables matching the theme it names', () => {
    const config = configApi.getConfig();
    expect(fingerprint(config.themeVariables)).toBe(fingerprintOf(GLOBAL_DEFAULT_THEME));
  });

  it('resolves themeVariables to the default theme when initialize is given no theme', () => {
    mermaidAPI.initialize({});
    expect(fingerprint(configApi.getConfig().themeVariables)).toBe(
      fingerprintOf(GLOBAL_DEFAULT_THEME)
    );
  });

  it('falls back to the default theme for an unrecognised theme name', () => {
    // @ts-expect-error deliberately not a member of the theme union
    mermaidAPI.initialize({ theme: 'not-a-real-theme' });
    const config = configApi.getConfig();
    expect(fingerprint(config.themeVariables)).toBe(fingerprintOf(GLOBAL_DEFAULT_THEME));
    // The name too, not just the variables: stylesheets gate their palette rules on it.
    expect(config.theme).toBe(GLOBAL_DEFAULT_THEME);
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

  describe('when a diagram type defaults to a different theme', () => {
    /**
     * The config the renderers are handed. Scope is bounded to the parse, so it is
     * re-established here over the same directives to read back its resolution.
     */
    const configFor = async (text: string) => {
      const { diagramType } = await mermaidAPI.parse(text);
      configApi.setDiagramConfigScope(diagramType);
      const config = configApi.getConfig();
      configApi.setDiagramConfigScope(undefined);
      return config;
    };

    it('carries that theme and its variables together', async () => {
      const config = await configFor('erDiagram\n  CUSTOMER ||--o{ ORDER : places');
      expect(config.theme).toBe(DIAGRAM_DEFAULT_THEME);
      expect(fingerprint(config.themeVariables)).toBe(fingerprintOf(DIAGRAM_DEFAULT_THEME));
      expect(fingerprint(config.themeVariables)).not.toBe('none');
    });

    it('emits palette CSS, not just palette variables', async () => {
      // Where a name/variables disagreement would show: `er/styles.ts` gates on the name,
      // so a stale one leaves the palette in the variables and absent from the CSS.
      const config = await configFor('erDiagram\n  CUSTOMER ||--o{ ORDER : places');
      const css = erStyles({
        ...(config.themeVariables as unknown as Record<string, unknown>),
        theme: config.theme,
        look: config.look,
        THEME_COLOR_LIMIT: 12,
      } as never);
      expect(css).toContain('[data-color-id="color-0"]');
    });

    it('leaves the theme alone for a diagram type that did not opt in', async () => {
      const config = await configFor('pie\n  "Dogs" : 40');
      expect(config.theme).toBe(GLOBAL_DEFAULT_THEME);
      expect(fingerprint(config.themeVariables)).toBe(fingerprintOf(GLOBAL_DEFAULT_THEME));
    });
  });
});
