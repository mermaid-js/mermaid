/*
Used to convert jest's Tagged Template literals to object arrays as required by vitest.

Example:

Jest code
```ts
it.each`
str       | expected
${'1d'}   | ${dayjs.duration(1, 'd')}
${'2w'}   | ${dayjs.duration(2, 'w')}
`('should parse $str to $expected duration', ({ str, expected }) => {
   expect(yourFunction(str)).toEqual(expected);
 });
```

Vitest code
```ts
it.each(convert`
str       | expected
${'1d'}   | ${dayjs.duration(1, 'd')}
${'2w'}   | ${dayjs.duration(2, 'w')}
`)('should parse $str to $expected duration', ({ str, expected }) => {
   expect(yourFunction(str)).toEqual(expected);
 });
```
*/

import { JSDOM } from 'jsdom';
import { expect, it } from 'vitest';

export const convert = (template: TemplateStringsArray, ...params: unknown[]) => {
  const header = template[0]
    .trim()
    .split('|')
    .map((s) => s.trim());
  if (header.length === 0 || params.length % header.length !== 0) {
    throw new Error('Table column count mismatch');
  }
  const chunkSize = header.length;
  const out = [];
  for (let i = 0; i < params.length; i += chunkSize) {
    const chunk = params.slice(i, i + chunkSize);
    out.push(Object.fromEntries(chunk.map((v, i) => [header[i], v])));
  }
  return out;
};

/**
 * Getting rid of linter issues to make {@link jsdomIt} work.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOnProtectedConstant(object: any, key: string, value: unknown): void {
  object[key] = value;
}

export const MOCKED_BBOX = {
  x: 0,
  y: 0,
  width: 666,
  height: 666,
};

/**
 * Test method borrowed from d3 : https://github.com/d3/d3-selection/blob/v3.0.0/test/jsdom.js
 *
 * Fools d3 into thinking it's working in a browser with a real DOM.
 *
 * The DOM is actually an instance of JSDom with monkey-patches for DOM methods that require a
 * rendering engine.
 *
 * The resulting environment is capable of rendering SVGs with the caveat that layouts are
 * completely screwed.
 *
 * This makes it possible to make structural tests instead of mocking everything.
 */
export function jsdomIt(message: string, run: () => void | Promise<void>) {
  return it(message, async (): Promise<void> => {
    const oldWindow = global.window;
    const oldDocument = global.document;

    try {
      const baseHtml = `
        <html lang="en">
          <body id="cy">
            <svg id="svg"/>
          </body>
        </html>
      `;
      const dom = new JSDOM(baseHtml, {
        resources: 'usable',
        beforeParse(_window) {
          // Mocks DOM functions that require rendering, JSDOM doesn't
          setOnProtectedConstant(_window.Element.prototype, 'getBBox', () => MOCKED_BBOX);
          setOnProtectedConstant(_window.Element.prototype, 'getComputedTextLength', () => 200);
        },
      });
      setOnProtectedConstant(global, 'window', dom.window); // Fool D3 into thinking it's in a browser
      setOnProtectedConstant(global, 'document', dom.window.document); // Fool D3 into thinking it's in a browser
      setOnProtectedConstant(global, 'MutationObserver', undefined); // JSDOM doesn't like cytoscape elements

      await run();
    } finally {
      setOnProtectedConstant(global, 'window', oldWindow);
      setOnProtectedConstant(global, 'document', oldDocument);
    }
  });
}

/**
 * Retrieves the node from its parent with ParentNode#querySelector,
 * then checks that it exists before returning it.
 */
export function ensureNodeFromSelector(selector: string, parent: ParentNode = document): Element {
  const node = parent.querySelector(selector);
  expect(node).not.toBeNull();
  return node!;
}
