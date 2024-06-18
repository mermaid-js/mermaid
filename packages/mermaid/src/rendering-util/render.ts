export interface LayoutAlgorithm {
  render(data4Layout: any, svg: any, element: any, algorithm?: string, positions: any): any;
}

export type LayoutLoader = () => Promise<LayoutAlgorithm>;
export interface LayoutLoaderDefinition {
  name: string;
  loader: LayoutLoader;
  algorithm?: string;
}

const layoutAlgorithms: Record<string, LayoutLoaderDefinition> = {};

export const registerLayoutLoaders = (loaders: LayoutLoaderDefinition[]) => {
  for (const loader of loaders) {
    layoutAlgorithms[loader.name] = loader;
  }
};

// TODO: Should we load dagre without lazy loading?
const registerDefaultLayoutLoaders = () => {
  registerLayoutLoaders([
    {
      name: 'dagre',
      loader: async () => await import('./layout-algorithms/dagre/index.js'),
    },
    {
      name: 'fixed',
      loader: async () => await import('./layout-algorithms/fixed/index.js'),
    },
    // {
    //   name: 'elk',
    //   loader: async () => await import('../../../mermaid-layout-elk/src/render.js'),
    // },
  ]);
};

registerDefaultLayoutLoaders();

export const render = async (data4Layout: any, svg: any, element: any, positions?: any) => {
  if (!(data4Layout.layoutAlgorithm in layoutAlgorithms)) {
    throw new Error(`Unknown layout algorithm: ${data4Layout.layoutAlgorithm}`);
  }

  const layoutDefinition = layoutAlgorithms[data4Layout.layoutAlgorithm];
  const layoutRenderer = await layoutDefinition.loader();

  const { useGradient, gradientStart, gradientStop } = data4Layout.config.themeVariables;

  if (useGradient) {
    const gradient = svg.append('linearGradient');

    gradient
      .attr('id', 'gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('spreadMethod', 'pad');

    gradient
      .append('svg:stop')
      .attr('offset', '0%')
      .attr('stop-color', gradientStart)
      .attr('stop-opacity', 1);

    gradient
      .append('svg:stop')
      .attr('offset', '100%')
      .attr('stop-color', gradientStop)
      .attr('stop-opacity', 1);
  }
  return layoutRenderer.render(data4Layout, svg, element, layoutDefinition.algorithm, positions);
};
