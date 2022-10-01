import { vi } from 'vitest';

const importActual = (name: string) => {
  vi.mock(name, async () => {
    const module: object = await vi.importActual(name);

    return { ...module, get: vi.fn() };
  });
};

// Modules that we don't want mocked by default.
importActual('d3');
importActual('dagre-d3');

// dagre-d3 requires that window.d3 be set.
// See https://github.com/dagrejs/dagre-d3/issues/198.
import * as d3 from 'd3';
window.d3 = d3;

// jsdom does not provide getBBox() so we will polyfill.
// See https://github.com/jsdom/jsdom/issues/3159.
Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
  writable: true,
  value: () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }),
});
