const getStyles = (options) =>
  `.label {
    font-family: ${options.fontFamily};
  }

  .node-labels {
    font-family: ${options.fontFamily};
  }

  /* Outlined label style - background stroke for better readability */
  .sankey-label-bg {
    stroke: rgba(255, 255, 255, 0.9);
    stroke-width: 4px;
    stroke-linejoin: round;
    paint-order: stroke;
  }

  /* Foreground label text */
  .sankey-label-fg {
    fill: ${options.textColor || '#1d1d1f'};
  }

  /* Node styling */
  .node rect {
    shape-rendering: crispEdges;
  }

  /* Link styling */
  .link {
    fill: none;
    stroke-opacity: 0.5;
    mix-blend-mode: multiply;
  }
`;

export default getStyles;
