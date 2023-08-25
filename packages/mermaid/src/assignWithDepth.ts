/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * assignWithDepth Extends the functionality of {@link Object.assign} with the
 *   ability to merge arbitrary-depth objects For each key in src with path `k` (recursively)
 *   performs an Object.assign(dst[`k`], src[`k`]) with a slight change from the typical handling of
 *   undefined for dst[`k`]: instead of raising an error, dst[`k`] is auto-initialized to `{}` and
 *   effectively merged with src[`k`]<p> Additionally, dissimilar types will not clobber unless the
 *   config.clobber parameter === true. Example:
 *
 * ```
 * const config_0 = { foo: { bar: 'bar' }, bar: 'foo' };
 * const config_1 = { foo: 'foo', bar: 'bar' };
 * const result = assignWithDepth(config_0, config_1);
 * console.log(result);
 * //-> result: { foo: { bar: 'bar' }, bar: 'bar' }
 * ```
 *
 *   Traditional Object.assign would have clobbered foo in config_0 with foo in config_1. If src is a
 *   destructured array of objects and dst is not an array, assignWithDepth will apply each element
 *   of src to dst in order.
 * @param dst - The destination of the merge
 * @param src - The source object(s) to merge into destination
 * @param config -
 * * depth: depth to traverse within src and dst for merging
 * * clobber: should dissimilar types clobber
 */
const assignWithDepth = (
  dst: any,
  src: any,
  { depth = 2, clobber = false }: { depth?: number; clobber?: boolean } = {}
): any => {
  const config: { depth: number; clobber: boolean } = { depth, clobber };
  if (Array.isArray(src) && !Array.isArray(dst)) {
    src.forEach((s) => assignWithDepth(dst, s, config));
    return dst;
  } else if (Array.isArray(src) && Array.isArray(dst)) {
    src.forEach((s) => {
      if (!dst.includes(s)) {
        dst.push(s);
      }
    });
    return dst;
  }
  if (dst === undefined || depth <= 0) {
    if (dst !== undefined && dst !== null && typeof dst === 'object' && typeof src === 'object') {
      return Object.assign(dst, src);
    } else {
      return src;
    }
  }
  if (src !== undefined && typeof dst === 'object' && typeof src === 'object') {
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
