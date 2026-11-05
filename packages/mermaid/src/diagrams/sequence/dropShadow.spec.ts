import { describe, expect, it, vi } from 'vitest';
import themes from '../../themes/index.js';
import getStyles from './styles.js';

vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: () => ({ look: 'neo' }),
}));

describe('sequence drop shadow', () => {
  it('scopes the redux drop shadow filter to the diagram id', () => {
    const css = getStyles({ ...themes.redux.getThemeVariables(), svgId: '#my-svg' });

    expect(css).toContain('filter: url(#my-svg-drop-shadow)');
    expect(css).not.toContain('url(#drop-shadow)');
  });

  it('keeps a drop-shadow() value as is', () => {
    const css = getStyles({ ...themes.neo.getThemeVariables(), svgId: '#my-svg' });

    expect(css).toContain(`filter: ${themes.neo.getThemeVariables().dropShadow}`);
  });
});
