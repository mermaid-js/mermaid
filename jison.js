const Jison = require('jison');
const fileRegex = /\.(jison)$/;

export default function jison() {
  return {
    name: 'jison',

    transform(src, id) {
      if (fileRegex.test(id)) {
        const parser = new Jison.Generator(src, {
          moduleType: 'js',
          // type,
        });
        const source = parser.generate();
        const exporter = `
            const parse = parser.parse.bind(parser);
            parser.parser = parse;

            export { parser };
            export default parser;
            `;

        // console.log('helll');

        return {
          code: `${source} ${exporter}`,
          map: null, // provide source map if available
        };
      }
    },
  };
}

// export default (options = {}) => ({
//   name: 'jison',
//   transform(grammar, id) {
//     const { include = ['*.jison', '**/*.jison'], exclude, type = 'lalr' } = options;
//     const filter = createFilter(include, exclude);
//     if (!filter(id)) return null;

//     const parser = new Jison.Generator(grammar, {
//       moduleType: 'js',
//       type,
//     });

//     const source = parser.generate();
//     const exporter = `
//     const parse = parser.parse.bind(parser);
//     parser.parser = parse;

//     export { parser };
//     export default parser;
//     `;

//     console.log('helll');
//     return {
//       code: `${source} ${exporter}`,
//       map: { mappings: '' },
//     };
//   },
// });
