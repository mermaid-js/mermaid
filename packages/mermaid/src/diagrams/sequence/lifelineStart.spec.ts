/**
 * Every participant shape used to decide for itself where its lifeline began, and they disagreed.
 * On one row, with every shape sharing an `actorY` and an `actor.height`, that produced four
 * different lifeline tops: `participant` measured from the box (65), `database` from the box plus
 * twice `boxTextMargin` (75), `control` and `entity` used a hardcoded 75, and `boundary` and
 * `actor` a hardcoded 80. An `actor` beside a `database` -- the most common pairing there is --
 * therefore had its lifeline start 5px lower for no reason either shape could state.
 *
 * `lifelineStartY` states the shared rule once: start below whatever the participant occupies. Most
 * shapes centre their label inside the box and so end at the box bottom; `actor` and `database`
 * hang theirs below it, so for those the label decides. Shapes sharing a label offset therefore
 * share a lifeline top, which is what makes those two line up.
 *
 * Applied to `neo` only. The values are pinned for `classic` as well, because that look renders a
 * great many existing documents and moving where a lifeline meets its shape would change all of
 * them.
 */
import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import defaultConfig from '../../defaultConfig.js';
import themes from '../../themes/index.js';
import svgDraw from './svgDraw.js';

const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 60, height: 65 }) as DOMRect,
  });
});

afterAll(() => {
  if (originalGetBBox) {
    Object.defineProperty(SVGElement.prototype, 'getBBox', originalGetBBox);
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getBBox');
  }
});

const confFor = (look: string) => ({
  ...defaultConfig.sequence,
  look,
  theme: 'redux',
  themeVariables: themes.redux.getThemeVariables(),
  sequence: defaultConfig.sequence,
});

const ACTOR_Y = 100;

/** y1 of the lifeline a participant shape emitted, relative to the top of its box. */
const lifelineTop = async (type: string, look: string) => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const actor = {
    name: type,
    description: type,
    type,
    x: 0,
    y: 0,
    starty: ACTOR_Y,
    stopy: 400,
    width: 150,
    height: 65,
    links: {},
    properties: {},
  };
  const svg = select(document.querySelector<SVGSVGElement>('svg')!);
  await svgDraw.drawActor(svg, actor, confFor(look), false, 'id', undefined, new Map([[type, 0]]));
  const line = document.querySelector('line[data-et="life-line"]')!;
  return Number(line.getAttribute('y1')) - ACTOR_Y;
};

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
});

describe('lifeline start', () => {
  it('starts the actor and the database lifeline at the same place on neo', async () => {
    // The pairing the rule exists for: both hang their label at the same offset below the box, so
    // both clear it at the same height.
    expect(await lifelineTop('actor', 'neo')).toBe(await lifelineTop('database', 'neo'));
  });

  it('starts at the box bottom for shapes whose label sits inside the box', async () => {
    // Nothing hangs below, so there is nothing to clear and no gap to leave.
    for (const type of ['participant', 'queue', 'collections', 'boundary']) {
      expect(await lifelineTop(type, 'neo')).toBe(65);
    }
  });

  it('leaves every classic lifeline exactly where it was', async () => {
    // Sequentially: these share one document, so they cannot be measured in parallel.
    const classic: Record<string, number> = {};
    for (const type of [
      'participant',
      'queue',
      'collections',
      'boundary',
      'control',
      'entity',
      'database',
      'actor',
    ]) {
      classic[type] = await lifelineTop(type, 'classic');
    }

    expect(classic).toEqual({
      participant: 65,
      queue: 65,
      collections: 65,
      boundary: 80,
      control: 75,
      entity: 75,
      database: 75,
      actor: 80,
    });
  });
});
