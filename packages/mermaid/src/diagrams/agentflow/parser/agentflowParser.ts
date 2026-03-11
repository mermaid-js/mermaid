// @ts-ignore: JISON doesn't support types
import agentflowJisonParser from './agentflow.jison';

const newParser = Object.assign({}, agentflowJisonParser);

newParser.parse = (src: string): unknown => {
  // remove the trailing whitespace after closing curly braces when ending a line break
  const newSrc = src.replace(/}\s*\n/g, '}\n');
  return agentflowJisonParser.parse(newSrc);
};

export default newParser;
