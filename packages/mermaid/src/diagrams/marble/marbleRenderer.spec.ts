// @ts-expect-error Incorrect khroma types
import { luminance } from 'khroma';
import { describe, expect, it } from 'vitest';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { MarbleDiagramConfig } from '../../config.type.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import mermaidAPI from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';
import themes from '../../themes/index.js';
import { estimateTextWidth, labelRowOffset, layoutMarble } from './marbleLayout.js';
import { buildTimeline } from './marbleTimeline.js';
import type { MarbleLabel } from './marbleTypes.js';
import getStyles, { eventColors, spanColors } from './styles.js';

addDiagrams();

const config = DEFAULT_CONFIG.marble as Required<MarbleDiagramConfig>;
const lane = (name: string, body: string) => ({ name, body, line: 2, column: 4 });

describe('layoutMarble', () => {
  it('spaces columns by columnWidth', () => {
    const layout = layoutMarble(buildTimeline([lane('a', '-a--|')]), [], config);
    expect(layout.x(3)).toBe(3 * config.columnWidth);
    expect(layout.right).toBe(4 * config.columnWidth);
  });

  it('stacks lanes at least laneHeight apart', () => {
    const layout = layoutMarble(buildTimeline([lane('a', '-a-'), lane('b', '-b-')]), [], config);
    expect(layout.lanes[1].y - layout.lanes[0].y).toBeGreaterThanOrEqual(config.laneHeight);
  });

  it('spaces lanes evenly when only some of them carry labels', () => {
    const labels: MarbleLabel[] = [
      { symbol: 'a', text: 'a rather long label', colorIndex: 0 },
      { symbol: 'b', text: 'another long label', colorIndex: 1 },
      { symbol: 'c', text: 'and a third one', colorIndex: 2 },
    ];
    const layout = layoutMarble(
      buildTimeline([lane('p', '-1-'), lane('q', '-a-b-c-'), lane('r', '-2-'), lane('s', '-c-')]),
      labels,
      config
    );
    const ys = layout.lanes.map(({ y }) => y);
    const gaps = ys.slice(1).map((y, i) => y - ys[i]);
    expect(new Set(gaps).size).toBe(1);
    expect(gaps[0]).toBeGreaterThan(config.laneHeight);
    expect(layout.bottom - ys.at(-1)!).toBe(gaps[0] - (ys[0] - layout.top));
  });

  it('reserves room for the title and the axis above the first lane', () => {
    const plain = layoutMarble(buildTimeline([lane('a', '-a-')]), [], config);
    const full = layoutMarble(
      buildTimeline([lane('a', '-a-')], { ...lane('axis', '0'), line: 1 }),
      [],
      config,
      'Title'
    );
    expect(full.titleY).toBe(0);
    expect(full.axisY).toBeGreaterThan(0);
    expect(full.lanes[0].y).toBeGreaterThan(plain.lanes[0].y);
  });

  it('moves labels that would collide into another row', () => {
    const labels: MarbleLabel[] = [
      { symbol: 'a', text: 'a rather long label', colorIndex: 0 },
      { symbol: 'b', text: 'another long label', colorIndex: 1 },
      { symbol: 'c', text: 'and a third one', colorIndex: 2 },
    ];
    const layout = layoutMarble(buildTimeline([lane('l', '-a-b-c-')]), labels, config);
    expect(layout.lanes[0].labels.map(({ row }) => row)).toEqual([0, 1, 2]);
    expect(labelRowOffset(1, 10)).toBeLessThan(0);
    expect(labelRowOffset(2, 10)).toBeGreaterThan(labelRowOffset(0, 10));
  });

  it('keeps labels in one row when they fit side by side', () => {
    const labels: MarbleLabel[] = [
      { symbol: 'a', text: 'one', colorIndex: 0 },
      { symbol: 'b', text: 'two', colorIndex: 1 },
    ];
    const layout = layoutMarble(buildTimeline([lane('l', '-a-----b-')]), labels, config);
    expect(layout.lanes[0].labels.map(({ row }) => row)).toEqual([0, 0]);
  });

  it('writes a span label inside the span when it fits, and below it otherwise', () => {
    const fits: MarbleLabel[] = [{ symbol: '=', text: 'wait', colorIndex: 0 }];
    const wide = layoutMarble(buildTimeline([lane('l', '[==========]')]), fits, config);
    expect(wide.lanes[0].innerSpanLabels.size).toBe(1);
    expect(wide.lanes[0].labels).toEqual([]);

    const narrow = layoutMarble(buildTimeline([lane('l', '[=')]), fits, config);
    expect(narrow.lanes[0].innerSpanLabels.size).toBe(0);
    expect(narrow.lanes[0].labels).toHaveLength(1);
  });

  it('drops marble labels when showEventLabels is off', () => {
    const labels: MarbleLabel[] = [{ symbol: 'a', text: 'one', colorIndex: 0 }];
    const layout = layoutMarble(buildTimeline([lane('l', '-a-')]), labels, {
      ...config,
      showEventLabels: false,
    });
    expect(layout.lanes[0].labels).toEqual([]);
  });

  it('estimates wider text for longer strings', () => {
    expect(estimateTextWidth('abcd', 12)).toBeGreaterThan(estimateTextWidth('ab', 12));
  });
});

