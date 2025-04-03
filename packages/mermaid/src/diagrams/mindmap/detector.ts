import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';
const id = 'mindmap';

const detector: DiagramDetector = (txt) => {
  return /^\s*mindmap/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./mindmap-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Mindmap',
  description: 'Visualize ideas and concepts in a tree-like structure',
  examples: [
    {
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
  ],
};

export default plugin;

// cspell:ignore Buzan
