// @ts-ignore: JISON doesn't support types
import agentflowJisonParser from './agentflow.jison';

const newParser = Object.assign({}, agentflowJisonParser);

newParser.parse = (src: string): unknown => {
  // Strip trailing horizontal whitespace between a closing `}` and the line's
  // newline so the grammar's `node shapeData separator` rule still reduces
  // (a stray SPACE token after `}` otherwise breaks the parse). Match only
  // non-newline whitespace (`[^\S\n]`) — using `\s` here would also swallow a
  // blank line that immediately follows an `@{ ... }` block, folding every
  // downstream position one line per blank and drifting error/marker line
  // numbers out of source space (issue #56).
  const newSrc = src.replace(/}[^\S\n]*\n/g, '}\n');
  return agentflowJisonParser.parse(newSrc);
};

export default newParser;
