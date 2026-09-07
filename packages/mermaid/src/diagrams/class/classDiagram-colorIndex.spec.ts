/**
 * `colorIndex` is what drives the per-class palette under the `redux-color` /
 * `redux-dark-color` themes: `classDb` assigns the slot, `classBox` stamps it as
 * `data-color-id`, and `class/styles.js` maps it to a border and fill.
 *
 * The failure mode is silent. If the slots stop being assigned, or start being shared,
 * every box falls back to `color-0` and the diagram renders in one colour — which looks
 * like a theme problem, not a db problem. So pin the assignment here rather than relying
 * on a screenshot to notice.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { ClassDB } from './classDb.js';

describe('class diagram colour slots', () => {
  let classDb: ClassDB;
  beforeEach(() => {
    classDb = new ClassDB();
  });

  const colorIndexById = () =>
    new Map(classDb.getData().nodes.map((node) => [node.id, node.colorIndex]));

  it('gives each class its own slot in declaration order', () => {
    classDb.addClass('Order');
    classDb.addClass('Customer');
    classDb.addClass('Payment');

    const slots = colorIndexById();
    expect(slots.get('Order')).toBe(0);
    expect(slots.get('Customer')).toBe(1);
    expect(slots.get('Payment')).toBe(2);
  });

  it('does not spend a slot on a namespace container', () => {
    // `addNamespace` first: `addClassesToNamespace` early-returns when the namespace does
    // not exist, so without it no namespace node is created and the assertion below passes
    // on absence rather than on behaviour.
    classDb.addNamespace('shop');
    classDb.addClass('Order');
    classDb.addClassesToNamespace('shop', ['Order'], []);
    classDb.addClass('Customer');

    const slots = colorIndexById();
    // The namespace is a container, not a participant -- it must not shift the cycle.
    expect(slots.get('shop')).toBeUndefined();
    expect(slots.get('Order')).toBe(0);
    expect(slots.get('Customer')).toBe(1);
  });

  it('does not spend a slot on a note', () => {
    classDb.addClass('Order');
    classDb.addNote('a note', 'Order');
    classDb.addClass('Customer');

    const slots = colorIndexById();
    const noteEntry = [...slots.entries()].find(([id]) => id.startsWith('note'));
    // Notes carry the theme's fixed note colour, so they stay outside the cycle.
    expect(noteEntry?.[1]).toBeUndefined();
    expect(slots.get('Order')).toBe(0);
    expect(slots.get('Customer')).toBe(1);
  });
});
