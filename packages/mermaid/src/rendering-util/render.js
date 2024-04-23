export const render = async (data4Layout, svg, element) => {
  if (data4Layout.layoutAlgorithm === 'dagre-wrapper') {
    console.warn('THERERERERERER');
    // const layoutRenderer = await import('../dagre-wrapper/index-refactored.js');

    const layoutRenderer = await import('./layout-algorithms/dagre/index.js');

    return layoutRenderer.render(data4Layout, svg, element);
  }
};
