import { calculateSvgSizeAttrs } from './zenumlRenderer.js';

describe('when calculating ZenUML SVG size', function () {
  it('should return responsive width when useMaxWidth is true', function () {
    const attrs = calculateSvgSizeAttrs(133, 392, true);

    expect(attrs.get('width')).toEqual('100%');
    expect(attrs.get('style')).toEqual('max-width: 133px;');
    expect(attrs.has('height')).toBe(false);
  });

  it('should return absolute dimensions when useMaxWidth is false', function () {
    const attrs = calculateSvgSizeAttrs(133, 392, false);

    expect(attrs.get('width')).toEqual('133');
    expect(attrs.get('height')).toEqual('392');
    expect(attrs.has('style')).toBe(false);
  });
});
