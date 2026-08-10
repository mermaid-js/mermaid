import * as configApi from '../../config.js';
import { zhCN } from '../../i18n/zh-CN.js';
import { draw } from './errorRenderer.js';

const renderErrorSvg = (): string[] => {
  document.body.innerHTML = '<svg id="error-diagram"></svg>';
  draw('', 'error-diagram', '11.0.0');
  return [...document.querySelectorAll('#error-diagram text')].map(
    (node) => node.textContent ?? ''
  );
};

describe('errorRenderer', () => {
  beforeEach(() => {
    configApi.reset();
    configApi.setSiteConfig({});
  });

  it('should render English text by default', () => {
    expect(renderErrorSvg()).toEqual(['Syntax error in text', 'mermaid version 11.0.0']);
  });

  it('should render Chinese text when the locale is zh-CN', () => {
    configApi.setSiteConfig({ locale: 'zh-CN' });

    const [syntaxError, version] = renderErrorSvg();
    expect(syntaxError).toBe(zhCN['error.syntaxError']);
    expect(version).toContain('11.0.0');
  });

  it('should keep the version out of the translated string', () => {
    configApi.setSiteConfig({ locale: 'zh-CN' });

    // The version is interpolated, not concatenated, so it must not leave a placeholder.
    expect(renderErrorSvg().join(' ')).not.toContain('{version}');
  });
});
