import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getConfig } from '../../config.js';
import { mermaidAPI } from '../../mermaidAPI.js';

const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 100, height: 20 }),
  });
});

afterAll(() => {
  mermaidAPI.initialize({ theme: 'default' });
  if (originalGetBBox) {
    Object.defineProperty(SVGElement.prototype, 'getBBox', originalGetBBox);
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getBBox');
  }
});

describe('wardley renderer', () => {
  it('should render the label of an anchor with the label color of the theme', async () => {
    mermaidAPI.initialize({ theme: 'dark' });
    const { svg } = await mermaidAPI.render(
      'wardley-dark',
      `wardley-beta
  title Map
  anchor Business [0.95, 0.63]
  component Cup of Tea [0.79, 0.61]`
    );
    const labels = new DOMParser()
      .parseFromString(svg, 'text/html')
      .querySelectorAll('.wardley-node-label');
    const anchor = [...labels].find((label) => label.textContent === 'Business');
    expect(anchor?.getAttribute('fill')).toBe(
      getConfig().themeVariables.wardley.componentLabelColor
    );
  });
});
