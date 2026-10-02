// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { badgeAnchor, createBadgeLayer, placeBadge } from './badges.js';

function scene() {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  const path = document.createElementNS(namespace, 'path');
  svg.appendChild(path);
  Object.defineProperty(path, 'getBBox', {
    value: () => ({ x: 0, y: 0, width: 200, height: 100 }),
  });
  return { svg, path };
}

describe('threat badge placement', () => {
  it('uses a routed edge midpoint rather than the bounding rectangle center', () => {
    const { svg, path } = scene();
    const getPointAtLength = vi.fn(() => ({ x: 180, y: 70 }));
    Object.defineProperty(path, 'getTotalLength', { value: () => 300 });
    Object.defineProperty(path, 'getPointAtLength', { value: getPointAtLength });
    expect(badgeAnchor(svg, path, true)).toEqual({ x: 180, y: 70 });
    expect(getPointAtLength).toHaveBeenCalledWith(150);
  });

  it('converts a path anchor through nested transforms into root coordinates', () => {
    const { svg, path } = scene();
    Object.defineProperty(path, 'getTotalLength', { value: () => 300 });
    Object.defineProperty(path, 'getPointAtLength', { value: () => ({ x: 180, y: 70 }) });
    Object.defineProperty(path, 'getCTM', { value: () => ({}) });
    Object.defineProperty(svg, 'getCTM', {
      value: () => ({
        inverse: () => ({ multiply: () => ({ a: 2, b: 0, c: 0, d: 2, e: 100, f: 50 }) }),
      }),
    });
    expect(badgeAnchor(svg, path, true)).toEqual({ x: 460, y: 190 });
  });

  it('anchors a node at the top center', () => {
    const { svg, path } = scene();
    expect(badgeAnchor(svg, path, false)).toEqual({ x: 100, y: 0 });
  });

  it('prefers a centered badge above an unobstructed target', () => {
    expect(placeBadge({ x: 100, y: 100 }, 80, 20, [])).toEqual({
      x: 60,
      y: 72,
      width: 80,
      height: 20,
    });
  });

  it('avoids a label or existing badge occupying the preferred position', () => {
    const occupied = { x: 60, y: 72, width: 80, height: 20 };
    expect(placeBadge({ x: 100, y: 100 }, 80, 20, [occupied])).toEqual({
      x: 60,
      y: 108,
      width: 80,
      height: 20,
    });
  });

  it('can move sideways when there is text both above and below', () => {
    const obstacles = [
      { x: 60, y: -1000, width: 80, height: 1096 },
      { x: 60, y: 104, width: 80, height: 1000 },
    ];
    const badge = placeBadge({ x: 100, y: 100 }, 80, 20, obstacles);
    expect(badge.x >= 144 || badge.x + badge.width <= 56).toBe(true);
  });

  it('keeps placement finite when a dense layout has no clear candidate', () => {
    const badge = placeBadge({ x: 100, y: 100 }, 80, 20, [
      { x: -10000, y: -10000, width: 20000, height: 20000 },
    ]);
    expect(Number.isFinite(badge.x) && Number.isFinite(badge.y)).toBe(true);
  });

  it('adds a connector and measures badge text instead of assuming a fixed character width', () => {
    const { svg, path } = scene();
    const original = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getComputedTextLength');
    Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
      configurable: true,
      value: () => 120,
    });
    try {
      const add = createBadgeLayer(svg);
      add(path, 'A', false, 'T1', 'Threat on A', '#c2410c');
      expect(svg.querySelector('.threat-model-badge rect')?.getAttribute('width')).toBe('132');
      const leader = svg.querySelector('.threat-model-badge-leader');
      expect(leader?.getAttribute('data-threat-target')).toBe('A');
      expect(leader?.getAttribute('x1')).toBe('100');
      expect(leader?.getAttribute('y1')).toBe('0');
      expect(svg.querySelector('.threat-model-badges')?.parentElement).toBe(svg);
    } finally {
      if (original) {
        Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', original);
      } else {
        Reflect.deleteProperty(SVGElement.prototype, 'getComputedTextLength');
      }
    }
  });
});
