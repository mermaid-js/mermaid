import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import type { TimingStyleOptions } from './types.js';

export const styles: DiagramStylesProvider = (options: TimingStyleOptions = {}) => {
  const lineColor = options.lineColor ?? '#333';
  const textColor = options.textColor ?? '#333';
  const titleColor = options.titleColor ?? textColor;
  const primaryColor = options.primaryColor ?? '#ececff';
  const primaryTextColor = options.primaryTextColor ?? textColor;
  const primaryBorderColor = options.primaryBorderColor ?? lineColor;
  const secondaryColor = options.secondaryColor ?? '#ffffde';
  const tertiaryColor = options.tertiaryColor ?? '#fff4dd';

  return `
  .timing-root {
    font-family: ${options.fontFamily ?? 'sans-serif'};
  }
  .timing-title {
    fill: ${titleColor};
    font-size: 18px;
    font-weight: 600;
  }
  .timing-axis-label, .timing-tick-label, .timing-signal-label, .timing-signal-meta {
    fill: ${textColor};
  }
  .timing-axis-label, .timing-tick-label, .timing-signal-meta {
    font-size: 11px;
  }
  .timing-signal-label {
    font-size: 13px;
    font-weight: 600;
  }
  .timing-signal-meta {
    opacity: 0.7;
  }
  .timing-grid-line, .timing-lane-separator {
    stroke: ${lineColor};
    stroke-width: 1;
    opacity: 0.2;
  }
  .timing-lane-background.even {
    fill: ${primaryColor};
    opacity: 0.12;
  }
  .timing-lane-background.odd {
    fill: transparent;
  }
  .timing-wave, .timing-transition {
    fill: none;
    stroke: ${lineColor};
    stroke-width: 2;
    stroke-linecap: square;
    stroke-linejoin: round;
  }
  .timing-wave.unknown, .timing-wave.high-impedance {
    stroke-dasharray: 4 3;
  }
  .timing-bus-segment, .timing-state-segment {
    stroke: ${primaryBorderColor};
    stroke-width: 1.5;
  }
  .timing-bus-segment {
    fill: ${primaryColor};
  }
  .timing-state-segment {
    fill: ${secondaryColor};
  }
  .timing-bus-segment.unknown, .timing-state-segment.unknown,
  .timing-bus-segment.high-impedance, .timing-state-segment.high-impedance {
    fill: ${tertiaryColor};
    stroke-dasharray: 4 3;
  }
  .timing-bus-label, .timing-state-label {
    fill: ${primaryTextColor};
    font-size: 11px;
    pointer-events: none;
  }
  .timing-analog-point {
    fill: ${lineColor};
    stroke: none;
  }
  `;
};

export default styles;
