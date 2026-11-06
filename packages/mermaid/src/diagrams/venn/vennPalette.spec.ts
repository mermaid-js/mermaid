/**
 * A theme defining no `venn*` renders every circle in one flat `primaryColor`, which is
 * what the redux colour themes shipped -- silently, since the fallback is a valid colour.
 */
import { describe, expect, it, vi } from 'vitest';
import * as configModule from '../../config.js';
import themes from '../../themes/index.js';
import type { Diagram } from '../../Diagram.js';
import { draw } from './vennRenderer.js';

/** How many the renderer reads. */
const VENN_SLOTS = 8;

const slots = Array.from({ length: VENN_SLOTS }, (_, i) => i);

const themeVariablesOf = (name: string): Record<string, string | string[] | undefined> =>
  themes[name as keyof typeof themes].getThemeVariables({}) as unknown as Record<
    string,
    string | string[] | undefined
  >;

const vennColorsOf = (name: string) =>
  slots.map((i) => themeVariablesOf(name)[`venn${i + 1}`] as string | undefined);

/**
 * Deliberately flat: their `cScale` is uniform grey in `redux` and near-black in the
 * others. Listed, so a new theme without venn colours fails the check below.
 */
const NO_VENN_PALETTE = ['neo', 'neo-dark', 'redux', 'redux-dark'];

const WITH_VENN_PALETTE = Object.keys(themes).filter((name) => !NO_VENN_PALETTE.includes(name));

it('accounts for every registered theme', () => {
  expect([...NO_VENN_PALETTE, ...WITH_VENN_PALETTE].sort()).toEqual(Object.keys(themes).sort());
});

describe.each(WITH_VENN_PALETTE)('%s venn colours', (name) => {
  it('defines every slot the renderer reads', () => {
    const colors = vennColorsOf(name);

    expect(colors.filter((color) => typeof color === 'string' && color.length > 0)).toHaveLength(
      VENN_SLOTS
    );
  });
});

describe.each(NO_VENN_PALETTE)('%s venn colours', (name) => {
  it('defines none, and so renders flat by design', () => {
    expect(vennColorsOf(name).filter(Boolean)).toEqual([]);
  });
});

/** Asserted against the array rather than hex, so retuning the palette needs no edit. */
describe.each(['redux-color', 'redux-dark-color'])('%s venn palette', (name) => {
  it('takes the theme categorical palette', () => {
    const palette = themeVariablesOf(name).borderColorArray as string[];

    expect(palette.length).toBeGreaterThan(0);
    expect(vennColorsOf(name)).toEqual(slots.map((i) => palette[i % palette.length]));
  });

  it('gives every slot a distinct colour', () => {
    expect(new Set(vennColorsOf(name)).size).toBe(VENN_SLOTS);
  });
});

describe('renderer palette fallback', () => {
  const createDiagram = () =>
    ({
      db: {
        getConfig: () => ({ padding: 15, useDebugLayout: false }),
        getDiagramTitle: () => undefined,
        getSubsetData: () => [
          { sets: ['A'], size: 10, label: 'A' },
          { sets: ['B'], size: 10, label: 'B' },
          { sets: ['A', 'B'], size: 2.5, label: 'AB' },
        ],
        getTextData: () => [],
        getStyleData: () => [],
      },
    }) as unknown as Diagram;

  const drawWithTheme = async (themeName: string) => {
    document.body.innerHTML = '<svg id="venn"></svg>';
    const spy = vi.spyOn(configModule, 'getConfig');
    spy.mockReturnValue({
      ...configModule.getConfig(),
      themeVariables: themeVariablesOf(themeName),
    } as never);

    try {
      await draw('', 'venn', '1.0', createDiagram());
    } finally {
      spy.mockRestore();
    }

    return [...document.querySelectorAll('.venn-circle path')].map(
      (path) => (path as SVGPathElement).style.fill
    );
  };

  it('paints each circle its own colour under a palette theme', async () => {
    const fills = (await drawWithTheme('redux-color')).filter(Boolean);

    expect(fills.length).toBeGreaterThanOrEqual(2);
    expect(new Set(fills).size).toBe(fills.length);
  });

  it('falls back to one colour, not to undefined, without a palette', async () => {
    // Pins the fallback, not how it is reached: the renderer guard changes no output.
    const fills = (await drawWithTheme('redux')).filter(Boolean);

    expect(fills.length).toBeGreaterThanOrEqual(2);
    expect(new Set(fills).size).toBe(1);
    expect(fills).not.toContain('undefined');
  });
});
