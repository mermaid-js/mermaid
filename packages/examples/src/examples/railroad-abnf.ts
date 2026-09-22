import type { DiagramMetadata } from '../types.js';

export default {
  id: 'railroadAbnf',
  name: 'Railroad Diagram (ABNF)',
  description: 'Visualize grammar rules using RFC 5234 ABNF notation',
  examples: [
    {
      title: 'Email Address',
      isDefault: true,
      code: `railroad-abnf-beta
    title Email Address

    address = local-part "@" domain ;
    local-part = 1*( ALPHA / DIGIT / "." / "-" ) ;
    domain = label *( "." label ) ;
    label = 1*( ALPHA / DIGIT / "-" ) ;`,
    },
    {
      title: 'Phone Number',
      code: `railroad-abnf-beta
    title Phone Number

    phone = [ "+" country-code ] subscriber ;
    country-code = 1*DIGIT ;
    subscriber = 1*( DIGIT / "-" / " " ) ;`,
    },
  ],
} satisfies DiagramMetadata;
