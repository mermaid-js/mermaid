import { describe, expect, it } from 'vitest';
import themes from '../../themes/index.js';
import getStyles from './styles.js';

describe('mindmap styles', () => {
  it('sets a label color without relying on the host page', () => {
    const themeVariables = themes.dark.getThemeVariables();
    const styles = getStyles(themeVariables);

    expect(styles).toContain(`.mindmap-node-label {\n    color: ${themeVariables.textColor};`);
  });
});
