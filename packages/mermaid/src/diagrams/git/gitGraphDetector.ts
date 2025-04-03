import type { DiagramDetector, DiagramLoader } from '../../diagram-api/types.js';
import type { ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'gitGraph';

const detector: DiagramDetector = (txt) => {
  return /^\s*gitGraph/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./gitGraphDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Git Graph',
  description: 'Visualize Git repository history and branch relationships',
  examples: [
    {
      code: `gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature`,
      title: 'Basic Git Flow',
    },
  ],
};

export default plugin;
