import { describe, expect, it } from 'vitest';
import { getImageDimensions } from './imageSquare.js';

describe('getImageDimensions', () => {
  it('should return the natural dimensions when they are valid', () => {
    const dims = getImageDimensions({ naturalWidth: 120, naturalHeight: 60 }, {});
    expect(dims).toEqual({ width: 120, height: 60 });
  });

  // Firefox returns 0 for naturalWidth/naturalHeight of SVGs without
  // explicit width/height attributes (#6362)
  it('should fall back to the asset size when natural dimensions are 0', () => {
    const dims = getImageDimensions(
      { naturalWidth: 0, naturalHeight: 0 },
      { assetWidth: 100, assetHeight: 80 }
    );
    expect(dims).toEqual({ width: 100, height: 80 });
  });

  it('should fall back to assetHeight for both dimensions when only h is set', () => {
    const dims = getImageDimensions({ naturalWidth: 0, naturalHeight: 0 }, { assetHeight: 80 });
    expect(dims).toEqual({ width: 80, height: 80 });
  });

  it('should fall back to assetWidth for both dimensions when only w is set', () => {
    const dims = getImageDimensions({ naturalWidth: 0, naturalHeight: 0 }, { assetWidth: 100 });
    expect(dims).toEqual({ width: 100, height: 100 });
  });

  it('should fall back to the default size when nothing else is available', () => {
    const dims = getImageDimensions({ naturalWidth: 0, naturalHeight: 0 }, {});
    expect(dims).toEqual({ width: 48, height: 48 });
  });

  it('should handle non-finite natural dimensions', () => {
    const dims = getImageDimensions({ naturalWidth: NaN, naturalHeight: NaN }, {});
    expect(dims).toEqual({ width: 48, height: 48 });
  });

  it('should keep a partially valid natural dimension', () => {
    const dims = getImageDimensions({ naturalWidth: 120, naturalHeight: 0 }, { assetHeight: 80 });
    expect(dims).toEqual({ width: 120, height: 80 });
  });

  it('should produce finite sizes for the constraint: on math (Firefox svg case)', () => {
    // mirrors the sizing math in imageSquare for `h: 80, constraint: on`
    const node = { assetHeight: 80 };
    const { width, height } = getImageDimensions({ naturalWidth: 0, naturalHeight: 0 }, node);
    const aspectRatio = width / height;
    const imageWidth = node.assetHeight * aspectRatio;
    const imageHeight = imageWidth / aspectRatio;
    expect(Number.isFinite(aspectRatio)).toBe(true);
    expect(imageWidth).toBe(80);
    expect(imageHeight).toBe(80);
  });
});
