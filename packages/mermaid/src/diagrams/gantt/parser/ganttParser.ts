// @ts-ignore: JISON doesn't support types
import ganttJisonParser from './gantt.jison';

const newParser = Object.assign({}, ganttJisonParser);

newParser.parse = (src: string): unknown => {
  // remove the trailing whitespace after closing curly braces when ending a line break
  const newSrc = src.replace(/}\s*\n/g, '}\n');
  return ganttJisonParser.parse(newSrc);
};

export default newParser;
