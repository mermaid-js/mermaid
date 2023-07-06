/*
  Mermaid
  https://mermaid.js.org/
  MIT license.
*/

//------------------
// Lexical analysis
//------------------

%lex

// Pre lexer steps

%{
%}

// Start conditions
%x diagram

// Definitions
DIAGRAM_KEYWORD "railroad-beta"

%%

// Tokenization
<INITIAL>DIAGRAM_KEYWORD       { this.pushState('diagram'); return 'DIAGRAM_KEYWORD'; }
<INITIAL,diagram>\s+           {}
<INITIAL,diagram><<EOF>>       { return 'EOF' } // match end of file

/lex

//-----------------
// Syntax analysis
//-----------------

// Configuration

%start start

%%

// Grammar

start: DIAGRAM_KEYWORD EOF;

