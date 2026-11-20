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
import getStyles from './styles.js';

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

    const narrow = layoutMarble(buildTimeline([lane('l', '[]')]), fits, config);
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
  timer   :    [======x
  result  : -------------r--#
  label a "value"
  label ~ "active"
  label = "timer"
  label x "cancelled"
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
  });
});

describe('marble styles', () => {
  it.each(Object.keys(themes))('emits only defined values under the %s theme', (name) => {
    const css = getStyles(themes[name as keyof typeof themes].getThemeVariables({}));
    expect(css).not.toContain('undefined');
    expect(css).toContain('.marble-color-11 .marble-event-circle');
  });

  it('follows a theme variable override', () => {
    const variables = themes.default.getThemeVariables({ marbleLaneColor: '#123456' });
    expect(getStyles(variables)).toMatch(/\.marble-lane-line {\s*stroke: #123456;/);
  });
});
