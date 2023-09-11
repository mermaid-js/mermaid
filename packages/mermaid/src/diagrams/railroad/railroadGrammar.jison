/*
 Mermaid
 https://mermaid.js.org/
 MIT license.
*/

// To avoid conflicts this grammar uses following notations
//
// `C_` prefix    means character, or character class
// `TOKEN`, '+'   tokens or terminals must be uppper case only, without C_ prefix, or a character like '+'
// non_terminal   non terminals must be snake_case
// value_         for aliases to access parsing information, use _ at the end

//------------------
// Lexical analysis
//------------------

%options flex

%lex

// Definitions
C_HYPHEN \u002D // -
C_COMMA \u002c // ,
C_DOT \u002E // .
C_COLON \u003A // :
C_SEMICOLON \u003B // ;
C_VERTICAL_LINE \u007C // |
C_SLASH \u002f // /
C_APOSTROPHE \u0027 // '
C_QUOTATION_MARK \u0022 // "
C_LEFT_PARENTHESIS	 \u0028 // (
C_RIGHT_PARENTHESIS	 \u0029 // )
C_LEFT_SQUARE_BRACKET \u005B // [
C_RIGHT_SQUARE_BRACKET \u005D // ]
C_LEFT_CURLY_BRACKET \u007B // {
C_RIGHT_CURLY_BRACKET \u007D // }
C_LESS_THAN \u003C // <
C_GREATER_THAN \u003E // >
C_QUANTIFIER [\u003F\u002B\u002A] // ?+* regexp-like
C_TEXTDATA [\u0020-\u0021\u0023-\u0026\u0028-\u003B\u003D\u003F-\u007E] // everything except ' " < >

// C_CR \u000D
// C_LF \u000A
// C_TAB \u0009
// C_VTAB \u000B
// EQUALS_SIGN \u003D // =
// QUESTION_MARK \u003F // ?
// PLUS_SIGN \u002B // +
// ASTERISK \u002A // *
// EXCLAMATION_MARK \u0021 // !
// DEFINE \u003A\u003A\u003D // ::=
// ASSIGN \u003A\u003D // :=
// ARROW \u002D\u3009 // ->

// Start conditions
%x diag
// 'string'
%x string
// "qstring"
%x qstring
// <non-term>
%x nonterm

%%

// Tokenization
// Order of scanning matters
// The more broader the token, the lower it must be
// Everything is wrapped in parentheses intentionally
// https://stackoverflow.com/questions/31862815/jison-lex-without-white-spaces
// https://github.com/zaach/jison/wiki/Deviations-From-Flex-Bison

<nonterm>(({C_TEXTDATA}|{C_APOSTROPHE}|{C_QUOTATION_MARK})+) { return 'NONTERM' }
<nonterm>({C_GREATER_THAN}) { this.popState(); return '>' }

<qstring>(({C_TEXTDATA}|{C_LESS_THAN}|{C_GREATER_THAN}|{C_APOSTROPHE})+) { return 'QSTRING' }
<qstring>({C_QUOTATION_MARK}) { this.popState(); return '"' }

<string>(({C_TEXTDATA}|{C_LESS_THAN}|{C_GREATER_THAN}|{C_QUOTATION_MARK})+) { return 'STRING' }
<string>({C_APOSTROPHE}) { this.popState(); return 'APOSTROPHE' }

<INITIAL>("railroad-beta") { this.pushState('diag'); return 'railroad-beta' }

