'use strict';
/**
 * @function assignWithDepth Extends the functionality of {@link ObjectConstructor.assign} with the
 *   ability to merge arbitrary-depth objects For each key in src with path `k` (recursively)
 *   performs an Object.assign(dst[`k`], src[`k`]) with a slight change from the typical handling of
 *   undefined for dst[`k`]: instead of raising an error, dst[`k`] is auto-initialized to {} and
 *   effectively merged with src[`k`]<p> Additionally, dissimilar types will not clobber unless the
 *   config.clobber parameter === true. Example:
 *
 *   ```js
 *   let config_0 = { foo: { bar: 'bar' }, bar: 'foo' };
 *   let config_1 = { foo: 'foo', bar: 'bar' };
 *   let result = assignWithDepth(config_0, config_1);
 *   console.log(result);
 *   //-> result: { foo: { bar: 'bar' }, bar: 'bar' }
 *   ```
 *
 *   Traditional Object.assign would have clobbered foo in config_0 with foo in config_1. If src is a
 *   destructured array of objects and dst is not an array, assignWithDepth will apply each element
 *   of src to dst in order.
 * @param {any} dst - The destination of the merge
 * @param {any} src - The source object(s) to merge into destination
 * @param {{ depth: number; clobber: boolean }} [config={ depth: 2, clobber: false }] - Depth: depth
 *   to traverse within src and dst for merging - clobber: should dissimilar types clobber (default:
 *   { depth: 2, clobber: false }). Default is `{ depth: 2, clobber: false }`
 * @returns {any}
 */
const assignWithDepth = function (dst, src, config) {
  const { depth, clobber } = Object.assign({ depth: 2, clobber: false }, config);
  if (Array.isArray(src) && !Array.isArray(dst)) {
    src.forEach((s) => assignWithDepth(dst, s, config));
    return dst;
  } else if (Array.isArray(src) && Array.isArray(dst)) {
    src.forEach((s) => {
      if (dst.indexOf(s) === -1) {
        dst.push(s);
      }
    });
    return dst;
  }
  if (typeof dst === 'undefined' || depth <= 0) {
    if (dst !== undefined && dst !== null && typeof dst === 'object' && typeof src === 'object') {
      return Object.assign(dst, src);
    } else {
      return src;
    }
  }
  if (typeof src !== 'undefined' && typeof dst === 'object' && typeof src === 'object') {
    Object.keys(src).forEach((key) => {
      if (
        typeof src[key] === 'object' &&
        (dst[key] === undefined || typeof dst[key] === 'object')
      ) {
        if (dst[key] === undefined) {
          dst[key] = Array.isArray(src[key]) ? [] : {};
        }
        dst[key] = assignWithDepth(dst[key], src[key], { depth: depth - 1, clobber });
      } else if (clobber || (typeof dst[key] !== 'object' && typeof src[key] !== 'object')) {
        dst[key] = src[key];
      }
    });
  }
  return dst;
};

export default assignWithDepth;
