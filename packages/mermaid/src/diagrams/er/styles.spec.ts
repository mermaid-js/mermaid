import { describe, expect, it } from 'vitest';
import erStyles from './styles.js';
import themes from '../../themes/index.js';

describe('er styles fontSize', () => {
  it('uses themeVariables.fontSize for edge labels instead of a hardcoded 14px', () => {
    const themeVariables = themes.base.getThemeVariables({ fontSize: '40px' });
    const css = erStyles(themeVariables);
    expect(css).toContain('font-size: 40px');
    expect(css).not.toMatch(/\.edgeLabel \.label\s*{[^}]*font-size:\s*14px/);
  });

  it('still emits a font-size rule for .edgeLabel .label', () => {
    const themeVariables = themes.default.getThemeVariables();
    const css = erStyles(themeVariables);
    expect(css).toMatch(/\.edgeLabel \.label\s*{[^}]*font-size:\s*[^;]+;/);
  });
});