<*>([A-Za-z_][A-Za-z0-9_]*) { return 'IDENTIFIER' }
<*>({C_VERTICAL_LINE}|{C_SLASH}) { return '|' }
<*>({C_COMMA}) { return ',' }
<*>("::="|":="|":"|"="|"->") { return '=' }
<*>({C_SEMICOLON}|{C_DOT}) { return ';' }
<*>({C_LEFT_PARENTHESIS}) { return '(' }
<*>({C_RIGHT_PARENTHESIS}) { return ')' }
<*>({C_LEFT_SQUARE_BRACKET}) { return '[' }
<*>({C_RIGHT_SQUARE_BRACKET}) { return ']' }
<*>({C_LEFT_CURLY_BRACKET}) { return '{' }
<*>({C_RIGHT_CURLY_BRACKET}) { return '}' }
<*>({C_LESS_THAN}) { this.pushState('nonterm'); return '<' }
<*>({C_GREATER_THAN}) { return '>' }
<*>({C_QUOTATION_MARK}) { this.pushState('qstring'); return '"' }
<*>({C_APOSTROPHE}) { this.pushState('string'); return 'APOSTROPHE' }
<*>({C_QUANTIFIER}) { return 'QUANTIFIER' }
<*><<EOF>> { return 'EOF' } // match end of file
<*>(\s+) {}

/lex

//-----------------
// Syntax analysis
//-----------------

// Configuration

%start syntax
%ebnf

%%

// https://www.w3.org/TR/2010/REC-xquery-20101214/#EBNFNotation
//
// Grammar ::= Production*
// Production ::= NCName '::=' ( Choice | Link )
// NCName ::= [http://www.w3.org/TR/xml-names/#NT-NCName]
// Choice ::= SequenceOrDifference ( '|' SequenceOrDifference )*
// SequenceOrDifference ::= (Item ( '-' Item | Item* ))?
// Item ::= Primary ( '?' | '*' | '+' )*
// Primary ::= NCName | StringLiteral | CharCode | CharClass | '(' Choice ')'
// StringLiteral ::= '"' [^"]* '"' | "'" [^']* "'" /* ws: explicit */
// CharCode ::= '#x' [0-9a-fA-F]+ /* ws: explicit */
// CharClass ::= '[' '^'? ( Char | CharCode | CharRange | CharCodeRange )+ ']' /* ws: explicit */
// Char ::= [http://www.w3.org/TR/xml#NT-Char]
// CharRange ::= Char '-' ( Char - ']' ) /* ws: explicit */
// CharCodeRange ::= CharCode '-' CharCode /* ws: explicit */
// Link ::= '[' URL ']'
// URL ::= [^#x5D:/?#]+ '://' [^#x5D#]+ ('#' NCName)? /* ws: explicit */
// Whitespace ::= S | Comment
// S ::= #x9 | #xA | #xD | #x20
// Comment ::= '/*' ( [^*] | '*'+ [^*/] )* '*'* '*/' /* ws: explicit */

// https://www.w3.org/2001/06/blindfold/grammar
//
// grammar ::= clause*                   # A grammar is zero or more clauses
// clause  ::= clauseName "::=" pattern  # A clause associates a name with a pattern
// pattern ::= branch ("|" branch)*      # A pattern has one or more branches (alternatives)
// branch  ::= term+                     # A branch is one or more terms
// term    ::=                           # A term is:
//             string                    #  a string in single or double quotes
//           | charset                   #  a character set (as in perl: [a-z0-9], etc)
//           | "(" pattern ")"           #  a pattern, in parentheses
//           | clauseName                #  a clauseName, matching a pattern by name
//           | term [*+?]                #  a term followed by a "*", "+", or "?" operator

// https://plantuml.com/ebnf
//
// @startebnf
// grammar = { rule };
// rule = lhs , "=" (* definition *) , rhs , ";" (* termination *);
// lhs = identifier ;
// rhs = identifier
//      | terminal
//      | "[" , rhs (* optional *) , "]"
//      | "{" , rhs (* repetition *), "}"
//      | "(" , rhs (* grouping *) , ")"
//      | "(*" , string (* comment *) , "*)"
//      | "?" , rhs (* special sequence, aka notation *) , "?"
//      | rhs , "|" (* alternation *) , rhs
//      | rhs , "," (* concatenation *), rhs ;
// identifier = letter , { letter | digit | "_" } ;
// terminal = "'" , character , { character } , "'"
//          | '"' , character , { character } , '"' ;
// character = letter | digit | symbol | "_" ;
// symbol = "[" | "]" | "{" | "}" | "(" | ")" | "<" | ">"
//        | "'" | '"' | "=" | "|" | "." | "," | ";" ;
// digit = ? 0-9 ? ;
// letter = ? A-Z or a-z ? ;
// @endebnf