describe('marble renderer', () => {
  const source = `marble-beta
  title Every kind of marble
  axis    : 0    5    10
  source  : -a~b-------/--a~~|
  timer   :    [======!
  result  : -------------r--#
  label a "value"
  label ~ "active"
  label = "timer"
  label ! "cancelled"
`;

  jsdomIt('draws lanes, marbles, spans, terminals and breaks', async () => {
    const { svg } = await mermaidAPI.render('marble-test', source);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const root = doc.querySelector('svg')!;
    expect(root.getAttribute('aria-roledescription')).toBe('marbleDiagram');
    expect(root.getAttribute('class')).toBe('marbleDiagram');
    expect(
      [...doc.querySelectorAll('.marble-lane')].map((g) => g.getAttribute('data-lane'))
    ).toEqual(['source', 'timer', 'result']);
    expect(doc.querySelectorAll('.marble-tick')).toHaveLength(3);
    expect(doc.querySelector('.marble-title')?.textContent).toBe('Every kind of marble');
    expect(doc.querySelectorAll('.marble-event')).toHaveLength(4);
    expect(doc.querySelectorAll('.marble-span')).toHaveLength(3);
    expect(doc.querySelectorAll('.marble-span-open')).toHaveLength(0);
    expect(doc.querySelectorAll('.marble-complete')).toHaveLength(1);
    expect(doc.querySelectorAll('.marble-error')).toHaveLength(1);
    expect(doc.querySelectorAll('.marble-cancel')).toHaveLength(1);
    expect(doc.querySelectorAll('.marble-break')).toHaveLength(2);
    expect(doc.querySelector('.marble-event[data-symbol="a"]')?.getAttribute('class')).toContain(
      'marble-color-0'
    );
    expect(doc.querySelector('.marble-event[data-symbol="r"]')?.getAttribute('class')).toBe(
      'marble-event'
    );
    expect([...doc.querySelectorAll('.marble-label-text')].map((t) => t.textContent)).toContain(
      'cancelled'
    );
  });

  jsdomIt('draws RxJS groups, subscriptions, unsubscriptions and time progressions', async () => {
    const { svg } = await mermaidAPI.render(
      'marble-rxjs-syntax',
      `marble-beta
  hot    : --a--^--b--(cd|)
  subs   :      ^---!
  timed  : -a 9ms b 1.4s (c|)
  label ^ "subscribed"
`
    );
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const lane = (name: string) => doc.querySelector(`.marble-lane[data-lane="${name}"]`)!;

    const stacked = [...lane('hot').querySelectorAll('.marble-event')].filter(
      (g) =>
        g.getAttribute('data-col') ===
        lane('hot').querySelector('.marble-group')?.getAttribute('data-col')
    );
    expect(stacked.map((g) => g.getAttribute('data-symbol'))).toEqual(['c', 'd']);
    const ys = stacked.map((g) => g.querySelector('circle')!.getAttribute('cy'));
    expect(new Set(ys).size).toBe(2);
    expect(lane('hot').querySelector('.marble-group')?.getAttribute('data-size')).toBe('2');
    expect(lane('hot').querySelectorAll('.marble-subscribe')).toHaveLength(1);
    expect(lane('hot').querySelectorAll('.marble-complete')).toHaveLength(1);

    const subscription = lane('subs').querySelector('.marble-span');
    expect(subscription?.getAttribute('data-symbol')).toBe('^');
    expect(subscription?.querySelector('.marble-subscribe-mark')).not.toBeNull();
    expect(lane('subs').querySelectorAll('.marble-cancel')).toHaveLength(1);
    expect(lane('subs').querySelectorAll('.marble-lane-line')).toHaveLength(0);

    expect(
      [...lane('timed').querySelectorAll('.marble-time')].map((g) =>
        g.getAttribute('data-duration')
      )
    ).toEqual(['9ms', '1.4s']);
    expect(
      [...lane('timed').querySelectorAll('.marble-label-text')].map((t) => t.textContent)
    ).toEqual(expect.arrayContaining(['9ms', '1.4s']));
  });

  jsdomIt('uses no element ids, so diagrams on one page cannot clash', async () => {
    const { svg } = await mermaidAPI.render('marble-ids', source);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const ids = [...doc.querySelectorAll('[id]')].map((element) => element.id);
    expect(ids).toEqual(['marble-ids']);
  });

  jsdomIt('draws through rough.js in hand-drawn mode', async () => {
    const { svg } = await mermaidAPI.render(
      'marble-hand',
      `---
config:
  look: handDrawn
---
${source}`
    );
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelectorAll('g.marble-event-circle path').length).toBeGreaterThan(0);
    expect(doc.querySelectorAll('circle.marble-event-circle')).toHaveLength(0);
    expect(doc.querySelectorAll('g.marble-span-body path').length).toBeGreaterThan(0);
    expect(doc.querySelectorAll('rect.marble-span-body')).toHaveLength(0);
  });

  jsdomIt('renders the title and accessibility text from its own db', async () => {
    const { svg } = await mermaidAPI.render(
      'marble-a11y',
      'marble-beta\n  title Searching\n  accTitle: Search\n  accDescr: Typing is debounced\n  a : -a-|\n'
    );
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('title')?.textContent).toBe('Search');
    expect(doc.querySelector('desc')?.textContent).toBe('Typing is debounced');
    expect(svg).toContain('Searching');
  });

  jsdomIt('takes its look from the marble config section', async () => {
    const { svg } = await mermaidAPI.render(
      'marble-section-look',
      `---
config:
  marble:
    look: handDrawn
---
${source}`
    );
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelectorAll('g.marble-event-circle path').length).toBeGreaterThan(0);
    expect(doc.querySelectorAll('circle.marble-event-circle')).toHaveLength(0);
  });
});

