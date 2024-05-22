export interface LayoutAlgorithm {
  render(data4Layout: any, svg: any, element: any, algorithm?: string): any;
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
  ]);
};

registerDefaultLayoutLoaders();

export const render = async (data4Layout: any, svg: any, element: any) => {
  if (!(data4Layout.layoutAlgorithm in layoutAlgorithms)) {
    throw new Error(`Unknown layout algorithm: ${data4Layout.layoutAlgorithm}`);
  }

  const layoutDefinition = layoutAlgorithms[data4Layout.layoutAlgorithm];
  const layoutRenderer = await layoutDefinition.loader();
  return layoutRenderer.render(data4Layout, svg, element, layoutDefinition.algorithm);
};