// ISO-14977
//
// language ::= syntax_rule+ '.'
// syntax_rule ::= id '::=' definitions_list ';'
// definitions_list ::= single_definition ( '|' single_definition)*
// single_definition ::= syntactic_term (',' syntactic_term)*
// syntactic_term ::= syntactic_factor | syntactic_factor '-' syntactic_exception
// syntactic_exception ::= syntactic-factor
//
// syntactic-exception consists of a syntactic-factor subject
// to the restriction that the sequences of symbols represented
// by the syntactic-exception could equally be represented by
// a syntactic-factor containing no meta-identifiers.
//
// syntactic_factor ::= integer '*' syntactic_primary | syntactic_primary
// integer ::= \d+
// syntactic_primary ::=
//   | optional-sequence
//   | repeated-sequence
//   | grouped-sequence
//   | meta-identifier
//   | terminal-string
//   | special-sequence
//   | // empty
//   ;
//
// optional-sequence ::= '[' definitions_list ']'
// repeated sequence ::= '{' definitions_list '}'
// grouped-sequence ::= '(' definitions_list ')'
// meta-identifier ::= letter (letter | decimal_digit )*
// terminal-string ::= \' [^']+ \' | \" [^"]+ \"
// special-sequence ::= '?' special-sequence-character* '?'
// special-sequence-character ::= '?' terminal-character except ? '?'

syntax: 'railroad-beta' rule* EOF;

rule
  : rule_id\[rule_id_] '=' choice\[choice_] ';' {
      yy.getConsole().log($rule_id_.toString(), '=', $choice_.toString());
      yy.addRuleOrChoice($rule_id_, $choice_);
    };

rule_id
  : '<' NONTERM '>' {
      $$=$NONTERM;
    }
  | IDENTIFIER {
      $$=$IDENTIFIER;
    }
  ;

choice
  : alternatives {
      $$=yy.addChoice($alternatives);
    }
  ;

alternatives
  : sequence "|" alternatives\[tail_] {
      $$=[$sequence, ...$tail_];
    }
  | sequence {
      $$=[$sequence];
    }
  | {
      $$ = [yy.addEpsilon()];
    }
  ;

sequence
  : (fact ","?)+\[facts_] {
      $$ = yy.addSequence(Object.values($facts_));
    }
  ;

fact
  : prim QUANTIFIER?\[quantifier_] {
      switch($quantifier_) {
        case '?': $$ = yy.addZeroOrOne($prim); break;
        case '+': $$ = yy.addOneOrMany($prim); break;
        case '*': $$ = yy.addZeroOrMany($prim); break;
        default: $$ = $prim;
      };
    }
  ;

prim
  : '(' choice ')' { $$=$choice; }
  | '[' choice ']' { $$=yy.addZeroOrOne($choice); }
  | '{' choice '}' { $$=yy.addZeroOrMany($choice); }
  | '"' (QSTRING)?\[qstring_] '"' {
      $$=yy.addTerm($qstring_, '"'); // TODO: add bunch of terminals instead of one?
    }
  | APOSTROPHE (STRING)?\[string_] APOSTROPHE {
      $$=yy.addTerm($string_, "'");
    }
  | rule_id { $$=yy.addNonTerm($rule_id); }
  ;

// TODO:
// ? should we recognize some terms without quotes, such as / and others?
//   (all, except spaces and symbols reserved for grammar defnintion)
// ? should we allow string usage along with <non-term> at the left side?
// * allow quotes escapement
// * allow < > escapement in non-terminals
// * mark empty with %e ?

// resolve quantifiers
// (()?)? => ()?
// (()*)? => ()*