import type { SVG } from '../diagram-api/types.js';
import type { InternalHelpers } from '../internals.js';
import { internalHelpers } from '../internals.js';
import { log } from '../logger.js';
import type { LayoutData } from './types.js';

// console.log('MUST be removed, this only for keeping dev server working');
// import tmp from './layout-algorithms/dagre/index.js';

export interface RenderOptions {
  algorithm?: string;
}

export interface LayoutAlgorithm {
  render(
    layoutData: LayoutData,
    svg: SVG,
    helpers: InternalHelpers,
    options?: RenderOptions
  ): Promise<void>;
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
    ...(injected.includeLargeFeatures
      ? [
          {
            name: 'cose-bilkent',
            loader: async () => await import('./layout-algorithms/cose-bilkent/index.js'),
          },
        ]
      : []),
  ]);
};

registerDefaultLayoutLoaders();

export const render = async (data4Layout: LayoutData, svg: SVG) => {
  if (!(data4Layout.layoutAlgorithm in layoutAlgorithms)) {
    throw new Error(`Unknown layout algorithm: ${data4Layout.layoutAlgorithm}`);
  }

  const layoutDefinition = layoutAlgorithms[data4Layout.layoutAlgorithm];
  const layoutRenderer = await layoutDefinition.loader();

  const { theme, themeVariables } = data4Layout.config;
  const { useGradient, gradientStart, gradientStop } = themeVariables;

  svg
    .append('defs')
    .append('filter')
    .attr('id', 'drop-shadow')
    .attr('height', '130%')
    .attr('width', '130%')
    .append('feDropShadow')
    .attr('dx', '4')
    .attr('dy', '4')
    .attr('stdDeviation', 0)
    .attr('flood-opacity', '0.06')
    .attr('flood-color', `${theme?.includes('dark') ? '#FFFFFF' : '#000000'}`);

  svg
    .append('defs')
    .append('filter')
    .attr('id', 'drop-shadow-small')
    .attr('height', '150%')
    .attr('width', '150%')
    .append('feDropShadow')
    .attr('dx', '2')
    .attr('dy', '2')
    .attr('stdDeviation', 0)
    .attr('flood-opacity', '0.06')
    .attr('flood-color', `${theme?.includes('dark') ? '#FFFFFF' : '#000000'}`);

  if (useGradient) {
    const gradient = svg
      .append('linearGradient')
      .attr('id', svg.attr('id') + '-gradient')
      .attr('gradientUnits', 'objectBoundingBox')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

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

  return layoutRenderer.render(data4Layout, svg, internalHelpers, {
    algorithm: layoutDefinition.algorithm,
  });
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
