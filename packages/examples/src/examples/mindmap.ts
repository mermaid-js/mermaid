import type { DiagramMetadata } from '../types.js';

export default {
  id: 'mindmap',
  name: 'Mindmap',
  description: 'Visualize ideas and concepts in a tree-like structure',
  examples: [
    {
      title: 'Basic Mindmap',
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
      isDefault: true,
    },
  ],
} satisfies DiagramMetadata;

// cspell:ignore Buzan
