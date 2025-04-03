import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'timeline';

const detector: DiagramDetector = (txt) => {
  return /^\s*timeline/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./timeline-definition.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'Timeline Diagram',
  description: 'Visualize events and milestones in chronological order',
  examples: [
    {
      code: `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter`,
      title: 'Project Timeline',
    },
  ],
};

export default plugin;
