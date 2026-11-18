import { describe, expect, it } from 'vitest';
import { getThemeVariables as baseTheme } from '../../themes/theme-base.js';
import { getThemeVariables as darkTheme } from '../../themes/theme-dark.js';
import { getThemeVariables as defaultTheme } from '../../themes/theme-default.js';
import { getThemeVariables as neoDarkTheme } from '../../themes/theme-neo-dark.js';
import { getThemeVariables as reduxDarkColorTheme } from '../../themes/theme-redux-dark-color.js';
import { getThemeVariables as reduxDarkTheme } from '../../themes/theme-redux-dark.js';
import styles from './styles.js';

const labelFill = (css: string) => /\.treeView-node-label {[^}]*fill: ([^;]+);/.exec(css)?.[1];
const lineStroke = (css: string) => /\.treeView-node-line {[^}]*stroke: ([^;]+);/.exec(css)?.[1];

describe('treeView styles', () => {
  it.each([
    ['dark', darkTheme, '#ccc', 'lightgrey'],
    ['neo-dark', neoDarkTheme, '#ccc', '#cccccc'],
    ['redux-dark', reduxDarkTheme, '#ccc', '#cccccc'],
    ['redux-dark-color', reduxDarkColorTheme, '#ccc', '#cccccc'],
  ])('uses light label and line colors in the %s theme', (_name, theme, label, line) => {
    const css = styles(theme({}));
    expect(labelFill(css)).toBe(label);
    expect(lineStroke(css)).toBe(line);
  });

  it('keeps black label and line colors in the default theme', () => {
    const css = styles(defaultTheme({}));
    expect(labelFill(css)).toBe('black');
    expect(lineStroke(css)).toBe('black');
  });

  it('uses light label and line colors in the base theme with darkMode', () => {
    const css = styles(baseTheme({ darkMode: true, background: '#1e1e1e' }));
    expect(labelFill(css)).toBe('#eee');
    expect(lineStroke(css)).toBe('#e1e1e1');
  });

  it('keeps black label and line colors in the base theme without darkMode', () => {
    const css = styles(baseTheme({}));
    expect(labelFill(css)).toBe('black');
    expect(lineStroke(css)).toBe('black');
  });

  it('keeps treeView overrides in the dark theme', () => {
    const css = styles(darkTheme({ treeView: { labelColor: '#ff0000', iconColor: '#00ff00' } }));
    expect(labelFill(css)).toBe('#ff0000');
    expect(lineStroke(css)).toBe('lightgrey');
    expect(css).toMatch(/\.treeView-node-icon {\s*color: #00ff00;/);
  });
});
