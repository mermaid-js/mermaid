/**
 * Virtual DOM environment for rendering mermaid without a browser.
 *
 * Sets up a JSDOM instance with the browser measurement APIs mermaid depends on
 * (`getBBox`, `getComputedTextLength`, `getBoundingClientRect`) so that D3 and
 * mermaid can render diagrams without a real browser.
 *
 * Text and shape estimation is delegated to `fontMetrics` and `svgBBox`. The
 * remaining shims answer the layout questions a browser answers and JSDOM,
 * which performs no layout, does not.
 */
import { JSDOM } from 'jsdom';
import { fontOf, measureTextWidth } from './fontMetrics.js';
import { estimateBBox, getTextContent } from './svgBBox.js';

/**
 * The viewport this environment reports, in px.
 *
 * JSDOM performs no layout, so there is no measured answer to give for the
 * size of the page or the screen. Renderers that ask use it to decide how wide
 * a diagram may grow, so the value has to be plausible and consistent across
 * every API that exposes it.
 */
export const VIEWPORT = { width: 1920, height: 1080 } as const;

/**
 * Box properties whose computed value is a length. JSDOM returns an empty
 * string for any it was not given explicitly, where a browser returns `0px`;
 * code that does arithmetic on them then produces NaN.
 */
const LENGTH_PROPERTIES = new Set([
  'width',
  'height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forceSet(object: any, key: string, value: unknown): void {
  object[key] = value;
}

export interface VirtualDOMEnvironment {
  /** Call this to restore original globals after rendering is complete. */
  cleanup: () => void;
  /** The JSDOM window object. */
  window: JSDOM['window'];
  /** The JSDOM document object. */
  document: Document;
}

/**
 * Creates a virtual DOM environment suitable for rendering mermaid diagrams.
 *
 * Sets `global.window` and `global.document` to the JSDOM instance so that
 * D3 selections (which rely on these globals) work correctly.
 *
 * Browser-only measurement APIs are replaced with estimators that inspect the
 * DOM tree and compute dimensions from text content and element attributes.
 */
export function createVirtualDOMEnvironment(): VirtualDOMEnvironment {
  const oldWindow = global.window;
  const oldDocument = global.document;
  const oldCSSStyleSheet = global.CSSStyleSheet;
  const oldScreen = global.screen;

  const dom = new JSDOM('<html lang="en"><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeParse(_window: any) {
      // getBBox — estimated bounding box from tag/attributes/text
      forceSet(_window.Element.prototype, 'getBBox', function (this: Element) {
        return estimateBBox(this);
      });

      // getComputedTextLength — advance width from the resolved font
      forceSet(_window.Element.prototype, 'getComputedTextLength', function (this: Element) {
        const text = getTextContent(this);
        return measureTextWidth(text, fontOf(this));
      });

      // getBoundingClientRect — DOMRect-like wrapper around estimateBBox
      forceSet(_window.Element.prototype, 'getBoundingClientRect', function (this: Element) {
        const bb = estimateBBox(this);
        return {
          x: bb.x,
          y: bb.y,
          width: bb.width,
          height: bb.height,
          top: bb.y,
          left: bb.x,
          bottom: bb.y + bb.height,
          right: bb.x + bb.width,
          toJSON() {
            return this;
          },
        };
      });

      // offsetWidth / offsetHeight — JSDOM reports 0 for every element, which a
      // renderer cannot tell apart from a genuinely collapsed container.
      for (const [property, value] of [
        ['offsetWidth', VIEWPORT.width],
        ['offsetHeight', VIEWPORT.height],
      ] as const) {
        Object.defineProperty(_window.HTMLElement.prototype, property, {
          configurable: true,
          get: () => value,
        });
      }

      // screen — the c4 renderer reads the bare global and divides by availWidth.
      for (const [property, value] of [
        ['availWidth', VIEWPORT.width],
        ['availHeight', VIEWPORT.height],
        ['width', VIEWPORT.width],
        ['height', VIEWPORT.height],
      ] as const) {
        Object.defineProperty(_window.Screen.prototype, property, {
          configurable: true,
          get: () => value,
        });
      }

      // getComputedStyle — fill in the box lengths JSDOM leaves empty.
      const getComputedStyle = _window.getComputedStyle.bind(_window);
      forceSet(_window, 'getComputedStyle', (...args: unknown[]) => {
        const style = getComputedStyle(...args);
        const getPropertyValue = style.getPropertyValue.bind(style);
        forceSet(style, 'getPropertyValue', (property: string) => {
          const value = getPropertyValue(property);
          if (value === '' && LENGTH_PROPERTIES.has(property)) {
            return '0px';
          }
          return value;
        });
        return style;
      });
    },
  });

  // Expose globals so D3 and mermaid find them
  forceSet(global, 'window', dom.window);
  forceSet(global, 'document', dom.window.document);
  forceSet(global, 'CSSStyleSheet', dom.window.CSSStyleSheet);
  forceSet(global, 'screen', dom.window.screen);

  return {
    window: dom.window,
    document: dom.window.document,
    cleanup() {
      dom.window.close();
      forceSet(global, 'window', oldWindow);
      forceSet(global, 'document', oldDocument);
      forceSet(global, 'CSSStyleSheet', oldCSSStyleSheet);
      forceSet(global, 'screen', oldScreen);
    },
  };
}
