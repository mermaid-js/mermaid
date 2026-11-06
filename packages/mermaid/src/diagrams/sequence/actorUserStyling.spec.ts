/**
 * Color themes paint each participant with inline stroke/fill. Inline styles beat the
 * generated `style`/`classDef` rules in the diagram's <style> tag, so an actor carrying
 * user styling must not get the palette inline, or the user's colors never show.
 */
import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import defaultConfig from '../../defaultConfig.js';
import themes from '../../themes/index.js';
import svgDraw from './svgDraw.js';

// jsdom has no layout, so drawActor's measurement needs a stub.
const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 150, height: 65 }) as DOMRect,
  });
});

afterAll(() => {
  if (originalGetBBox) {
    Object.defineProperty(SVGElement.prototype, 'getBBox', originalGetBBox);
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getBBox');
  }
});

const conf = {
  ...defaultConfig.sequence,
  look: 'classic',
  theme: 'redux-color',
  themeVariables: themes['redux-color'].getThemeVariables(),
  sequence: defaultConfig.sequence,
};

const participant = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  description: name,
  type: 'participant',
  x: 0,
  y: 0,
  starty: 100,
  stopy: 400,
  width: 150,
  height: 65,
  links: {},
  properties: {},
  ...extra,
});

const drawActorElements = async (actor: ReturnType<typeof participant>) => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const svg = select(document.querySelector<SVGSVGElement>('svg')!);
  await svgDraw.drawActor(
    svg,
    actor,
    conf,
    false,
    'test-id',
    undefined,
    new Map([[actor.name, 0]])
  );
  const rect = document.querySelector<SVGRectElement>('rect.actor')!;
  // the actor box sits in its own <g> under the lifeline group, and that
  // inner group is where user classes are attached
  return { group: rect.parentNode as SVGGElement, rect };
};

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('participant user styling under a color theme', () => {
  it('keeps the palette inline for an unstyled actor', async () => {
    const { rect } = await drawActorElements(participant('Alice'));
    expect(rect.style.stroke).not.toBe('');
    expect(rect.style.fill).not.toBe('');
  });

  it('skips the inline palette and attaches styleClassName when the actor has an inline style', async () => {
    const { group, rect } = await drawActorElements(
      participant('Alice', { styles: ['fill:#f00'], styleClassName: 'actor-style-x' })
    );
    expect(rect.style.stroke).toBe('');
    expect(rect.style.fill).toBe('');
    expect(group.classList.contains('actor-style-x')).toBe(true);
  });

  it('skips the inline palette and attaches custom classes when the actor has a class', async () => {
    const { group, rect } = await drawActorElements(
      participant('Alice', { classes: ['highlighted'] })
    );
    expect(rect.style.stroke).toBe('');
    expect(rect.style.fill).toBe('');
    expect(group.classList.contains('highlighted')).toBe(true);
  });
});
