import { afterEach, describe, expect, it } from 'vitest';
import * as configApi from '../../config.js';
import themes from '../../themes/index.js';

const zoneAndEcosystemKeys = [
  'pioneersStroke',
  'pioneersFill',
  'settlersStroke',
  'settlersFill',
  'townplannersStroke',
  'townplannersFill',
  'ecosystemOuterFill',
  'ecosystemMiddleFill',
  'ecosystemInnerFill',
];

const wardleyVariables = (variables: unknown): Record<string, unknown> =>
  (variables as { wardley?: Record<string, unknown> }).wardley ?? {};

describe('wardley theme variables', () => {
  afterEach(() => {
    configApi.reset();
  });

  it.each(['default', 'base', 'dark', 'forest', 'neutral'] as const)(
    'the %s theme generates the attitude zone and ecosystem colours',
    (name) => {
      const generated = wardleyVariables(themes[name].getThemeVariables());
      for (const key of zoneAndEcosystemKeys) {
        expect(generated[key], key).toMatch(/\S/);
      }
    }
  );

  it.each(['default', 'dark'] as const)(
    'defaults the %s ecosystem middle and inner fills to the component fill',
    (name) => {
      const generated = wardleyVariables(themes[name].getThemeVariables());
      expect(generated.ecosystemMiddleFill).toBe(generated.componentFill);
      expect(generated.ecosystemInnerFill).toBe(generated.componentFill);
    }
  );

  // Directives and frontmatter only keep keys the default theme generates, so a key
  // missing from the theme is dropped before it reaches the renderer.
  it('keeps attitude zone and ecosystem colours set through a directive', () => {
    const overrides = Object.fromEntries(
      zoneAndEcosystemKeys.map((key, index) => [key, `#00000${index}`])
    );
    // A copy, because sanitizing deletes rejected keys from the directive in place.
    configApi.addDirective({ themeVariables: { wardley: { ...overrides } } });
    expect(wardleyVariables(configApi.getConfig().themeVariables)).toMatchObject(overrides);
  });
});
