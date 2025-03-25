// Base terminals and fragments for common language constructs
// Terminal Precedence: Lazy to Greedy
// When imported, the terminals are considered after the terminals in the importing grammar
// Note: Hence, to add a terminal greedier than the common terminals, import it separately after the common import

fragment EOL returns string:
  NEWLINE+ | EOF
;

fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) EOL)+
;

terminal BOOLEAN returns boolean: 'true' | 'false';

terminal ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;

terminal FLOAT returns number: /[0-9]+\.[0-9]+(?!\.)/;
terminal INT returns number: /0|[1-9][0-9]*(?!\.)/;
terminal NUMBER returns number: FLOAT | INT;

terminal STRING returns string: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/;

// Alphanumerics with underscores and dashes
// Must start with an alphanumeric or an underscore
// Cant end with a dash
terminal ID returns string: /[\w]([-\w]*\w)?/;

terminal NEWLINE: /\r?\n/;

hidden terminal WHITESPACE: /[\t ]+/;
hidden terminal YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;
