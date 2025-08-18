import { setConfig } from '../../../config.js';
import { FlowchartParserFactory } from './parserFactory.js';

setConfig({
  securityLevel: 'strict',
});

describe('Debug LARK Tokenization', () => {
  it('should debug tokens for some-id[Some Title]', async () => {
    const parserFactory = FlowchartParserFactory.getInstance();
    const parser = await parserFactory.getParser('lark');
    
    // Access the internal tokenizer
    const larkParser = parser.larkParser;
    const lexer = new larkParser.constructor.LarkFlowLexer('graph TB\nsubgraph some-id[Some Title]\n\ta1-->a2\nend');
    const tokens = lexer.tokenize();
    
    console.log('🔍 Tokens for "some-id[Some Title]":');
    tokens.forEach((token, i) => {
      console.log(`  ${i}: ${token.type} = "${token.value}"`);
    });
  });

  it('should debug tokens for a-b-c', async () => {
    const parserFactory = FlowchartParserFactory.getInstance();
    const parser = await parserFactory.getParser('lark');
    
    // Access the internal tokenizer
    const larkParser = parser.larkParser;
    const lexer = new larkParser.constructor.LarkFlowLexer('graph TD;A-->B;subgraph a-b-c;c-->d;end;');
    const tokens = lexer.tokenize();
    
    console.log('🔍 Tokens for "a-b-c":');
    tokens.forEach((token, i) => {
      console.log(`  ${i}: ${token.type} = "${token.value}"`);
    });
  });
});
