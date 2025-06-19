// Explore JISON parser structure to find lexer access
import jisonParser from './flow.jison';
import { FlowDB } from '../flowDb.js';

console.log('=== JISON Parser Structure Exploration ===');

// Initialize parser
const flowDb = new FlowDB();
jisonParser.yy = flowDb;

console.log('\n1. Main parser object properties:');
console.log(Object.keys(jisonParser));

console.log('\n2. Parser object properties:');
if (jisonParser.parser) {
  console.log(Object.keys(jisonParser.parser));
}

console.log('\n3. Lexer object properties:');
if (jisonParser.lexer) {
  console.log(Object.keys(jisonParser.lexer));
  console.log('\nLexer methods:');
  console.log(Object.getOwnPropertyNames(jisonParser.lexer).filter(name => 
    typeof jisonParser.lexer[name] === 'function'
  ));
}

console.log('\n4. Parser.lexer properties:');
if (jisonParser.parser && jisonParser.parser.lexer) {
  console.log(Object.keys(jisonParser.parser.lexer));
  console.log('\nParser.lexer methods:');
  console.log(Object.getOwnPropertyNames(jisonParser.parser.lexer).filter(name => 
    typeof jisonParser.parser.lexer[name] === 'function'
  ));
}

// Test lexer access
console.log('\n5. Testing lexer access:');
const testInput = 'graph TD';

try {
  // Try different ways to access the lexer
  const lexer = jisonParser.lexer || jisonParser.parser?.lexer;
  
  if (lexer) {
    console.log('Found lexer, testing tokenization...');
    
    // Try to set input and get tokens
    if (typeof lexer.setInput === 'function') {
      lexer.setInput(testInput);
      console.log('Input set successfully');
      
      // Try to get tokens one by one
      const tokens = [];
      let token;
      let count = 0;
      while ((token = lexer.lex()) !== 'EOF' && count < 10) {
        tokens.push({
          type: token,
          value: lexer.yytext,
          line: lexer.yylineno,
          column: lexer.yylloc?.first_column || 0
        });
        count++;
      }
      
      console.log('Extracted tokens:', tokens);
    } else {
      console.log('setInput method not found');
    }
  } else {
    console.log('No lexer found');
  }
} catch (error) {
  console.log('Error accessing lexer:', error.message);
}

console.log('\n6. Available methods on main parser:');
console.log(Object.getOwnPropertyNames(jisonParser).filter(name => 
  typeof jisonParser[name] === 'function'
));
