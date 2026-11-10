import { select } from 'd3';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  addDirective,
  getConfig,
  reset,
  saveConfigFromInitialize,
  setConfig,
  setSiteConfig,
} from '../../../config.js';
import type { Node } from '../../types.js';
import { renderBpmnEvent, THEME_DEFAULT_RING_WIDTH } from './bpmnEvent.js';
import { EVENT_RINGS, type EventPosition } from './bpmnShapeCore.js';

const PX_PER_CHAR = 7;
const LINE_HEIGHT = 20;

beforeAll(() => {
  // jsdom implements neither SVG measurement API; a flat metric is enough here.
  // @ts-expect-error -- jsdom's SVGElement has no getComputedTextLength
  SVGElement.prototype.getComputedTextLength = function () {
    return (this.textContent ?? '').length * PX_PER_CHAR;
  };
  // @ts-expect-error -- jsdom's SVGElement has no getBBox
  SVGElement.prototype.getBBox = function () {
    return {
      x: 0,
      y: 0,
      width: (this.textContent ?? '').length * PX_PER_CHAR,
      height: LINE_HEIGHT,
    };
  };
});

afterEach(() => {
  reset();
});

const ringWidthsOf = async (position: EventPosition, bpmn?: Record<string, unknown>) => {
  setConfig({ htmlLabels: false, ...(bpmn ? { themeVariables: { bpmn } } : {}) });
  const svg = select(document.body).append('svg');
  const node = { id: `ev-${position}`, label: 'Event', cssStyles: [] } as unknown as Node;
  await renderBpmnEvent(svg, node, position);
  return [...svg.node()!.querySelectorAll<SVGCircleElement>('circle.bpmn-event-ring')].map(
    (ring) => ring.style.strokeWidth
  );
};

const THIN = 0;
const HEAVY = 5;

describe('bpmn event ring weight', () => {
  it.each(['start', 'intermediate', 'boundary'] as const)(
    'draws every ring of a %s event at bpmn.eventStrokeWidth',
    async (position) => {
      const widths = await ringWidthsOf(position, {
        eventStrokeWidth: THIN,
        endEventStrokeWidth: HEAVY,
      });
      expect(widths.length).toBeGreaterThan(0);
      expect(new Set(widths)).toEqual(new Set([`${THIN}px`]));
    }
  );

  it('draws an end event at bpmn.endEventStrokeWidth', async () => {
    expect(
      await ringWidthsOf('end', { eventStrokeWidth: THIN, endEventStrokeWidth: HEAVY })
    ).toEqual([`${HEAVY}px`]);
  });

  it('takes a CSS length as written', async () => {
    expect(await ringWidthsOf('end', { endEventStrokeWidth: '0.2em' })).toEqual(['0.2em']);
  });

  it('keeps the end ring heavier than the start ring with the theme defaults', async () => {
    const [start] = await ringWidthsOf('start');
    const [end] = await ringWidthsOf('end');
    expect(Number.parseFloat(end)).toBeGreaterThan(Number.parseFloat(start));
  });

  it.each([
    ['an empty string', ''],
    ['a number that is not finite', Number.NaN],
  ])('falls back to the notation default for %s', async (_case, value) => {
    const [fallback] = await ringWidthsOf('end', { endEventStrokeWidth: value });
    expect(fallback).toBe(`${EVENT_RINGS.end.strokeWidth}px`);
  });

  it.each([
    ['start', ['1.6px']],
    ['intermediate', ['1.4px', '1.4px']],
    ['boundary', ['1.4px', '1.4px']],
    ['end', ['3.4px']],
  ] as const)(
    'draws a %s event at its notation weight with the theme defaults',
    async (position, widths) => {
      expect(await ringWidthsOf(position)).toEqual(widths);
    }
  );

  it.each(['start', 'intermediate', 'boundary', 'end'] as const)(
    'draws a %s event at 0px when the theme sets 0',
    async (position) => {
      const widths = await ringWidthsOf(position, { eventStrokeWidth: 0, endEventStrokeWidth: 0 });
      expect(new Set(widths)).toEqual(new Set(['0px']));
    }
  );

  describe('a width the author set', () => {
    const NOTATION_WEIGHTS = {
      start: ['1.6px'],
      intermediate: ['1.4px', '1.4px'],
      boundary: ['1.4px', '1.4px'],
      end: ['3.4px'],
    } as const satisfies Record<EventPosition, readonly string[]>;

    const inDirective = async (position: EventPosition, bpmn?: Record<string, unknown>) => {
      if (bpmn) {
        addDirective({ themeVariables: { bpmn } });
      }
      return ringWidthsOf(position);
    };

    const inInitialize = async (position: EventPosition, bpmn: Record<string, unknown>) => {
      const conf = { themeVariables: { bpmn } };
      saveConfigFromInitialize(conf);
      setSiteConfig(conf);
      try {
        return await ringWidthsOf(position);
      } finally {
        saveConfigFromInitialize({});
        setSiteConfig({});
      }
    };

    const widthOf = (position: EventPosition, width: number | string) =>
      position === 'end' ? { endEventStrokeWidth: width } : { eventStrokeWidth: width };

    const drawnAs = (position: EventPosition, css: string) =>
      NOTATION_WEIGHTS[position].map(() => css);

    describe.each(['start', 'intermediate', 'boundary', 'end'] as const)('%s', (position) => {
      const themeDefault =
        THEME_DEFAULT_RING_WIDTH[position === 'end' ? 'endEventStrokeWidth' : 'eventStrokeWidth'];

      it.each([
        ['the theme default as a number', themeDefault, `${themeDefault}px`],
        ['the theme default as a CSS length', `${themeDefault}px`, `${themeDefault}px`],
        ['0', 0, '0px'],
        ['another number', HEAVY, `${HEAVY}px`],
      ])('draws %s in a directive as written', async (_case, width, css) => {
        expect(await inDirective(position, widthOf(position, width))).toEqual(
          drawnAs(position, css)
        );
      });

      it('draws the theme default as a number given to initialize as written', async () => {
        expect(await inInitialize(position, widthOf(position, themeDefault))).toEqual(
          drawnAs(position, `${themeDefault}px`)
        );
      });

      it('keeps its notation weight when the directive sets another variable', async () => {
        expect(await inDirective(position, { eventFill: 'white' })).toEqual(
          NOTATION_WEIGHTS[position]
        );
      });
    });
  });

  it('matches the ring-width defaults of the theme', () => {
    setConfig({});
    const bpmn = getConfig().themeVariables?.bpmn;
    expect(bpmn?.eventStrokeWidth).toBe(THEME_DEFAULT_RING_WIDTH.eventStrokeWidth);
    expect(bpmn?.endEventStrokeWidth).toBe(THEME_DEFAULT_RING_WIDTH.endEventStrokeWidth);
  });
});
