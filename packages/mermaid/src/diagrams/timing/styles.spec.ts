import { beforeEach, describe, expect, it } from 'vitest';
import * as configApi from '../../config.js';
import themes from '../../themes/index.js';
import { styles } from './styles.js';

describe('timing diagram styles', () => {
  beforeEach(() => {
    configApi.setSiteConfig({});
  });

  it('derives colors and fonts from active theme variables', () => {
    const themeVariables = themes.dark.getThemeVariables();
    const css = styles(themeVariables);

    expect(css).toContain(`stroke: ${themeVariables.lineColor}`);
    expect(css).toContain(`fill: ${themeVariables.primaryColor}`);
    expect(css).toContain(`fill: ${themeVariables.secondaryColor}`);
    expect(css).toContain(`font-family: ${themeVariables.fontFamily}`);
    expect(css).toContain(`font-size: ${themeVariables.fontSize}`);
  });

  it('uses a custom font size as the base for timing text', () => {
    const css = styles({ fontSize: '20px' });

    expect(css).toContain('font-size: 20px');
    expect(css).toContain('font-size: 1.125em');
    expect(css).toContain('font-size: 0.6875em');
    expect(css).not.toMatch(/font-size: (?:11|13|18)px/);
  });

  it('falls back to a safe theme font when the configured font family is invalid', () => {
    const css = styles({
      fontFamily: 'safe"} .timing-root { display: none; } /*',
      fontSize: '16px; display: none',
    });

    expect(css).not.toContain('display: none');
    expect(css).toContain(`font-family: ${themes.default.getThemeVariables().fontFamily}`);
    expect(css).toContain(`font-size: ${themes.default.getThemeVariables().fontSize}`);
  });
});
