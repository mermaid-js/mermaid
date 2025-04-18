import 'mermaid-language'

// Define any mindmap-specific reference resolution rules here
// This file can stay minimal for now

// Alphanumerics with underscores, dashes, slashes, and dots
// Must start with an alphanumeric or an underscore
// Cant end with a dash, slash, or dot
terminal REFERENCE returns string: /\w([-\./\w]*[-\w])?/;

// Common terminals for reference
terminal BOOLEAN returns boolean: 'true' | 'false';
terminal STRING returns string: /"[^"]*"|'[^']*'/;
terminal ID returns string: /[\w]([-\w]*\w)?/;
terminal INT returns number: /0|[1-9][0-9]*(?!\.)/;
terminal FLOAT returns number: /[0-9]+\.[0-9]+(?!\.)/;
terminal NUMBER returns number: FLOAT | INT;

// Accessibility attributes
terminal ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\\s*{([^}]*)})/ ;
terminal TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;
