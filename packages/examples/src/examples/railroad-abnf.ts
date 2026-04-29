import type { DiagramMetadata } from '../types.js';

export default {
  id: 'railroadAbnf',
  name: 'Railroad Diagram (ABNF)',
  description: 'Visualize grammar rules using RFC 5234 ABNF notation',
  examples: [
    {
      title: 'URI Scheme',
      isDefault: true,
      code: `railroad-abnf
    title Email Address

    address = local-part "@" domain ;
    local-part = 1*( ALPHA / DIGIT / "." / "-" ) ;
    domain = label *( "." label ) ;
    label = 1*( ALPHA / DIGIT / "-" ) ;`,
    },
  ],
} satisfies DiagramMetadata;