describe('marble styles', () => {
  it.each(Object.keys(themes))('emits only defined values under the %s theme', (name) => {
    const css = getStyles(themes[name as keyof typeof themes].getThemeVariables({}));
    expect(css).not.toContain('undefined');
    expect(css).toContain('.marble-color-11 .marble-event-circle');
  });

  it('outlines spans in the span stroke and lifts near-black fills on a dark background', () => {
    const dark = themes.dark.getThemeVariables({}) as unknown as Record<string, string>;
    const slot0 = spanColors(dark, 0);
    expect(slot0.stroke).toBe(dark.marbleSpanStroke);
    expect(slot0.fill).not.toBe(dark.cScale0);
    expect(getStyles(dark)).toContain(`.marble-color-0 .marble-span-body {
    fill: ${slot0.fill};
    stroke: ${dark.marbleSpanStroke};`);
  });

  it.each(['dark', 'neo-dark', 'redux-dark'] as const)(
    'lifts every near-black labelled marble fill under the %s theme',
    (name) => {
      const variables = themes[name].getThemeVariables({}) as unknown as Record<string, string>;
      const css = getStyles(variables);
      for (let slot = 0; slot < 12; slot++) {
        const { fill, stroke } = eventColors(variables, slot);
        expect(luminance(fill)).toBeGreaterThanOrEqual(0.05);
        expect(stroke).toBe(variables.marbleEventStroke);
        expect(css).toContain(`.marble-color-${slot} .marble-event-circle {
    fill: ${fill};
    stroke: ${stroke};`);
      }
      expect(eventColors(variables, 0).fill).not.toBe(variables.cScale0);
    }
  );

  it('keeps the theme palette for marbles on a light background', () => {
    const light = themes.default.getThemeVariables({}) as unknown as Record<string, string>;
    expect(eventColors(light, 1)).toEqual({
      fill: light.cScale1,
      stroke: light.cScalePeer1,
      text: light.cScaleLabel1,
    });
  });

  it('keeps the theme palette for spans on a light background', () => {
    const light = themes.default.getThemeVariables({}) as unknown as Record<string, string>;
    expect(spanColors(light, 0)).toEqual({
      fill: light.cScale0,
      stroke: light.cScalePeer0,
      text: light.cScaleLabel0,
    });
  });

  it.each(['default', 'dark', 'neutral', 'forest', 'base'] as const)(
    'draws the error cross in the critical colour under the %s theme',
    (name) => {
      const variables = themes[name].getThemeVariables({}) as unknown as Record<string, string>;
      expect(variables.marbleErrorColor).toBe(variables.critBkgColor);
      expect(getStyles(variables)).toMatch(
        new RegExp(`\\.marble-error-mark {\\s*fill: none;\\s*stroke: ${variables.critBkgColor};`)
      );
    }
  );

  it('follows a theme variable override', () => {
    const variables = themes.default.getThemeVariables({ marbleLaneColor: '#123456' });
    expect(getStyles(variables)).toMatch(/\.marble-lane-line {\s*stroke: #123456;/);
  });
});
