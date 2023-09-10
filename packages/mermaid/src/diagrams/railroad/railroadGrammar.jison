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

syntax: 'railroad-beta' rule* EOF;

rule
  : rule_id\[rule_id_] '=' alternative\[alternative_] ';' {
      yy.getConsole().log($rule_id_.toString(), '=', $alternative_.toString());
      yy.addRuleOrAlternative($rule_id_, $alternative_);
    };

rule_id
  : '<' NONTERM '>' {
      $$=$NONTERM;
    }
  | IDENTIFIER {
      $$=$IDENTIFIER;
    }
  ;

alternative
  : concatenations\[concatenations_] {
      $$=yy.addAlternative($concatenations_);
    }
  ;

concatenations
  : concatenation\[concatenation_] "|" concatenations\[tail_] {
      $$=[$concatenation_, ...$tail_];
    }
  | concatenation\[concatenation_] {
      $$=[$concatenation_];
    }
  | {
      $$ = [yy.addEpsilon()];
    }
  ;

concatenation
  : (fact ","?)+\[facts_] {
      $$ = yy.addConcatenation(Object.values($facts_));
    }
  ;

fact
  : prim\[prim_] QUANTIFIER?\[quantifier_] {
      switch($quantifier_) {
        case '?': $$ = yy.addZeroOrOne($prim_); break;
        case '+': $$ = yy.addOneOrMany($prim_); break;
        case '*': $$ = yy.addZeroOrMany($prim_); break;
        default: $$ = $prim_;
      };
    }
  ;

prim
  : '(' alternative\[alternative_] ')' {
      $$=$alternative_;
    }
  | '[' alternative\[alternative_] ']' {
      $$=yy.addZeroOrOne($alternative_);
    }
  | '{' alternative\[alternative_] '}' {
      $$=yy.addZeroOrMany($alternative_);
    }
  | '"' (QSTRING)?\[qstring_] '"' {
      $$=yy.addTerm($qstring_, '"');
    }
  | APOSTROPHE (STRING)?\[string_] APOSTROPHE {
      $$=yy.addTerm($string_, "'");
    }
  | rule_id\[rule_id_] {
      $$=yy.addNonTerm($rule_id_);
    }
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