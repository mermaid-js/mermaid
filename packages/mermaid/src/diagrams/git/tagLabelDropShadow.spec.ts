import { afterEach, describe, expect, it } from 'vitest';
import * as configApi from '../../config.js';
import getStyles from './styles.js';

describe('gitGraph tag label drop shadow', () => {
  afterEach(() => {
    configApi.reset();
  });

  it('scopes the redux drop shadow filter to the diagram id', () => {
    configApi.setSiteConfig({ theme: 'redux' });
    const { themeVariables } = configApi.getConfig();
    const css = getStyles({ ...themeVariables, svgId: '#my-svg' });

    expect(css).toContain('filter:url(#my-svg-drop-shadow)');
    expect(css).not.toContain('url(#drop-shadow)');
  });
});
