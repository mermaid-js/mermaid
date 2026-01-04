const getStyles = (options: any) => `
  /* Main container */
  .ishikawa-container {
    fill: none;
  }
  
  /* Problem statement (root node) */
  .ishikawa-problem {
    fill: ${options.primaryColor || '#ff6b6b'};
    stroke: ${options.primaryBorderColor || '#c92a2a'};
    stroke-width: 2px;
  }
  
  /* Category nodes (main branches) */
  .ishikawa-category {
    fill: ${options.secondaryColor || '#4ecdc4'};
    stroke: ${options.secondaryBorderColor || '#20c997'};
    stroke-width: 2px;
  }
  
  /* Cause nodes (sub-branches) */
  .ishikawa-cause {
    fill: ${options.tertiaryColor || '#ffe66d'};
    stroke: ${options.tertiaryBorderColor || '#fcc419'};
    stroke-width: 1px;
  }
  
  /* Root cause nodes (deepest level) */
  .ishikawa-root-cause {
    fill: ${options.quaternaryColor || '#ff8e8e'};
    stroke: ${options.quaternaryBorderColor || '#ff6b6b'};
    stroke-width: 2px;
  }
  
  /* Fishbone spine */
  .ishikawa-spine {
    stroke: ${options.lineColor || '#495057'};
    stroke-width: 3px;
    stroke-dasharray: none;
  }
  
  /* Category branches */
  .ishikawa-category-branch {
    stroke: ${options.lineColor || '#495057'};
    stroke-width: 2px;
    stroke-dasharray: none;
  }
  
  /* Cause branches */
  .ishikawa-cause-branch {
    stroke: ${options.secondaryTextColor || '#868e96'};
    stroke-width: 1px;
    stroke-dasharray: none;
  }
  
  /* Text styling */
  .ishikawa-text {
    font-family: ${options.fontFamily || 'Arial, sans-serif'};
    font-size: 14px;
    fill: ${options.textColor || '#212529'};
  }
  
  .ishikawa-problem-text {
    font-weight: bold;
    font-size: 16px;
    fill: ${options.primaryTextColor || '#ffffff'};
  }
  
  .ishikawa-category-text {
    font-weight: bold;
    font-size: 14px;
    fill: ${options.secondaryTextColor || '#ffffff'};
  }
  
  .ishikawa-cause-text {
    font-size: 12px;
    fill: ${options.textColor || '#495057'};
  }
  
  /* Node shapes */
  .ishikawa-node rect {
    fill: ${options.mainBkg || '#f8f9fa'};
    stroke: ${options.nodeBorder || '#dee2e6'};
    stroke-width: 1px;
  }
  
  .ishikawa-node circle {
    fill: ${options.mainBkg || '#f8f9fa'};
    stroke: ${options.nodeBorder || '#dee2e6'};
    stroke-width: 1px;
  }
  
  .ishikawa-node ellipse {
    fill: ${options.mainBkg || '#f8f9fa'};
    stroke: ${options.nodeBorder || '#dee2e6'};
    stroke-width: 1px;
  }
  
  .ishikawa-node polygon {
    fill: ${options.mainBkg || '#f8f9fa'};
    stroke: ${options.nodeBorder || '#dee2e6'};
    stroke-width: 1px;
  }
  
  /* Section-specific styling */
  .section-0 {
    fill: ${options.primaryColor || '#ff6b6b'};
    stroke: ${options.primaryBorderColor || '#c92a2a'};
  }
  
  .section-1 {
    fill: ${options.secondaryColor || '#4ecdc4'};
    stroke: ${options.secondaryBorderColor || '#20c997'};
  }
  
  .section-2 {
    fill: ${options.tertiaryColor || '#ffe66d'};
    stroke: ${options.tertiaryBorderColor || '#fcc419'};
  }
  
  .section-3 {
    fill: ${options.quaternaryColor || '#a8e6cf'};
    stroke: ${options.quaternaryBorderColor || '#51cf66'};
  }
  
  .section-4 {
    fill: ${options.quinaryColor || '#ffd8a8'};
    stroke: ${options.quinaryBorderColor || '#ffa94d'};
  }
  
  .section-5 {
    fill: ${options.senaryColor || '#d0ebff'};
    stroke: ${options.senaryBorderColor || '#74c0fc'};
  }
  
  .section-6 {
    fill: ${options.septenaryColor || '#f3d9fa'};
    stroke: ${options.septenaryBorderColor || '#da77f2'};
  }
  
  .section-7 {
    fill: ${options.octonaryColor || '#ffc9c9'};
    stroke: ${options.octonaryBorderColor || '#ff8787'};
  }
  
  /* Hover effects */
  .ishikawa-node:hover {
    opacity: 0.8;
    cursor: pointer;
  }
  
  /* Animation */
  .ishikawa-node {
    transition: opacity 0.2s ease-in-out;
  }
`;

export default getStyles;
