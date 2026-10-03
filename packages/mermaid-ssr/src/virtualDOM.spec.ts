import type { VirtualDOMEnvironment } from './virtualDOM.js';
import { createVirtualDOMEnvironment, VIEWPORT } from './virtualDOM.js';

describe('virtual DOM environment', () => {
  let env: VirtualDOMEnvironment;

  beforeEach(() => {
    env = createVirtualDOMEnvironment();
  });

  afterEach(() => {
    env.cleanup();
  });

  // The c4 renderer reads the bare identifier `screen`, so it has to be a global,
  // and it divides by availWidth, so 0 is not a usable answer.
  it('exposes screen as a global with a usable available width', () => {
    expect(typeof globalThis.screen).toBe('object');
    expect(globalThis.screen.availWidth).toBe(VIEWPORT.width);
    expect(globalThis.screen.availHeight).toBe(VIEWPORT.height);
  });

  // The gantt renderer takes its canvas width from the container's offsetWidth and
  // falls back to a default only when that is `undefined`. JSDOM reports 0, which
  // passes the guard and produces a zero-width diagram.
  it('reports a non-zero offsetWidth for a container', () => {
    const container = env.document.createElement('div');
    env.document.body.append(container);

    expect(container.offsetWidth).toBe(VIEWPORT.width);
    expect(container.offsetHeight).toBe(VIEWPORT.height);
  });

  // Cytoscape computes its size as clientWidth minus the computed paddings. JSDOM
  // returns '' for paddings a browser reports as '0px', so the arithmetic yields NaN.
  it('returns parseable lengths for box properties a browser reports as 0px', () => {
    const container = env.document.createElement('div');
    env.document.body.append(container);
    const style = env.window.getComputedStyle(container);

    for (const property of [
      'padding-left',
      'padding-right',
      'padding-top',
      'padding-bottom',
      'border-left-width',
      'margin-top',
    ]) {
      expect(Number.parseFloat(style.getPropertyValue(property))).not.toBeNaN();
    }
  });

  it('keeps reporting lengths that are actually declared', () => {
    const container = env.document.createElement('div');
    container.setAttribute('style', 'padding-left: 12px');
    env.document.body.append(container);

    const style = env.window.getComputedStyle(container);
    expect(Number.parseFloat(style.getPropertyValue('padding-left'))).toBe(12);
  });

  it('leaves non-length properties alone', () => {
    const container = env.document.createElement('div');
    env.document.body.append(container);

    const style = env.window.getComputedStyle(container);
    expect(Number.parseFloat(style.getPropertyValue('padding-left'))).toBe(0);
    expect(style.getPropertyValue('unknown-property')).toBe('');
  });

  it('restores the globals it replaced on cleanup', () => {
    const before = globalThis.screen;
    const inner = createVirtualDOMEnvironment();
    inner.cleanup();

    expect(globalThis.screen).toBe(before);
  });
});
