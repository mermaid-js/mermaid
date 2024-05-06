export const render = async (data4Layout, svg, element) => {
  switch (data4Layout.layoutAlgorithm) {
    case 'dagre': {
      const layoutRenderer = await import('./layout-algorithms/dagre/index.js');
      return layoutRenderer.render(data4Layout, svg, element);
    }
    case 'elk': {
      const layoutRenderer = await import('./layout-algorithms/elk/index.js');
      return layoutRenderer.render(data4Layout, svg, element);
    }
  }
};
