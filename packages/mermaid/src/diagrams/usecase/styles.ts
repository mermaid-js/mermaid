const getStyles = (options: any) =>
  `
  .actor {
    stroke: ${options.primaryColor};
    fill: ${options.primaryColor};
  }
  
  .actor-label {
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: 14px;
    font-weight: normal;
  }
  
  .usecase {
    stroke: ${options.primaryColor};
    fill: ${options.primaryColor};
  }
  
  .usecase-label {
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: 12px;
    font-weight: normal;
  }
  
  .relationship {
    stroke: ${options.primaryColor};
    fill: ${options.primaryColor};
  }
  
  .relationship-label {
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: 10px;
    font-weight: normal;
  }
`;

export default getStyles;
