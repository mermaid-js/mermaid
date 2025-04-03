import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'xychart';

const detector: DiagramDetector = (txt) => {
  return /^\s*xychart-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./xychartDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
  title: 'XY Chart',
  description: 'Create scatter plots and line charts with customizable axes',
  examples: [
    {
      isDefault: true,
      code: `xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]`,
      title: 'Sales Revenue',
    },
  ],
};

export default plugin;
