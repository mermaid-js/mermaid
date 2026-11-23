/**
 * Marble variables default to base colours. `default` runs `updateColors()` in its
 * constructor, and every theme's `updateColors()` may replace a base colour the user set
 * (e.g. `dark` forces `lineColor`) before `calculate()` restores it, so marble defaults
 * must be derived again once the user's overrides are final.
 */
import { describe, expect, it } from 'vitest';
import themes from './index.js';

type ThemeName = keyof typeof themes;

const variables = (name: ThemeName, overrides?: Record<string, unknown>) =>
  themes[name].getThemeVariables(overrides) as unknown as Record<string, unknown>;

describe('marble theme variables', () => {
  it.each(Object.keys(themes) as ThemeName[])(
    'derive from the final base colours under the %s theme',
    (name) => {
      const theme = variables(name, { lineColor: '#ff0000', primaryColor: '#00ff00' });
      for (const key of [
        'marbleLaneColor',
        'marbleGridColor',
        'marbleEventStroke',
        'marbleSpanStroke',
        'marbleCompleteColor',
        'marbleCancelColor',
        'marbleBreakColor',
      ]) {
        expect(theme[key], key).toBe('#ff0000');
      }
      expect(theme.marbleEventFill).toBe(theme.primaryColor);
      expect(theme.marbleTitleColor).toBe(theme.titleColor);
      expect(theme.marbleBreakBkg).toBe(theme.background);
    }
  );

  it.each(Object.keys(themes) as ThemeName[])(
    'derive the error colour from an overridden critBkgColor under the %s theme',
    (name) => {
      expect(variables(name, { critBkgColor: '#123456' }).marbleErrorColor).toBe('#123456');
    }
  );

  it.each(Object.keys(themes) as ThemeName[])(
    'derive the title colour from an overridden titleColor under the %s theme',
    (name) => {
      expect(variables(name, { titleColor: '#123456' }).marbleTitleColor).toBe('#123456');
    }
  );

  it.each(Object.keys(themes) as ThemeName[])(
    'keep an explicit marble override under the %s theme',
    (name) => {
      const theme = variables(name, { lineColor: '#ff0000', marbleLaneColor: '#123456' });
      expect(theme.marbleLaneColor).toBe('#123456');
      expect(theme.marbleGridColor).not.toBe('#123456');
    }
  );

  it('matches the base colours without overrides', () => {
    const theme = variables('default');
    expect(theme.marbleLaneColor).toBe(theme.lineColor);
    expect(theme.marbleEventFill).toBe(theme.primaryColor);
  });
});
