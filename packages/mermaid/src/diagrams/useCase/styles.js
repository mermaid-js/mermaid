const getStyles = (options) =>
  `
  .usecase-diagram {
    font-family: ${options.fontFamily};
    font-size: ${options.fontSize};
  }

  /* Actor styles */
  .usecase-actor-man {
    stroke: ${options.actorBorder};
    fill: ${options.actorBkg};
    stroke-width: 2px;
  }

  .usecase-actor-man circle {
    fill: ${options.useCaseActorBkg};
    stroke: ${options.useCaseActorBorder};
    stroke-width: 2px;
  }

  .usecase-actor-man line {
    stroke: ${options.useCaseActorBorder};
    stroke-width: 2px;
    stroke-linecap: round;
  }

  .usecase-actor-man text {
    font-family: ${options.fontFamily};
    font-size: 14px;
    font-weight: normal;
    fill: ${options.useCaseActorTextColor};
    text-anchor: middle;
    dominant-baseline: central;
  }

  /* Use case styles */
  .usecase-usecase {
    fill: ${options.useCaseUseCaseBkg};
    stroke: ${options.useCaseUseCaseBorder};
    stroke-width: 1px;
  }

  .usecase-usecase text {
    font-family: ${options.fontFamily};
    font-size: 12px;
    fill: ${options.useCaseUseCaseTextColor};
    text-anchor: middle;
    dominant-baseline: central;
  }

  /* System boundary styles */
  .usecase-system-boundary {
    fill: ${options.useCaseSystemBoundaryBkg};
    stroke: ${options.useCaseSystemBoundaryBorder};
    stroke-width: 2px;
    stroke-dasharray: 5,5;
  }

  .usecase-system-boundary text {
    font-family: ${options.fontFamily};
    font-size: 14px;
    font-weight: bold;
    fill: ${options.useCaseSystemBoundaryTextColor};
    text-anchor: middle;
    dominant-baseline: central;
  }

  /* Arrow and relationship styles */
  .usecase-arrow {
    stroke: ${'red'};
    stroke-width: 2px;
    fill: none;
  }

  .usecase-arrow-label {
    font-family: ${options.fontFamily};
    font-size: 12px;
    fill: ${options.useCaseArrowTextColor};
    text-anchor: middle;
    dominant-baseline: central;
  }

  /* Node styles for standalone nodes */
  .usecase-node {
    fill: ${options.useCaseUseCaseBkg};
    stroke: ${options.useCaseUseCaseBorder};
    stroke-width: 1px;
  }

  .usecase-node text {
    font-family: ${options.fontFamily};
    font-size: 12px;
    fill: ${options.useCaseUseCaseTextColor};
    text-anchor: middle;
    dominant-baseline: central;
  }

  /* Hover effects */
  .usecase-actor-man:hover circle {
    fill: ${options.useCaseActorBkg};
    stroke: ${options.useCaseArrowColor};
  }

  .usecase-actor-man:hover line {
    stroke: ${options.useCaseArrowColor};
  }

  .usecase-actor-man:hover text {
    fill: ${options.useCaseArrowColor};
    font-weight: bold;
  }

  .usecase-usecase:hover {
    fill: ${options.useCaseSystemBoundaryBkg};
    stroke: ${options.useCaseArrowColor};
  }

  .usecase-usecase:hover text {
    fill: ${options.useCaseArrowColor};
    font-weight: bold;
  }
`;

export default getStyles;
