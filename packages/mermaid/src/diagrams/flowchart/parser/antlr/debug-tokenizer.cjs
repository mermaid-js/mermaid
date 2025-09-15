const { CharStream } = require('antlr4ng');
const { FlowLexer } = require('./generated/FlowLexer.ts');

const input = 'D@{ shape: rounded }';
console.log('Input:', input);

const chars = CharStream.fromString(input);
const lexer = new FlowLexer(chars);
const tokens = lexer.getAllTokens();

console.log('Tokens:');
for (let i = 0; i < tokens.length; i++) {
  const token = tokens[i];
  console.log(`  [${i}] Type: ${token.type}, Text: '${token.text}', Channel: ${token.channel}`);
}
