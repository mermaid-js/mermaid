// eslint-disable-next-line @typescript-eslint/no-var-requires
const { transformJison } = require('./jisonTransformer');
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
