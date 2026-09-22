import type { DiagramMetadata } from '../types.js';

export default {
  id: 'mindmap',
  name: 'Mindmap',
  description: 'Visualize ideas and concepts in a tree-like structure',
  examples: [
    {
      title: 'Basic Mindmap',
      isDefault: true,
      code: `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`,
    },
    {
      title: 'Trip Planning with Shapes and Icons',
      code: `mindmap
  root((Summer Trip))
    Destination
      Beach town
      Mountain village
    Budget
      ::icon(fa fa-wallet)
      Flights
      Hotel
      Food and activities
    Packing
      Documents
        Passport
        Travel insurance
      reminder{{Sunscreen!}}
    Activities
      ::icon(fa fa-person-hiking)
      Hiking
      Snorkeling
      Local food tour`,
    },
  ],
} satisfies DiagramMetadata;

// cspell:ignore Buzan
