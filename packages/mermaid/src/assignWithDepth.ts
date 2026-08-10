/**
 * Extends the functionality of {@link Object.assign} with the
 * ability to merge arbitrary-depth objects.
 *
 * For each key in `src` with path `k` (recursively)
 * performs an `Object.assign(dst['k'], src['k'])` with a slight change from the
 * typical handling of `undefined` for `dst['k']`:
 * instead of raising an error, `dst['k']` is auto-initialized to `{}` and
 * effectively merged with `src['k']`
 *
 * Additionally, dissimilar types will not clobber. Example:
 *
 * ```
 * const config_0 = { foo: { bar: 'bar' }, bar: 'foo' };
 * const config_1 = { foo: 'foo', bar: 'bar' };
 * const result = assignWithDepth(config_0, config_1);
 * console.log(result);
 * //-> result: { foo: { bar: 'bar' }, bar: 'bar' }
 * ```
 *
 * Traditional {@link Object.assign} would have clobbered `foo` in `config_0` with `foo` in `config_1`.
 * If `src` is a destructured array of objects and `dst` is not an array,
 * `assignWithDepth` will apply each element of `src` to `dst` in order.
 *
 * @param dst - The destination of the merge
 * @param src - The source object(s) to merge into destination
 * @param config -
 * * depth: depth to traverse within src and dst for merging
 */
const assignWithDepth = (
  dst: unknown,
  src: unknown,
  { depth = 2 }: { depth?: number } = {}
): // eslint-disable-next-line @typescript-eslint/no-explicit-any
any => {
  const config = { depth };
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
  if (dst === undefined || dst === null || depth <= 0) {
    if (dst !== undefined && dst !== null && typeof dst === 'object' && typeof src === 'object') {
      return Object.assign(dst, src);
    } else {
      return src;
    }
  }
  if (src !== undefined && src !== null && typeof dst === 'object' && typeof src === 'object') {
    const dstWithKeys = dst as typeof dst & Record<string, unknown>;
    Object.entries(src).forEach(([key, srcValue]) => {
      if (typeof srcValue === 'object') {
        if (srcValue === null) {
          return;
        }
        if (!Object.hasOwn(dst, key)) {
          Object.defineProperty(dst, key, {
            value: undefined,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        }
        if (dstWithKeys[key] === undefined) {
          dstWithKeys[key] = Array.isArray(srcValue) ? [] : {};
        }
        if (typeof dstWithKeys[key] === 'object') {
          dstWithKeys[key] = assignWithDepth(dstWithKeys[key], srcValue, { depth: depth - 1 });
        }
      } else if (typeof dstWithKeys[key] !== 'object') {
        if (Object.hasOwn(dst, key)) {
          dstWithKeys[key] = srcValue;
        } else {
          Object.defineProperty(dst, key, {
            value: srcValue,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        }
      }
    });
  }
  return dst;
};

export default assignWithDepth;
