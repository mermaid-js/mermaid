import mermaid from '../../mermaid.js';
import { JSDOM } from 'jsdom';

declare global {
  interface SVGElement {
    getComputedTextLength(): number;
    getBBox(): { x: number; y: number; width: number; height: number };
  }
}

// mock functions for JSDOM SVG elements
if (!SVGElement.prototype.getComputedTextLength) {
  SVGElement.prototype.getComputedTextLength = function () {
    return 100;
  };
}

if (!SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = function () {
    return { x: 0, y: 0, width: 100, height: 100 };
  };
}

describe('treemap-beta color rendering', () => {
  beforeAll(() => {
    mermaid.initialize({ startOnLoad: false });
  });

  it('renders leaf with exact class color (no blending)', async () => {
    const code = `treemap-beta
        "Parent":100:::parent
        "Child":50:::child
        classDef parent fill:#F54927
        classDef child fill:#44D622,stroke:none,color:#FFFFFF`;

    const { svg } = await mermaid.render('tmColor1', code);
    const dom = new JSDOM(svg);

    // find the child leaf specifically
    const leaf = [...dom.window.document.querySelectorAll('rect.treemapLeaf')].find((r) =>
      r.parentElement?.classList.contains('child')
    );

    expect(leaf).toBeTruthy();

    // accept fill from either attribute or style
    const fillAttr = leaf!.getAttribute('fill')?.toUpperCase() || '';
    const styleAttr = leaf!.getAttribute('style')?.toUpperCase() || '';
    const found = fillAttr.includes('#44D622') || styleAttr.includes('#44D622');

    expect(found).toBe(true);
    expect(leaf!.getAttribute('fill-opacity')).toBe('1');
  });
});
