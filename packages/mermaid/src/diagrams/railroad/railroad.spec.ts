// @ts-ignore: jison doesn't export types
import railroad from './railroadGrammar.jison';
// import { prepareTextForParsing } from '../railroadUtils.js';
import { cleanupComments } from '../../diagram-api/comments.js';
import { db, Rule } from './railroadDB.js';
// @ts-ignore: yaml does not export types
import defaultConfigJson from '../../schemas/config.schema.yaml?only-defaults=true';

describe('Railroad diagram', function () {
  beforeAll(() => {
    console.log(defaultConfigJson);

    railroad.yy = db;
  });

  afterEach(() => {
    railroad.yy.clear();
  });

  describe('fails to parse', () => {
    test.each([
      ['', 'keyword is missing'],
      ['rule', 'assign operator is missing'],
      ['rule==id', 'assign operator is wrong'],
      ['rule=id', 'semicolon is missing'],
      ['rule=(id;', 'parentheses are unbalanced'],
      ['rule=(id));', 'parentheses are unbalanced'],
      ["' ::= x;", 'rule is with quote is not wrapped in <>'],
      ["rule ::= ';", 'quote in rule definition is not wrapped in <>'],
    ])('`%s` where %s', (grammar: string) => {
      grammar = cleanupComments('' + grammar);
      expect(() => railroad.parser.parse(grammar)).toThrow();
    });
  });

  describe('parses', () => {
    describe('assignment operators', () => {
      // const grammarDefinition = prepareTextForParsing(cleanupComments('railroad-beta\n\n ' + data));
      test.each([
        ['rule ::= id;'],
        ['rule := id;'],
        ['rule : id;'],
        ['rule => id;'],
        ['rule = id;'],
        ['rule -> id;'],
      ])('`%s`', (grammar: string) => {
        grammar = cleanupComments('railroad-beta' + grammar);
        const grammarWithoutSpaces = grammar.replaceAll(' ', '');
        expect(() => railroad.parser.parse(grammar)).not.toThrow();
        expect(() => railroad.parser.parse(grammarWithoutSpaces)).not.toThrow();
      });
    });
    
    describe('rules names', () => {
      // const grammarDefinition = prepareTextForParsing(cleanupComments('railroad-beta\n\n ' + data));
      test.each([
        ['rule::=id;'],
        ['<rule>::=id ;'],
        ['<rule with spaces>::=id;'],
        [`<rule with "double quotes">::=id;`],
        [`<rule with 'singe quotes'>::=id;`],
        [`<rule with \\<angle quotes\\>>::=id;`],
        [`<rule with different escapements \\' \\" \\< \\> \\\\ \\x>::=id;`],
      ])('`%s` produces', (grammar: string) => {
        grammar = cleanupComments('railroad-beta' + grammar);
        railroad.parser.parse(grammar);
        const x = railroad.yy.getRules() as Rule[];
        console.log(x.map((r) => r.toEBNF()));
        // expect(() => { railroad.parser.parse(grammar); }).not.toThrow();
        // railroad.parser.parse(grammar);
      });
    });

    describe('simple samples', () => {
      // const grammarDefinition = prepareTextForParsing(cleanupComments('railroad-beta\n\n ' + data));
      test.each([
        [''],
        ['rule::=id;'],
        ['rule::=(id);'],
        ['rule::=id-id;'],
        ['rule::=[id];'],
        ['rule::={id};'],
        ['rule::=id|id;'],
        ['rule::=(id|id);'],
        ['rule::=[id|id];'],
        ['rule::={id|id};'],
        ['rule = "\'term term\'";'],
        ['rule = \'"term term"\';'],
        ['rule = "";'],
        ['list = element list | ;'],
        ['list = element, list | ;'],
        ['expression = term { "a" term } .'],
        ["<while> ::= 'while';"],
        ["<'> ::= <'>;"],
        ['<"> ::= <"">;'],
        ["<while> ::= 'while' '(' <condition> ')' <statement>;"],
        ["<while-loop> ::= 'while' '(' <condition> ')' <statement>;"],
      ])('`%s` produces', (grammar: string) => {
        grammar = cleanupComments('railroad-beta' + grammar);
        railroad.parser.parse(grammar);
        const x = railroad.yy.getRules() as Rule[];
        console.log(x.map((r) => r.toEBNF()));
        // expect(() => { railroad.parser.parse(grammar); }).not.toThrow();
        // railroad.parser.parse(grammar);
      });
    });

    describe('compresses AST properly', () => {
      test.each([
        ['sample = ;'],
        ['sample = "one";'],
        ['sample = "one"|"two";'],
        ['sample = "one"|"two"|;'],
        ['sample = ("one");'],
        ['sample = (("one"));'],
        ['sample = ("one")|("two");'],
        ['sample = ("one"|"two")|("three"|"four");'],
        ['sample = (("one"|"two")|("three"|"four"))|;'],
        ['sample = "one"|("two"|"three")|"four","five";'],
        ['sample = "one",("two"|"three"),"four";'],
        ['sample = "one",("two","three");'],
      ])('%s', (grammar: string) => {
        grammar = cleanupComments('railroad-beta' + grammar);
        // expect(() => railroad.parser.parse(grammar)).not.toThrow();
        railroad.parser.parse(grammar);
      });
    });
  });

  describe('recognizes', function () {
    it('Arithmetic Expressions', () => {
      const grammar = `
      railroad-beta
      calc       = expr calc | ;
      expression = term  { ('+' | "-") term } .
      term       = factor ( ("*"|"/"|"%") factor )* .
      factor     = constant | variable | "("  expression  ")" .
      variable   = "x" | (("y" | "z")) .
      constant   = digit+ .
      digit      = "0" | "1" | "2" | "3" | "4" | "5" | "..." | "9" .
      `;
      // expect(() => railroad.parser.parse(grammar)).not.toThrow();
      railroad.parser.parse(grammar);
    });

    it('BNF', () => {
      const grammar = `
      railroad-beta

      syntax         = rule [ syntax ] .
      rule           = opt_ws  identifier opt_ws "::=" opt_ws expression opt_ws EOL .
      expression     = list [ "|" expression ] .
      line_end       = opt_ws EOL | line_end line_end .
      list           = term [ WHITESPACE list ] .
      term           = literal | identifier .
      identifier     = "<" character {character} ">" .
      literal        = "'" {character} "'" | '"'  {character} '"' .
      opt_ws         = { WHITESPACE } .
      character      = lowercase_char | uppercase_char | digit | special_char .
      lowercase_char = "a" | "b" | "..." | "z" .
      uppercase_char = "A" | "B" | "..." | "Z" .
      digit          = "0" | "1" | "..." | "2" .
      special_char   = "-" | "_" .
      `;

      // expect(() => railroad.parser.parse(grammar)).not.toThrow();
      railroad.parser.parse(grammar);
    });

    it('Itself', () => {
      const grammar = `
      railroad-beta

      syntax: 'railroad-beta' rule* EOF;

      rule: IDENTIFIER '=' list ';';

      list
        : definition ("|" definition)*
        | ''
        ;

      definition : (prim ","?)+;

      prim
        : '(' list ')' QUANTIFIER?
        | '[' list ']'
        | '{' list '}'
        | '"' (QUOTED_STRING)? '"' (QUANTIFIER)?
        | APOSTROPHE (STRING)? APOSTROPHE (QUANTIFIER)?
        | IDENTIFIER (QUANTIFIER)? {}
        ;

      `;
      railroad.parser.parse(grammar);
    });

    it('Shell', () => {
      const grammar = `
      railroad-beta

      commandline ::= list
      |  list ";"
      |  list "&"
      ;

      list     ::=  conditional
      |   list ";" conditional
      |   list "&" conditional
      ;

      conditional ::=  pipeline
      |   conditional "&&" pipeline
      |   conditional "||" pipeline
      ;

      pipeline ::=  command
      |   pipeline "|" command
      ;

      command  ::=  word
      |   redirection
      |   command word
      |   command redirection
      ;

      redirection  ::=  redirectionop filename;
      redirectionop  ::=  "<"  |  ">"  |  "2>";
      `;

      railroad.parser.parse(grammar);
    });

    it('BNF syntax with angle brackets around <definitions>', () => {
      const grammar = `
      railroad-beta

      <while loop> ::= while '(' <condition> ')' <statement>;

      <assignment statement> ::= <variable> '=' <expression>;

      <statement list> ::= <statement> | <statement list> <statement>;

      <unsigned integer> ::= <digit> | <unsigned integer><digit>;

      <expression> ::= <expression> '+' <term>
      | <expression> '-' <term>
      | <term>
      ;

      <term> ::= <term> '*' <factor>
      | <term> '/' <factor>
      | <factor>
      ;

      <factor> ::= <primary> '^' <factor> | <primary>;

      <primary> ::= <primary> | <element>;

      <element> ::= '(' <expression> ')'
      | <variable>
      | <number>
      ;
      `;

      railroad.parser.parse(grammar);
    });
  });
});
