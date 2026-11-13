import { buildC4Node, showsStereotype } from './c4ShapeAdapter.js';
import type { C4ShapeLike } from './c4ShapeAdapter.js';
import type { C4DiagramConfig } from '../../config.type.js';

const shape = (overrides: Partial<C4ShapeLike> = {}): C4ShapeLike => ({
  alias: 'a',
  label: { text: 'A' },
  typeC4Shape: { text: 'system' },
  ...overrides,
});

const node = (element: C4ShapeLike, config: Partial<C4DiagramConfig> = {}) =>
  buildC4Node(element, config as C4DiagramConfig, 20, 'classic', 216);

describe('showsStereotype', () => {
  it('shows the stereotype by default', () => {
    expect(showsStereotype(shape(), {})).toBe(true);
  });

  it('hides it for the diagram when c4.showStereotypes is false', () => {
    expect(showsStereotype(shape(), { showStereotypes: false })).toBe(false);
  });

  it('lets one element opt out of a diagram that shows them', () => {
    expect(showsStereotype(shape({ showStereotype: 'false' }), { showStereotypes: true })).toBe(
      false
    );
  });

  it('lets one element opt in to a diagram that hides them', () => {
    expect(showsStereotype(shape({ showStereotype: 'true' }), { showStereotypes: false })).toBe(
      true
    );
  });
});

describe('buildC4Node stereotype', () => {
  it('carries the type line by default', () => {
    expect(node(shape({ techn: { text: 'Node.js' }, typeC4Shape: { text: 'container' } }))).toEqual(
      expect.objectContaining({ stereotype: '[Container: Node.js]' })
    );
  });

  // Empty rather than undefined: `stereotype !== undefined` is what selects the C4
  // stacked label, so undefined would drop the name and description layout as well.
  it('empties the type line rather than dropping the field when hidden', () => {
    const hidden = node(shape(), { showStereotypes: false });

    expect(hidden.stereotype).toBe('');
    expect(hidden.stereotype).not.toBeUndefined();
    expect(hidden.label).toBe('A');
  });
});
