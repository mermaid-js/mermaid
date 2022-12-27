import antlr4 from 'antlr4';
import '../parser/index';
const sequenceLexer = require('../generated-parser/sequenceLexer').default;
const sequenceParser = require('../generated-parser/sequenceParser').default;
class SeqErrorListener extends antlr4.error.ErrorListener {}

export function AsyncMessageContextFixture(code: any) {
  const chars = new antlr4.InputStream(code);
  const lexer = new sequenceLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new sequenceParser(tokens);
  parser.addErrorListener(new SeqErrorListener());
  return parser._syntaxErrors ? null : parser.asyncMessage();
}

export function DividerContextFixture(code: any) {
  const chars = new antlr4.InputStream(code);
  const lexer = new sequenceLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new sequenceParser(tokens);
  parser.addErrorListener(new SeqErrorListener());
  return parser._syntaxErrors ? null : parser.divider();
}

export function CreationContextFixture(code: any) {
  const chars = new antlr4.InputStream(code);
  const lexer = new sequenceLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new sequenceParser(tokens);
  parser.addErrorListener(new SeqErrorListener());
  return parser._syntaxErrors ? null : parser.creation();
}
