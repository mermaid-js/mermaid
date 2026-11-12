import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll, vi } from 'vitest';

// Measure plain text like a crude real browser: width proportional to length,
// so a long raw LaTeX source measures much wider than the short rendered math.
vi.mock('../../utils.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      calculateTextDimensions: vi.fn((text) => ({
        width: (text?.length ?? 0) * 8,
        height: 14,
        lineHeight: 14,
      })),
    },
  };
});

import mermaid from '../../mermaid.js';
import { mermaidAPI } from '../../mermaidAPI.js';

const setupDom = () => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldMutationObserver = globalThis.MutationObserver;
  const dom = new JSDOM('<html lang="en"><body><div id="container"></div></body></html>', {
    url: 'http://localhost/',
    resources: 'usable',
    beforeParse(window) {
      window.Element.prototype.getBBox = () => ({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      });
      window.Element.prototype.getComputedTextLength = () => 50;
    },
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.MutationObserver = undefined;

  return () => {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
    globalThis.MutationObserver = oldMutationObserver;
  };
};

const renderNoteWidth = async (id, noteLine) => {
  const restoreDom = setupDom();
  try {
    const { svg } = await mermaidAPI.render(
      id,
      `sequenceDiagram
      participant A
      participant B
      ${noteLine}
      A->>B: Message`
    );
    const dom = new JSDOM(svg);
    const rect = dom.window.document.querySelector('rect.note');
    return Number(rect?.getAttribute('width'));
  } finally {
    restoreDom();
  }
};

describe('sequence KaTeX note width (#6993)', () => {
  beforeAll(async () => {
    await mermaid.registerExternalDiagrams([]);
    mermaid.initialize({ deterministicIds: true, deterministicIDSeed: '', logLevel: 5 });
  });

  it('sizes a KaTeX "Note over" from the rendered math, not the raw LaTeX source', async () => {
    const math = '$$(sk_B, pk_B)\\leftarrow KeyGen(1^\\lambda)$$';
    const width = await renderNoteWidth('katex-note-over-test', `Note over B: ${math}`);
    // The rendered math is narrow, so the note stays at the default sequence
    // width (150). Measuring the 44-char LaTeX source as plain text would
    // inflate it to 372 (44 * 8 + 2 * noteMargin).
    expect(width).toBe(150);
  });
});
