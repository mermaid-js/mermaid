import type { DiagramMetadata } from '../types.js';

export default {
  id: 'railroad',
  name: 'Railroad Diagram',
  description: 'Visualize grammar and parser rules as railroad tracks',
  examples: [
    {
      title: 'simplified arithmetic expression: factor rule with optional repeat of sign and term',
      isDefault: true,
      code: `railroad-beta
        factor := sequence(
          textBox("term", "nonterminal"),
          bypass(sequence(
            stack(
              textBox("+", "terminal"),
              textBox("-", "terminal")
            ),
            textBox("expression", "nonterminal")
          ))
        )
      `,
    },
  ],
} satisfies DiagramMetadata;
