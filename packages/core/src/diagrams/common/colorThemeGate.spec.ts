import { describe, expect, it } from 'vitest';
import { configKeys } from '../../defaultConfig.js';
import {
  DEFAULT_COLOR_SLOTS,
  MAX_COLOR_SLOTS,
  colorSlotCount,
  safeLook,
  stampColorSlot,
} from './colorThemeGate.js';

/**
 * `look` is interpolated straight into the palette rules' selector, and it is a top-level
 * config key — so it is reachable from diagram text through frontmatter or an init
 * directive, and `config.sanitize` only drops values containing `<`, `>` or `url(data:`.
 * Braces and quotes survive, which is enough to close the attribute selector early and
 * open a rule block of the author's choosing, escaping the `#svgId` scoping that stylis
 * applies. Every real look is a bare word, so anything else is rejected outright rather
 * than escaped.
 */
describe('safeLook', () => {
  it.each(['classic', 'handDrawn', 'neo', 'some-look', 'A_1'])(
    'passes the bare word %s',
    (look) => {
      expect(safeLook(look)).toBe(look);
    }
  );

  it.each(['classic"]{a{b', 'classic"] *', 'classic}', 'classic ', '', 'a"]{}'])(
    'falls back to classic for %j',
    (look) => {
      expect(safeLook(look)).toBe('classic');
    }
  );

  it('falls back to classic when look is absent', () => {
    expect(safeLook(undefined)).toBe('classic');
  });
});

/**
 * Unlike `look`, palette entries (`borderColorArray`/`bkgColorArray`) are interpolated
 * straight into generated CSS by `er/styles.ts`, the requirement stylesheet, `block/styles.ts`
 * and their equivalents, with nothing analogous to `safeLook` validating an entry first. A
 * hostile array entry — the same kind of `"]{a` payload `safeLook` guards against — would
 * inject if it ever reached that code.
 *
 * It cannot, but not because the palette code defends itself, and not quite for the reason
 * it looks like at a glance. `keyify` in `defaultConfig.ts` does skip any array-valued
 * property while building `configKeys` -- but that branch is never reached for these two:
 * `configKeys` is built by walking the *default* theme's variables
 * (`theme.default.getThemeVariables()`), and the default theme does not define
 * `borderColorArray`/`bkgColorArray` at all. Only `redux-color`/`redux-dark-color` do, and
 * their variables never populate the object `keyify` walks. So today the property is simply
 * absent, not present-and-filtered.
 *
 * `sanitizeDirective` strips any key that is not in `configKeys` -- the same mechanism that
 * keeps a user from setting arbitrary config through front matter at all -- so either way,
 * a directive-supplied `borderColorArray` cannot reach the palette code. The array-skip
 * would become the operative defence, rather than a currently-unexercised one, if a future
 * change ever gave the default theme its own `borderColorArray`/`bkgColorArray`. Pinning the
 * outcome here, rather than the mechanism, is what keeps this test meaningful regardless of
 * which of the two is actually doing the work.
 */
describe('palette arrays are excluded from configKeys', () => {
  it.each(['borderColorArray', 'bkgColorArray'])('%s is not a recognised config key', (key) => {
    expect(configKeys.has(key)).toBe(false);
  });
});

/**
 * `stampColorSlot` wraps at `palette.length`; the stylesheets emit one rule per slot up to
 * `colorSlotCount`. Those two counts have to agree, or an item gets stamped `color-N` with
 * no rule emitted for it and renders uncoloured beside its neighbours.
 *
 * Both shipped colour themes carry exactly `THEME_COLOR_LIMIT` entries, so they agree by
 * coincidence -- which is what hid this. A `themeVariables` override with a longer palette
 * is where they come apart.
 */
describe('colorSlotCount', () => {
  it('floors a missing or non-numeric limit to the default', () => {
    expect(colorSlotCount(undefined)).toBe(12);
    expect(colorSlotCount('12')).toBe(12);
    expect(colorSlotCount(0)).toBe(12);
  });

  it('covers the palette when it is longer than the limit', () => {
    expect(
      colorSlotCount(
        3,
        Array.from({ length: 20 }, () => '#000')
      )
    ).toBe(20);
  });

  it('matches the palette when it is shorter than the limit', () => {
    // Changed from expecting the limit. `stampColorSlot` assigns
    // `colorIndex % palette.length`, so a two-entry palette can only ever produce color-0
    // and color-1 -- enumerated over 500 indices to check. Emitting twelve rules would
    // leave ten that nothing can match.
    expect(colorSlotCount(12, ['#a', '#b'])).toBe(2);
  });

  it('keeps the plain limit when given no palette', () => {
    expect(colorSlotCount(7)).toBe(7);
  });
});

/**
 * Whatever the limit, the result is used directly as a `for` bound, so it has to be a value
 * a loop can finish on. `Infinity` is reachable from diagram text:
 * `THEME_COLOR_LIMIT: .inf` in front matter parses to it under the `JSON_SCHEMA` mermaid
 * loads YAML with, and a large finite value such as `1e9` wedges generation just as
 * effectively.
 */
describe('colorSlotCount stays a usable loop bound', () => {
  it.each([
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
    ['NaN', Number.NaN],
    ['a huge integer', 1e9],
    ['a fraction', 12.5],
    ['a negative', -1],
  ])('falls back to the default for %s', (_label, value) => {
    expect(colorSlotCount(value)).toBe(DEFAULT_COLOR_SLOTS);
  });

  it('does not cap the palette path, because the palette is the bound', () => {
    // This assertion previously expected MAX_COLOR_SLOTS, which was the bug: capping here
    // let a palette longer than the cap stamp `color-64` and above with no rule emitted.
    // A palette is inherently finite, so its own length is the bound.
    const huge = Array.from({ length: MAX_COLOR_SLOTS + 50 }, () => '#000');
    expect(colorSlotCount(12, huge)).toBe(huge.length);
  });

  it('always yields a finite positive integer within the cap', () => {
    for (const value of [Number.POSITIVE_INFINITY, 1e9, Number.NaN, -1, 12.5, 'x', {}]) {
      const bound = colorSlotCount(value);
      expect(Number.isInteger(bound)).toBe(true);
      expect(bound).toBeGreaterThan(0);
      expect(bound).toBeLessThanOrEqual(MAX_COLOR_SLOTS);
    }
  });
});

describe('stampColorSlot leaves an unnumbered element alone', () => {
  const stamped = (colorIndex: number | undefined) => {
    let attr: string | undefined;
    const selection = {
      attr: (_name: string, value: string) => {
        attr = value;
        return selection;
      },
    } as unknown as Parameters<typeof stampColorSlot>[0];
    stampColorSlot(selection, colorIndex, 'redux-color', ['#a', '#b']);
    return attr;
  };

  it('stamps nothing when there is no colorIndex', () => {
    // Not `color-0`: an absent index means the element is outside the cycle, and painting
    // it in the first palette colour is the opposite of that. State composites carrying
    // the author's own `classDef` are the live case.
    expect(stamped(undefined)).toBeUndefined();
  });

  it('still stamps slot zero when the index really is zero', () => {
    expect(stamped(0)).toBe('color-0');
  });
});
