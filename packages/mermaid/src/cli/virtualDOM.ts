/**
 * Virtual DOM environment for browserless mermaid rendering.
 *
 * Sets up a JSDOM instance with mocked browser measurement APIs
 * (`getBBox`, `getComputedTextLength`, `getBoundingClientRect`) so that
 * D3 and mermaid can render diagrams without a real browser.
 *
 * All dimension estimation is delegated to `fontMetrics` and `svgBBox`.
 */
import { JSDOM } from 'jsdom';
import { getFontSize, getFontWeight, measureTextWidth } from './fontMetrics.js';
import { estimateBBox, getTextContent } from './svgBBox.js';

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
 * Browser-only measurement APIs are replaced with heuristic estimators
 * that inspect the DOM tree and compute dimensions from text content
 * and element attributes.
 */
export function createVirtualDOMEnvironment(): VirtualDOMEnvironment {
  const oldWindow = global.window;
  const oldDocument = global.document;
  const oldCSSStyleSheet = global.CSSStyleSheet;

  const dom = new JSDOM('<html lang="en"><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeParse(_window: any) {
      // getBBox — estimated bounding box from tag/attributes/text
      forceSet(_window.Element.prototype, 'getBBox', function (this: Element) {
        return estimateBBox(this);
      });

      // getComputedTextLength — estimated text width via AFM metrics
      forceSet(_window.Element.prototype, 'getComputedTextLength', function (this: Element) {
        const text = getTextContent(this);
        return measureTextWidth(text, getFontSize(this), getFontWeight(this));
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
    },
  });

  // Expose globals so D3 and mermaid find them
  forceSet(global, 'window', dom.window);
  forceSet(global, 'document', dom.window.document);
  forceSet(global, 'CSSStyleSheet', dom.window.CSSStyleSheet);

  return {
    window: dom.window,
    document: dom.window.document,
    cleanup() {
      forceSet(global, 'window', oldWindow);
      forceSet(global, 'document', oldDocument);
      forceSet(global, 'CSSStyleSheet', oldCSSStyleSheet);
    },
  };
}
