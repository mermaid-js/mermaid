import type { DiagramMetadata } from '../types.js';

export default {
  id: 'railroadPeg',
  name: 'Railroad Diagram (PEG)',
  description: 'Visualize grammar rules using Parsing Expression Grammar notation',
  examples: [
    {
      title: 'Calculator Grammar',
      isDefault: true,
      code: `railroad-peg
    title Calculator Grammar

    Expression <- Term (("+" / "-") Term)* ;
    Term <- Factor (("*" / "/") Factor)* ;
    Factor <- Number / "(" Expression ")" ;
    Number <- Digit+ ;
    Digit <- "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" ;`,
    },
  ],
} satisfies DiagramMetadata;
