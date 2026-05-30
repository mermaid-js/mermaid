import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import type { NeuralnetStyleOptions } from './neuralnetTypes.js';

const getStyles: DiagramStylesProvider = (options: NeuralnetStyleOptions) => `
  .neuralnet-diagram .node rect {
    stroke-width: 2px;
  }
  .neuralnet-diagram .node.input rect    { fill: ${options.nnInputFill ?? '#4A90D9'}; stroke: #2E6DA4; }
  .neuralnet-diagram .node.output rect   { fill: ${options.nnOutputFill ?? '#27AE60'}; stroke: #1E8449; }
  .neuralnet-diagram .node.dense rect    { fill: ${options.nnDenseFill ?? '#8E44AD'}; stroke: #6C3483; }
  .neuralnet-diagram .node.conv rect     { fill: ${options.nnConvFill ?? '#E67E22'}; stroke: #CA6F1E; }
  .neuralnet-diagram .node.pool rect     { fill: ${options.nnPoolFill ?? '#16A085'}; stroke: #0E6655; }
  .neuralnet-diagram .node.norm rect     { fill: ${options.nnNormFill ?? '#F39C12'}; stroke: #D68910; }
  .neuralnet-diagram .node.dropout rect  { fill: ${options.nnDropoutFill ?? '#95A5A6'}; stroke: #717D7E; stroke-dasharray: 5,3; }
  .neuralnet-diagram .node.structural rect { fill: ${options.nnStructuralFill ?? '#BDC3C7'}; stroke: #95A5A6; }
  .neuralnet-diagram .node.recurrent rect { fill: ${options.nnRecurrentFill ?? '#C0392B'}; stroke: #96281B; }
  .neuralnet-diagram .node.merge rect    { fill: ${options.nnMergeFill ?? '#1ABC9C'}; stroke: #148F77; }
  .neuralnet-diagram .node.attention rect { fill: ${options.nnAttentionFill ?? '#2980B9'}; stroke: #1F618D; }
  .neuralnet-diagram .node.activation rect { fill: ${options.nnActivationFill ?? '#D5D8DC'}; stroke: #AAB7B8; }

  .neuralnet-diagram .node text {
    font-family: ${options.fontFamily ?? 'sans-serif'};
    fill: ${options.nnTextColor ?? options.primaryTextColor ?? '#FFFFFF'};
    pointer-events: none;
  }
  .neuralnet-diagram .node text.neuralnet-main-label {
    font-size: 13px;
    font-weight: 600;
  }
  .neuralnet-diagram .node text.neuralnet-sub-label {
    font-size: 11px;
    fill: ${options.nnTextColor ?? options.primaryTextColor ?? '#FFFFFF'};
    opacity: 0.88;
  }
  .neuralnet-diagram .node.structural text,
  .neuralnet-diagram .node.activation text {
    fill: #2C3E50;
  }

  .neuralnet-diagram .edges .edge {
    fill: none;
    stroke: ${options.lineColor ?? '#555'};
    stroke-width: 1.5px;
  }
  .neuralnet-diagram .shape-label {
    font-family: ${options.fontFamily ?? 'sans-serif'};
    font-size: 10px;
    fill: ${options.primaryTextColor ?? options.lineColor ?? '#555'};
  }
  .neuralnet-diagram .neuralnet-arrow {
    fill: ${options.lineColor ?? '#555'};
  }
  .neuralnet-diagram .diagram-title {
    font-family: ${options.fontFamily ?? 'sans-serif'};
    font-size: 16px;
    font-weight: bold;
    fill: ${options.primaryTextColor ?? '#333'};
  }
`;

export default getStyles;
