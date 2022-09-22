import { transformJison } from './jisonTransformer.js';
const fileRegex = /\.(jison)$/;

export default function jison() {
  return {
    name: 'jison',

    transform(src, id) {
      if (fileRegex.test(id)) {
        return {
          code: transformJison(src),
          map: null, // provide source map if available
        };
      }
    },
  };
}
