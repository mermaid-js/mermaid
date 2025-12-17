import type { DiagramMetadata } from '../types.js';

export default {
  id: 'railroad',
  name: 'Railroad Diagram',
  description: 'Visualize grammar rules and syntax using railroad diagrams (also known as syntax diagrams)',
  examples: [
    {
      title: 'Basic Grammar Rules',
      isDefault: true,
      code: `railroad-diagram
    title Simple Expression Grammar

    expression = term ( "+" term )* ;
    term = factor ( "*" factor )* ;
    factor = number | "(" expression ")" ;
    number = digit+ ;
    digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;`,
    },
    {
      title: 'JSON Grammar',
      code: `railroad-diagram
    title JSON Grammar

    json = element ;
    element = object | array | string | number | "true" | "false" | "null" ;
    object = "{" [ member ( "," member )* ] "}" ;
    array = "[" [ element ( "," element )* ] "]" ;
    member = string ":" element ;`,
    },
    {
      title: 'Identifier Definition',
      code: `railroad-diagram
    title Identifier

    identifier = letter ( letter | digit | "_" )* ;
    letter = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" ;
    digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;`,
    },
  ],
} satisfies DiagramMetadata;
