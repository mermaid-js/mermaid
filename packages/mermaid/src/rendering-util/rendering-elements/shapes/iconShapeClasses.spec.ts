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
import { registerIconPacks } from '../../icons.js';

const renderNodeClasses = async (id: string, code: string): Promise<string[]> =>
  [...(await renderToHolder(id, code)).querySelectorAll('g[class]')]
    .map((element) => element.getAttribute('class') ?? '')
    .filter((classes) => classes.includes('icon-shape') || /(^|\s)node(\s|$)/.test(classes));

const renderToHolder = async (id: string, code: string): Promise<Element> => {
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
    return holder;
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

/**
 * Each icon shape draws a bounds-only rectangle around the icon and its label, which
 * sets the node's size and hit area and is meant to stay invisible. With SVG labels a
 * class emits `.<name> path { fill: ... !important; stroke: ... !important }`, which
 * beats the rectangle's `fill`/`stroke` attributes, so the rectangle has to declare its
 * own paint with `!important` inline. jsdom does not apply the diagram's stylesheet, so
 * these tests check the declarations that a browser resolves against that rule.
 */
describe('icon shapes keep their bounds rectangle unpainted', () => {
  const classedIcon = (form: string | undefined, look: string) => `---
config:
  htmlLabels: false
  look: ${look}
  handDrawnSeed: 1
---
flowchart TD
  A@{ icon: "fa:bell", label: "Iconic"${form ? `, form: "${form}"` : ''} }
  classDef hot fill:#f96,stroke:#333
  class A hot`;

  // The drawn shape is the first child; the bounds rectangle is the other rough.js group,
  // the one that holds nothing but paths. The label and the icon hold nested elements.
  const shapeParts = (holder: Element) => {
    const [shape, ...rest] = [...(holder.querySelector('g.icon-shape')?.children ?? [])];
    const bounds = rest.filter(
      (child) =>
        child.tagName === 'g' &&
        !child.classList.contains('label') &&
        child.children.length > 0 &&
        [...child.children].every((grandchild) => grandchild.tagName === 'path')
    );
    return { shape, bounds };
  };

  const paintOf = (path: Element) => (path.getAttribute('style') ?? '').replaceAll(/\s+/g, ' ');

  it.each(
    [undefined, 'rounded', 'square', 'circle'].flatMap((form) =>
      ['classic', 'handDrawn'].map((look) => ({ form, look }))
    )
  )('form=$form look=$look: the bounds paths win over the class paint', async ({ form, look }) => {
    const holder = await renderToHolder(
      `icon-bounds-${form ?? 'default'}-${look}`,
      classedIcon(form, look)
    );
    const { shape, bounds } = shapeParts(holder);

    expect(bounds).toHaveLength(1);
    const boundsPaths = [...bounds[0].querySelectorAll('path')];
    expect(boundsPaths.length).toBeGreaterThan(0);
    for (const path of boundsPaths) {
      expect(paintOf(path)).toContain('fill: transparent !important');
      expect(paintOf(path)).toContain('stroke: none !important');
    }

    // the drawn shape is left to the class: it must not carry the override
    const shapePaths = [...(shape?.querySelectorAll('path') ?? [])];
    expect(shapePaths.length).toBeGreaterThan(0);
    for (const path of shapePaths) {
      expect(paintOf(path)).not.toContain('!important');
    }
  });
});

/**
 * The same class rule matches the elements of the embedded icon, so each one restates
 * its own paint inline with `!important`. Like the bounds tests above this checks the
 * declarations, not the cascade; the browser outcome is covered by
 * `e2e/rendering/flowchart/pr-check/flowchart-icon-class-paint.spec.ts`.
 */
describe('icon shapes keep their artwork out of class paint', () => {
  registerIconPacks([
    {
      name: 'artwork',
      icons: {
        prefix: 'artwork',
        icons: {
          mixed: {
            body: '<path fill="currentColor" d="M0 0h8v8H0z"/><rect width="4" height="4" style="fill: #087ebf; stroke-width: 0px;"/><circle cx="2" cy="2" r="1" stroke="#123456"/>',
            width: 24,
            height: 24,
          },
        },
      },
    },
  ]);

  const iconDiagram = (form: string | undefined) => `---
config:
  htmlLabels: false
---
flowchart TD
  A@{ icon: "artwork:mixed", label: "Iconic"${form ? `, form: "${form}"` : ''} }
  classDef hot fill:#f96,stroke:#333
  class A hot`;

  const declarations = (element: Element | null | undefined) =>
    (element?.getAttribute('style') ?? '').replaceAll(/\s+/g, ' ');

  it.each([undefined, 'rounded', 'square', 'circle'])(
    'form=%s: each icon element restates its own fill and stroke',
    async (form) => {
      const holder = await renderToHolder(`icon-artwork-${form ?? 'default'}`, iconDiagram(form));
      const icon = holder.querySelector('g.icon-shape svg');

      expect(declarations(icon?.querySelector('path'))).toContain('fill: currentColor !important');
      expect(declarations(icon?.querySelector('path'))).toContain('stroke: inherit !important');
      expect(declarations(icon?.querySelector('rect'))).toContain('fill: #087ebf !important');
      expect(declarations(icon?.querySelector('rect'))).toContain('stroke-width: 0px');
      expect(declarations(icon?.querySelector('circle'))).toContain('fill: inherit !important');
      expect(declarations(icon?.querySelector('circle'))).toContain('stroke: #123456 !important');

      // the drawn shape around the icon is left to the class
      const shape = holder.querySelector('g.icon-shape')?.children[0];
      for (const path of shape?.querySelectorAll('path') ?? []) {
        expect(declarations(path)).not.toContain('!important');
      }
    }
  );
});
