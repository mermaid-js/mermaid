import type { DiagramMetadata } from '../types.js';

export default {
  id: 'railroadEbnf',
  name: 'Railroad Diagram (EBNF)',
  description: 'Visualize grammar rules using EBNF notation with W3C and ISO 14977 support',
  examples: [
    {
      title: 'Expression Grammar',
      isDefault: true,
      code: `railroad-ebnf-beta
    title Expression Grammar

    expression = term ( "+" term | "-" term )* ;
    term = factor ( "*" factor | "/" factor )* ;
    factor = number | "(" expression ")" ;
    number = digit+ ;
    digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;`,
    },
    {
      title: 'Semantic Version',
      code: `railroad-ebnf-beta
    title Semantic Version

    version = core ( "-" prerelease )? ( "+" build )? ;
    core = number "." number "." number ;
    prerelease = identifier ( "." identifier )* ;
    build = identifier ( "." identifier )* ;
    number = digit+ ;
    identifier = ( letter | digit )+ ;
    letter = "a" | "b" | "c" ;
    digit = "0" | "1" | "2" ;`,
    },
  ],
} satisfies DiagramMetadata;
