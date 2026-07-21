import type { DiagramStylesProvider } from '../../diagram-api/types.js';

const styles: DiagramStylesProvider = () => `
  .qc-wire {
    stroke: #333;
    stroke-width: 1.5;
    fill: none;
  }
  .qc-classical-wire {
    stroke: #333;
    stroke-width: 1.5;
    fill: none;
  }
  .qc-wire-label {
    font-family: var(--fontFamily, 'trebuchet ms', verdana, arial, sans-serif);
    font-size: 14px;
    fill: #333;
  }
  .qc-gate-box {
    stroke: #333;
    stroke-width: 1.5;
    fill: #fff;
  }
  .qc-gate-label {
    font-family: var(--fontFamily, 'trebuchet ms', verdana, arial, sans-serif);
    font-size: 14px;
    fill: #333;
    text-anchor: middle;
    dominant-baseline: central;
  }
  .qc-control {
    fill: #333;
    stroke: none;
  }
  .qc-control-zero {
    fill: #fff;
    stroke: #333;
    stroke-width: 1.5;
  }
  .qc-target {
    fill: #fff;
    stroke: #333;
    stroke-width: 1.5;
  }
  .qc-target-cross {
    stroke: #333;
    stroke-width: 1.5;
  }
  .qc-swap {
    stroke: #333;
    stroke-width: 1.5;
  }
  .qc-connector {
    stroke: #333;
    stroke-width: 1.5;
    fill: none;
  }
  .qc-barrier {
    stroke: #999;
    stroke-width: 1.5;
    stroke-dasharray: 6 4;
    fill: none;
  }
  .qc-capture-arrow {
    stroke: #333;
    stroke-width: 1.5;
    fill: none;
  }
  .qc-condition-line {
    stroke: #333;
    stroke-width: 1.5;
    stroke-dasharray: 4 3;
    fill: none;
  }
  .qc-condition-dot {
    fill: #333;
    stroke: none;
  }
`;

export default styles;
