// @ts-ignore: JISON doesn't support types
import flowJisonParser from './flow.jison';

const newParser = Object.assign({}, flowJisonParser);

newParser.parse = (src: string): unknown => {
  // remove the trailing whitespace after closing curly braces when ending a line break
  const newSrc = src.replace(/}\s*\n/g, '}\n');
  return flowJisonParser.parse(newSrc);
};

export default newParser;
