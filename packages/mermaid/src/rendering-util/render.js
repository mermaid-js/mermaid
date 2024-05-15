export const render = async (data4Layout, svg, element) => {
  switch (data4Layout.layoutAlgorithm) {
    case 'dagre': {
      const layoutRenderer = await import('./layout-algorithms/dagre/index.js');
      return layoutRenderer.render(data4Layout, svg, element);
    }
    case 'elk': {
      // TODO: Should fix this import path
      const layoutRenderer = await import('../../../mermaid-layout-elk/src/index.js');
      return layoutRenderer.render(data4Layout, svg, element);
    }
  }
};
