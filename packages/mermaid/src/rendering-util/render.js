export const render = async (data4Layout, svg, element) => {
  if (data4Layout.layoutAlgorithm === 'dagre-wrapper') {
    const layoutRenderer = await import('../dagre-wrapper/index-refactored.js');

    return layoutRenderer.render(data4Layout, svg, element);
  }
};
