import type { SVG } from '../diagram-api/types.js';
import type { InternalHelpers } from '../internals.js';
import { internalHelpers } from '../internals.js';
import { log } from '../logger.js';
import type { LayoutData } from './types.js';
import { ELK_ALGORITHMS } from './layout-algorithms/elk/algorithms.js';

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

// Prototype-less: `layout` is settable from frontmatter, and on a plain object a value of
// `__proto__` or `toString` would pass a membership test and reach `loader()` as a TypeError.
const layoutAlgorithms: Record<string, LayoutLoaderDefinition> = Object.create(null);

export const registerLayoutLoaders = (loaders: LayoutLoaderDefinition[]) => {
  for (const loader of loaders) {
    layoutAlgorithms[loader.name] = loader;
  }
};

/**
 * Look up a registered layout by name.
 *
 * @internal Not part of the public API; it exists so the registration of the
 * built-in layouts can be asserted on directly.
 */
export const getLayoutLoaderDefinition = (name: string): LayoutLoaderDefinition => {
  const definition = layoutAlgorithms[name];
  if (!definition) {
    throw new Error(`Unknown layout algorithm: ${name}`);
  }
  return definition;
};

/**
 * Every ELK entry shares one loader, so all of them resolve to the same lazily
 * imported chunk and elkjs is fetched at most once.
 *
 * The loader is declared here rather than imported from the ELK plugin entry so
 * that the tiny build, which compiles this branch away, does not retain a
 * dynamic import of elkjs.
 */
const elkLayoutLoaders = (): LayoutLoaderDefinition[] => {
  const loader = async () => await import('./layout-algorithms/elk/index.js');
  return [
    { name: 'elk', loader, algorithm: 'elk.layered' },
    ...ELK_ALGORITHMS.map((algorithm) => ({ name: algorithm, loader, algorithm })),
  ];
};

// TODO: Should we load dagre without lazy loading?
const registerDefaultLayoutLoaders = () => {
  registerLayoutLoaders([
    {
      name: 'dagre',
      loader: async () => await import('./layout-algorithms/dagre/index.js'),
    },
    {
      name: 'swimlane',
      loader: async () => await import('./layout-algorithms/swimlanes/index.js'),
    },
    // elkjs is ~1.6 MB of source, so it is excluded from the tiny build along
    // with the other large features. `getRegisteredLayoutAlgorithm` then falls
    // back to dagre for diagrams that ask for an ELK layout there.
    ...(injected.includeLargeFeatures
      ? [
          {
            name: 'cose-bilkent',
            loader: async () => await import('./layout-algorithms/cose-bilkent/index.js'),
          },
          ...elkLayoutLoaders(),
        ]
      : []),
  ]);
};

registerDefaultLayoutLoaders();

export const render = async (data4Layout: LayoutData, svg: SVG) => {
  if (!Object.hasOwn(layoutAlgorithms, data4Layout.layoutAlgorithm)) {
    throw new Error(`Unknown layout algorithm: ${data4Layout.layoutAlgorithm}`);
  }

  // Prefix all node domIds with the diagram's SVG element ID to ensure uniqueness
  // across multiple diagrams on the same page.
  if (data4Layout.diagramId) {
    for (const node of data4Layout.nodes) {
      const originalDomId = node.domId || node.id;
      node.domId = `${data4Layout.diagramId}-${originalDomId}`;
    }
  }

  const layoutDefinition = layoutAlgorithms[data4Layout.layoutAlgorithm];
  const layoutRenderer = await layoutDefinition.loader();

  const { theme, themeVariables } = data4Layout.config;
  const { useGradient, gradientStart, gradientStop } = themeVariables;

  const svgId = svg.attr('id');

  svg
    .append('defs')
    .append('filter')
    .attr('id', `${svgId}-drop-shadow`)
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
    .attr('id', `${svgId}-drop-shadow-small`)
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

/** Always registered, so the fallback chain can always end. */
const LAST_RESORT_LAYOUT = 'dagre';

/**
 * Get the registered layout algorithm, falling back when it is not available -- `elk` ships
 * as a separate package and `cose-bilkent` only in large-feature builds, so a diagram type
 * may name either as its default. `fallback` may itself be absent, so `dagre` closes the chain.
 */
export const getRegisteredLayoutAlgorithm = (
  algorithm = '',
  { fallback = LAST_RESORT_LAYOUT } = {}
) => {
  if (Object.hasOwn(layoutAlgorithms, algorithm)) {
    return algorithm;
  }
  for (const candidate of [fallback, LAST_RESORT_LAYOUT]) {
    if (Object.hasOwn(layoutAlgorithms, candidate)) {
      log.warn(`Layout algorithm ${algorithm} is not registered. Using ${candidate} as fallback.`);
      return candidate;
    }
  }
  throw new Error(
    `Neither layout algorithm ${algorithm}, ${fallback}, nor ${LAST_RESORT_LAYOUT} is registered.`
  );
};
