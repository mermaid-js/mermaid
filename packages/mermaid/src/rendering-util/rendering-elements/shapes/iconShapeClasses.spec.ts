/**
 * Icon shapes have to carry `node.cssClasses`, or a user's `classDef`/`class`/`:::`
 * assignment silently does nothing to them - the generated rule is `.<name> > *`, so the
 * class has to be on the node's own group for it to reach the drawn children.
 *
 * They must NOT gain the `node` class along with it. `.node rect, .node path {...}` gives
 * every node the default fill and border, which an icon shape deliberately does without;
 * adding it repaints every existing icon diagram.
 */
import { JSDOM } from 'jsdom';
import { describe, it, expect } from 'vitest';
import { mermaidAPI } from '../../../mermaidAPI.js';

const renderNodeClasses = async (id: string, code: string): Promise<string[]> => {
  const oldWindow = global.window;
  const oldDocument = global.document;
  const oldMutationObserver = global.MutationObserver;

  try {
    const dom = new JSDOM(`<html lang="en"><body><div id="container"></div></body></html>`, {
      resources: 'usable',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeParse(_window: any) {
        _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
        _window.Element.prototype.getComputedTextLength = () => 50;
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = dom.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = dom.window.document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).MutationObserver = undefined;

    const { svg } = await mermaidAPI.render(id, code);
    const holder = dom.window.document.createElement('div');
    holder.innerHTML = svg;

    return [...holder.querySelectorAll('g[class]')]
      .map((element) => element.getAttribute('class') ?? '')
      .filter((classes) => classes.includes('icon-shape') || /(^|\s)node(\s|$)/.test(classes));
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = oldWindow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = oldDocument;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).MutationObserver = oldMutationObserver;
  }
};

describe('icon shapes and node classes', () => {
  it('applies a user class to an icon-shaped node', async () => {
    const classes = await renderNodeClasses(
      'icon-classes',
      `flowchart TD
  A@{ shape: icon, icon: "fa:bell", label: "Iconic" }
  B[Plain]
  A --> B
  classDef hot fill:#f96,stroke:#333
  class A hot
  class B hot`
    );

    const iconNode = classes.find((c) => c.includes('icon-shape'));
    const plainNode = classes.find((c) => !c.includes('icon-shape'));

    // the plain node has always carried it; the icon node used to drop it
    expect(plainNode).toContain('hot');
    expect(iconNode).toContain('hot');
    // and the icon shape keeps its own classes
    expect(iconNode).toContain('icon-shape');
    // but must not pick up `node`, which would apply the default node fill and border
    expect(iconNode?.split(/\s+/)).not.toContain('node');
  });

  // `:::` is a separate assignment path from `class X y`, and it is the one the icon
  // e2e cases use, so it is worth covering rather than assuming the two converge.
  it('applies a user class assigned with :::', async () => {
    const classes = await renderNodeClasses(
      'icon-classes-inline',
      `flowchart TD
  A@{ icon: "fa:bell", label: "Iconic" }
  B[Plain]:::hot
  A --> B
  classDef hot fill:#f96,stroke:#333
  A:::hot`
    );

    const iconNode = classes.find((c) => c.includes('icon-shape'));
    expect(classes.find((c) => !c.includes('icon-shape'))).toContain('hot');
    expect(iconNode).toContain('hot');
    expect(iconNode).toContain('icon-shape');
    expect(iconNode?.split(/\s+/)).not.toContain('node');
  });

  // `form` picks the icon variant, so this reaches iconRounded/iconSquare/iconCircle -
  // the shapes are not addressable by name from flowchart syntax.
  it.each([undefined, 'rounded', 'square', 'circle'])(
    'applies a user class to an icon node with form=%s',
    async (form) => {
      const classes = await renderNodeClasses(
        `icon-classes-${form ?? 'default'}`,
        `flowchart TD
  A@{ icon: "fa:bell", label: "Iconic"${form ? `, form: "${form}"` : ''} }
  classDef hot fill:#f96
  class A hot`
      );

      const iconNode = classes.find((c) => c.includes('icon-shape'));
      expect(iconNode).toContain('hot');
      expect(iconNode?.split(/\s+/)).not.toContain('node');
    }
  );
});
