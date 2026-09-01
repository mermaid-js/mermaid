import { describe, expect, it, beforeEach } from 'vitest';
import * as configApi from '../../config.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { LayoutData } from '../../rendering-util/types.js';
import getStyles from './styles.js';
import { KIND_COUNT, KIND_SLOT, assignColorSlots, containerSlotCount } from './colorSlots.js';

/**
 * Two rules, and the point of the tests is that they stay apart:
 *
 * - a node's colour follows its KIND, from a fixed slot, so it does not move when the
 *   diagram is edited around it;
 * - a container's colour follows a counter in declaration order, as flowchart subgraphs do.
 *
 * Both halves are pinned — the assignment and the rules that paint it — because either
 * alone is silent. A class or slot with no rule renders uncoloured; a rule with nothing
 * carrying it is dead CSS. Neither throws.
 */
const node = (id: string, kind: string) => ({ id, kind, isGroup: false }) as any;
/** Kind comes from the db in production; here it rides on the fixture. */
const kindOf = (nodes: any[]) => (id: string) => nodes.find((n) => n.id === id)?.kind;
const group = (id: string) => ({ id, isGroup: true }) as any;
const layout = (nodes: any[]) => ({ nodes, edges: [], config: {} }) as unknown as LayoutData;

describe('agentflow colour slots', () => {
  beforeEach(() => {
    configApi.setSiteConfig({});
    configApi.reset();
  });

  const withPalette = (n: number) =>
    configApi.setSiteConfig({
      themeVariables: { borderColorArray: Array.from({ length: n }, (_, i) => `#00000${i % 10}`) },
    } as any);

  describe('assignment', () => {
    it('tags a node with the kind the db reports', () => {
      withPalette(12);
      const data = layout([node('a', 'tool'), node('b', 'decision'), node('c', 'task')]);

      assignColorSlots(data.nodes as any, kindOf(data.nodes as any));

      expect(data.nodes[0].cssClasses).toContain('af-kind-tool');
      expect(data.nodes[1].cssClasses).toContain('af-kind-decision');
      expect(data.nodes[2].cssClasses).toContain('af-kind-task');
    });

    it('gives two nodes of one kind the same class, wherever they sit', () => {
      // The whole point of colouring by kind: editing around a node does not recolour it.
      withPalette(12);
      const data = layout([node('a', 'tool'), node('b', 'decision'), node('c', 'tool')]);

      assignColorSlots(data.nodes as any, kindOf(data.nodes as any));

      expect(data.nodes[0].cssClasses).toBe(data.nodes[2].cssClasses);
    });

    it('keeps any classes the node already carried', () => {
      withPalette(12);
      const data = layout([{ ...node('a', 'decision'), cssClasses: 'mine' }]);

      assignColorSlots(data.nodes as any, kindOf(data.nodes as any));

      expect(data.nodes[0].cssClasses).toBe('mine af-kind-decision');
    });

    it('numbers containers in declaration order, above the kind slots', () => {
      withPalette(12);
      const data = layout([group('one'), node('a', 'decision'), group('two'), group('three')]);

      assignColorSlots(data.nodes as any, kindOf(data.nodes as any));

      expect(data.nodes[0].colorIndex).toBe(KIND_COUNT);
      expect(data.nodes[2].colorIndex).toBe(KIND_COUNT + 1);
      expect(data.nodes[3].colorIndex).toBe(KIND_COUNT + 2);
      // A node takes no slot; its colour comes from its class.
      expect(data.nodes[1].colorIndex).toBeUndefined();
    });

    it('never folds a container back onto a kind slot', () => {
      // `stampColorSlot` takes the modulo against the whole palette, so the wrap has to
      // happen here — otherwise the container that runs off the end of the palette lands
      // back on the `tool` colour. The effective length is read from config rather than
      // assumed: `setSiteConfig` merges into the theme's own array.
      withPalette(12);
      const palette =
        (getConfig().themeVariables as { borderColorArray?: string[] }).borderColorArray ?? [];
      const data = layout(Array.from({ length: palette.length * 2 }, (_, i) => group(`g${i}`)));

      assignColorSlots(data.nodes as any, kindOf(data.nodes as any));

      for (const n of data.nodes) {
        expect(n.colorIndex).toBeGreaterThanOrEqual(KIND_COUNT);
        // What the stamp will actually resolve to.
        expect(n.colorIndex! % palette.length).toBeGreaterThanOrEqual(KIND_COUNT);
      }
    });

    it('survives a palette shorter than the kind range', () => {
      withPalette(3);
      const data = layout([group('one'), group('two')]);

      expect(() => assignColorSlots(data.nodes as any, kindOf(data.nodes as any))).not.toThrow();
      expect(containerSlotCount(3)).toBe(1);
    });
  });

  const paletteOptions = {
    arrowheadColor: '#333',
    border2: '#333',
    clusterBkg: '#f4f4f4',
    clusterBorder: '#ccc',
    edgeLabelBackground: '#fff',
    fontFamily: 'trebuchet ms',
    lineColor: '#333',
    mainBkg: '#eee',
    nodeBorder: '#999',
    nodeTextColor: '#333',
    tertiaryColor: '#ffffde',
    textColor: '#333',
    titleColor: '#333',
    theme: 'redux-color',
    look: 'neo',
    borderColorArray: Array.from({ length: 12 }, (_, i) => `#b0000${i.toString(16)}`),
    bkgColorArray: Array.from({ length: 12 }, (_, i) => `#f0000${i.toString(16)}`),
  } as any;

  describe('stylesheet', () => {
    it('emits a rule for every kind, at that kind slot colour', () => {
      const css = getStyles(paletteOptions);

      for (const [kind, slot] of KIND_SLOT) {
        expect(css, `rule for ${kind}`).toContain(`.af-kind-${kind}`);
        expect(css, `colour for ${kind}`).toContain(paletteOptions.borderColorArray[slot]);
      }
    });

    it('paints containers from the slots above the kind range', () => {
      const css = getStyles(paletteOptions);
      const first = `[data-color-id="color-${KIND_COUNT}"]`;

      // The first container slot sits after the kinds, so its colour cannot collide with
      // any node's.
      expect(css).toContain(`${first}.cluster`);
      expect(css).toContain(paletteOptions.borderColorArray[KIND_COUNT]);
      // No container may use a kind's colour.
      const containerRules = css.slice(css.indexOf(first));
      for (const [kind, slot] of KIND_SLOT) {
        expect(containerRules, `container reusing the ${kind} colour`).not.toContain(
          paletteOptions.borderColorArray[slot]
        );
      }
    });

    it('names both forms of a container, so a collapsed one is not left grey', () => {
      // A collapsed container is drawn as a `.node`, not a `.cluster`, but still holds a
      // slot — `collapsedGroup.ts` stamps it. Naming only `.cluster` would leave it
      // uncoloured beside its siblings.
      const css = getStyles(paletteOptions);
      const first = `[data-color-id="color-${KIND_COUNT}"]`;

      expect(css).toContain(`${first}.cluster`);
      expect(css).toContain(`${first}.node`);
    });

    it('uses no container slot below the kind range', () => {
      const css = getStyles(paletteOptions);

      for (let slot = 0; slot < KIND_COUNT; slot++) {
        expect(css, `slot ${slot} belongs to a kind`).not.toContain(
          `[data-color-id="color-${slot}"]`
        );
      }
    });

    it('strokes without filling when the theme carries no background palette', () => {
      // `redux-dark-color` is exactly this shape: 12 borders, no fills.
      const css = getStyles({ ...paletteOptions, bkgColorArray: [] });

      expect(css).toContain('.af-kind-tool');
      expect(css).toContain(paletteOptions.borderColorArray[0]);
      expect(css).not.toContain(paletteOptions.bkgColorArray[0]);
    });

    it('emits nothing for a theme that carries no palette', () => {
      const css = getStyles({ ...paletteOptions, theme: 'default' });

      expect(css).not.toContain('af-kind-');
      expect(css).not.toContain('data-color-id');
    });

    it('rejects a look that would break out of the selector', () => {
      const css = getStyles({ ...paletteOptions, look: 'neo"] { fill: red } [x="' });

      expect(css).not.toContain('fill: red');
      expect(css).toContain('[data-look="classic"]');
    });
  });
});
