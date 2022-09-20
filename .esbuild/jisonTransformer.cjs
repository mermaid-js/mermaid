const { Generator } = require('jison');
exports.transformJison = (src, esm = true) => {
  const parser = new Generator(src, {
    moduleType: 'js',
    'token-stack': true,
  });
  const source = parser.generate({ moduleMain: '() => {}' });
  const exporter = esm
    ? `
	parser.parser = parser;
	export { parser };
	export default parser;
	`
    : '';
  return `${source} ${exporter}`;
};
