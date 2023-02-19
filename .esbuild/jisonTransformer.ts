// @ts-ignore No typings for jison
import jison from 'jison';

export const transformJison = (src: string): string => {
  // @ts-ignore No typings for jison
  const parser = new jison.Generator(src, {
    moduleType: 'js',
    'token-stack': true,
  });
  const source = parser.generate({ moduleMain: '() => {}' });
  const exporter = `
	parser.parser = parser;
	export { parser };
	export default parser;
	`;
  return `${source} ${exporter}`;
};
