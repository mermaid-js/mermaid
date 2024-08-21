import { internalHelpers } from '$root/internals.js';
import { log } from '$root/logger.js';

export interface LayoutAlgorithm {
  render(
    data4Layout: any,
    svg: any,
    element: any,
    helpers: typeof internalHelpers,
    algorithm?: string
  ): any;
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
  return layoutRenderer.render(
    data4Layout,
    svg,
    element,
    internalHelpers,
    layoutDefinition.algorithm
  );
};

/**
 * Get the registered layout algorithm. If the algorithm is not registered, use the fallback algorithm.
 */
export const getRegisteredLayoutAlgorithm = (algorithm = '', { fallback = 'dagre' } = {}) => {
  if (algorithm in layoutAlgorithms) {
    return algorithm;
  }
  if (fallback in layoutAlgorithms) {
    log.warn(`Layout algorithm ${algorithm} is not registered. Using ${fallback} as fallback.`);
    return fallback;
  }
  throw new Error(`Both layout algorithms ${algorithm} and ${fallback} are not registered.`);
};
