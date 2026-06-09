import utils from './utils.js';
import assignWithDepth from './assignWithDepth.js';
import { detectType } from './diagram-api/detectType.js';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import { calculateSvgSizeAttrs } from './setupGraphViewbox.js';
addDiagrams();

describe('when calculating SVG size', function () {
  it('should return width 100% when useMaxWidth is true', function () {
    const attrs = calculateSvgSizeAttrs(100, 200, true);
    // expect(attrs.get('height')).toEqual(100);
    expect(attrs.get('style')).toEqual('max-width: 200px;');
    expect(attrs.get('width')).toEqual('100%');
  });
  it('should return absolute width when useMaxWidth is false', function () {
    const attrs = calculateSvgSizeAttrs(100, 200, false);
    // expect(attrs.get('height')).toEqual(100);
    expect(attrs.get('width')).toEqual(200);
  });
});
