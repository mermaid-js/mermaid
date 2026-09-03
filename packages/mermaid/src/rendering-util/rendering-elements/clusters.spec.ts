import { describe, expect, it } from 'vitest';
import { getUsecaseSystemBoundaryGeometry } from './clusters.js';

const node = {
  x: 150,
  y: 100,
  width: 200,
  height: 140,
  padding: 20,
};

describe('usecaseSystemBoundary geometry', () => {
  it('keeps a rect boundary centered and expands it for its measured title', () => {
    const geometry = getUsecaseSystemBoundaryGeometry(node, { width: 230, height: 18 });

    expect(geometry).toMatchObject({
      boundaryType: 'rect',
      width: 250,
      height: 140,
      x: 25,
      y: 30,
      bodyY: 30,
      bodyHeight: 140,
      tabHeight: 0,
      tabWidth: 0,
    });
  });

  it('includes the package tab in the union while reserving a non-overlapping body', () => {
    const geometry = getUsecaseSystemBoundaryGeometry(
      { ...node, boundaryType: 'package' },
      { width: 110, height: 22 }
    );

    expect(geometry.tabHeight).toBe(32);
    expect(geometry.bodyY).toBe(geometry.y + geometry.tabHeight);
    expect(geometry.bodyHeight).toBe(geometry.height - geometry.tabHeight);
    expect(geometry.bodyY + geometry.bodyHeight).toBe(geometry.y + geometry.height);
    expect(geometry.tabWidth).toBe(130);
    expect(geometry.tabWidth).toBeLessThanOrEqual(geometry.width);
  });

  it('grows a short package enough to preserve boundary padding below the title tab', () => {
    const geometry = getUsecaseSystemBoundaryGeometry(
      { ...node, height: 30, boundaryType: 'package' },
      { width: 80, height: 20 }
    );

    expect(geometry.height).toBe(70);
    expect(geometry.bodyHeight).toBe(40);
  });
});
