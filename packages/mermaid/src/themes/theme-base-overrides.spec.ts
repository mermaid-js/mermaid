/**
 * `base` is the one theme documented as modifiable, so an explicit `themeVariables`
 * override has to be the value that actually paints.
 *
 * `useGradient` breaks that. Under `look: neo` the rules in `styles.ts` paint node
 * strokes with `url(#…-gradient)` whenever `useGradient` is set, and `base` sets it by
 * default — so `themeVariables: { nodeBorder: '#225577' }` was silently discarded. That
 * went unnoticed while `classic` was the default look, because the neo rules never
 * applied.
 *
 * The resolution is scoped as narrowly as it can be: an explicit `nodeBorder` turns the
 * gradient off, and nothing else changes.
 */
import { describe, expect, it } from 'vitest';
import themes from './index.js';

const base = (overrides: Record<string, unknown> = {}) =>
  themes.base.getThemeVariables(overrides) as unknown as Record<string, unknown>;

describe('base theme overrides', () => {
  it('keeps the gradient when nothing is overridden', () => {
    expect(base().useGradient).toBe(true);
  });

  it('keeps the gradient for an unrelated override', () => {
    expect(base({ mainBkg: '#ffe1ef' }).useGradient).toBe(true);
  });

  it('drops the gradient when nodeBorder is overridden, so the override paints', () => {
    const variables = base({ nodeBorder: '#225577' });
    expect(variables.nodeBorder).toBe('#225577');
    expect(variables.useGradient).toBe(false);
  });

  it('lets an explicit useGradient win over that inference', () => {
    // Asking for both is how you keep the gradient and still set a border colour for
    // whatever else reads `nodeBorder`.
    const variables = base({ nodeBorder: '#225577', useGradient: true });
    expect(variables.nodeBorder).toBe('#225577');
    expect(variables.useGradient).toBe(true);
  });

  it('still honours useGradient: false on its own', () => {
    expect(base({ useGradient: false }).useGradient).toBe(false);
  });
});
