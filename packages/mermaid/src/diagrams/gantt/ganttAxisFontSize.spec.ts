/**
 * The x-axis tick labels used to be hard-coded to font-size 10, with no way to change them short of
 * overriding `.tick text` through `themeCSS`. `gantt.axisFontSize` makes the size configurable.
 * It defaults to the previous hard-coded value (10), so existing charts render unchanged, and it is
 * separate from `gantt.fontSize` (default 11), which drives the task labels.
 * See https://github.com/mermaid-js/mermaid/issues/5710.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import mermaid from '../../mermaid.js';

const diagram = `gantt
    dateFormat YYYY-MM-DD
    section Section
    Task A :a1, 2024-01-01, 30d
    Task B :a2, after a1, 20d`;

/** The `font-size` attribute of every tick label in the axis group(s), as rendered. */
const tickFontSizes = async (id: string, code: string): Promise<string[]> => {
  const { svg } = await mermaid.render(id, code);
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  return [...doc.querySelectorAll('g.grid .tick text')].map(
    (text) => text.getAttribute('font-size') ?? ''
  );
};

describe('gantt axis tick font size', () => {
  beforeAll(async () => {
    // jsdom does not implement SVG text measurement, which the gantt task labels rely on.
    // @ts-expect-error -- stubbing a method jsdom lacks
    SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 });
    await mermaid.registerExternalDiagrams([]);
  });

  it('applies the configured gantt axisFontSize to the bottom axis ticks', async () => {
    mermaid.initialize({ gantt: { axisFontSize: 20 }, logLevel: 5 });
    const sizes = await tickFontSizes('gantt-axis-font-size-1', diagram);

    expect(sizes.length).toBeGreaterThan(0);
    expect(new Set(sizes)).toEqual(new Set(['20']));
  });

  it('applies the configured gantt axisFontSize to the top axis ticks as well', async () => {
    mermaid.initialize({ gantt: { axisFontSize: 20 }, logLevel: 5 });
    const bottomOnly = await tickFontSizes('gantt-axis-font-size-2', diagram);

    mermaid.initialize({ gantt: { axisFontSize: 20, topAxis: true }, logLevel: 5 });
    const both = await tickFontSizes('gantt-axis-font-size-3', diagram);

    // topAxis adds a second axis group, so every tick appears twice
    expect(both).toHaveLength(bottomOnly.length * 2);
    expect(new Set(both)).toEqual(new Set(['20']));
  });

  it('is independent of the task label fontSize', async () => {
    mermaid.initialize({ gantt: { fontSize: 30 }, logLevel: 5 });
    const sizes = await tickFontSizes('gantt-axis-font-size-5', diagram);

    expect(new Set(sizes)).toEqual(new Set(['10']));
  });

  it('keeps the previous default tick size of 10 when axisFontSize is not configured', async () => {
    mermaid.initialize({ logLevel: 5 });
    const sizes = await tickFontSizes('gantt-axis-font-size-4', diagram);

    expect(new Set(sizes)).toEqual(new Set(['10']));
  });
});
