import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as configApi from '../../../config.js';
import type { D3Selection } from '../../../types.js';
import { registerIconPacks } from '../../icons.js';
import type { Node } from '../../types.js';
import { icon } from './icon.js';
import { iconCircle } from './iconCircle.js';
import { setIconContent } from './iconContent.js';
import { iconRounded } from './iconRounded.js';
import { iconSquare } from './iconSquare.js';

const ICON_SIZE = 48;
const GLYPH_WIDTH = 7;
const UNKNOWN_ICON_MARK = '?';
/** The Font Awesome prefix a test pack is registered under, so it is not in the unregistered list. */
const REGISTERED_PREFIX = 'fak';
const UNREGISTERED_PREFIXES = ['fa', 'fas', 'far', 'fab', 'fal', 'fad'] as const;

const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');
const originalGetComputedTextLength = Object.getOwnPropertyDescriptor(
  SVGElement.prototype,
  'getComputedTextLength'
);

const numberAttribute = (element: Element, name: string) =>
  Number.parseFloat(element.getAttribute(name) ?? '0');

const iconNode = ({
  icon = 'fas:tag',
  useHtmlLabels,
}: { icon?: string; useHtmlLabels?: boolean } = {}): Node => ({
  id: 'n',
  isGroup: false,
  icon,
  useHtmlLabels,
});

const shapeOptions = {
  config: { themeVariables: { nodeBorder: '#333', mainBkg: '#eee' }, flowchart: {} },
};

const iconShapes = [
  ['icon', icon],
  ['iconSquare', iconSquare],
  ['iconRounded', iconRounded],
  ['iconCircle', iconCircle],
] as const;

const fontAwesomeGlyph = () => document.querySelector('foreignObject i');

const unknownIconMark = () =>
  [...document.querySelectorAll('text')].some((text) =>
    text.textContent?.includes(UNKNOWN_ICON_MARK)
  );

const setHtmlLabels = (htmlLabels: boolean) => configApi.setConfig({ htmlLabels });

const iconHost = () => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"><g id="host"></g></svg>';
  return select<SVGGElement, unknown>(document.querySelector<SVGGElement>('#host')!);
};

const svgRoot = () => select(document.querySelector<SVGSVGElement>('svg')!);

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value(this: SVGElement) {
      const sized = this.querySelector('[width][height]') ?? this;
      return {
        x: 0,
        y: 0,
        width: numberAttribute(sized, 'width'),
        height: numberAttribute(sized, 'height'),
      };
    },
  });
  Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
    configurable: true,
    value(this: SVGElement) {
      return (this.textContent?.length ?? 0) * GLYPH_WIDTH;
    },
  });
  registerIconPacks([
    {
      name: REGISTERED_PREFIX,
      icons: {
        prefix: REGISTERED_PREFIX,
        width: 24,
        height: 24,
        icons: { tag: { body: '<path d="M0 0h24v24z"/>' } },
      },
    },
  ]);
});

afterAll(() => {
  if (originalGetBBox) {
    Object.defineProperty(SVGElement.prototype, 'getBBox', originalGetBBox);
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getBBox');
  }
  if (originalGetComputedTextLength) {
    Object.defineProperty(
      SVGElement.prototype,
      'getComputedTextLength',
      originalGetComputedTextLength
    );
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getComputedTextLength');
  }
});

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  setHtmlLabels(true);
});

describe('setIconContent', () => {
  it.each(UNREGISTERED_PREFIXES)(
    'draws an unregistered %s icon as a Font Awesome glyph the page CSS can style',
    async (prefix) => {
      await setIconContent(iconHost(), iconNode({ icon: `${prefix}:tag` }), ICON_SIZE);

      const frame = document.querySelector('foreignObject');
      expect(frame?.getAttribute('width')).toBe(`${ICON_SIZE}`);
      expect(frame?.getAttribute('height')).toBe(`${ICON_SIZE}`);
      expect(fontAwesomeGlyph()?.getAttribute('class')).toBe(`${prefix} fa-tag`);
      expect(unknownIconMark()).toBe(false);
    }
  );

  it('prefers a registered icon pack over the Font Awesome glyph', async () => {
    await setIconContent(iconHost(), iconNode({ icon: `${REGISTERED_PREFIX}:tag` }), ICON_SIZE);

    expect(document.querySelector('svg svg path')).not.toBeNull();
    expect(document.querySelector('foreignObject')).toBeNull();
  });

  it('keeps the unknown-icon placeholder when HTML labels are off', async () => {
    setHtmlLabels(false);

    await setIconContent(iconHost(), iconNode({ useHtmlLabels: false }), ICON_SIZE);

    expect(document.querySelector('foreignObject')).toBeNull();
    expect(unknownIconMark()).toBe(true);
  });

  it('draws the glyph when the node asks for HTML labels although the diagram does not', async () => {
    setHtmlLabels(false);

    await setIconContent(iconHost(), iconNode({ useHtmlLabels: true }), ICON_SIZE);

    expect(fontAwesomeGlyph()?.getAttribute('class')).toBe('fas fa-tag');
  });

  it('keeps the unknown-icon placeholder for an unregistered name that is not Font Awesome', async () => {
    await setIconContent(iconHost(), iconNode({ icon: 'missing:tag' }), ICON_SIZE);

    expect(document.querySelector('foreignObject')).toBeNull();
    expect(unknownIconMark()).toBe(true);
  });

  it.each(['fas:tag" onload="x', 'fas:tag><script>', 'fas:', 'fas:a b'])(
    'never builds markup from the unusual Font Awesome name %j',
    async (name) => {
      await setIconContent(iconHost(), iconNode({ icon: name }), ICON_SIZE);

      expect(document.querySelector('foreignObject')).toBeNull();
      expect(document.querySelector('script')).toBeNull();
      expect(document.querySelector('[onload]')).toBeNull();
    }
  );
});

describe.each(iconShapes)('%s shape with an unregistered Font Awesome icon', (_name, shape) => {
  const render = async (extra: Partial<Node> = {}) => {
    document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    await shape(svgRoot() as D3Selection<SVGSVGElement>, iconNode(extra), shapeOptions);
  };

  it('draws the Font Awesome glyph instead of the unknown-icon placeholder', async () => {
    await render({ useHtmlLabels: true });

    expect(fontAwesomeGlyph()?.getAttribute('class')).toBe('fas fa-tag');
    expect(unknownIconMark()).toBe(false);
  });

  it('keeps the unknown-icon placeholder when HTML labels are off', async () => {
    setHtmlLabels(false);

    await render({ useHtmlLabels: false });

    expect(document.querySelector('foreignObject i')).toBeNull();
    expect(unknownIconMark()).toBe(true);
  });
});
