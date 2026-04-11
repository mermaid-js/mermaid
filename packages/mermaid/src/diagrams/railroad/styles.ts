import type { DiagramStylesProvider } from '../../diagram-api/types.js';

export const styles: DiagramStylesProvider = (options = {}) => {
  const lineColor = options.lineColor ?? '#333';
  const textColor = options.textColor ?? '#111';
  const terminalFill = options.mainBkg ?? '#f4f4f4';
  const nonTerminalFill = options.primaryColor ?? '#e8eff8';

  return `
    /* Rail track paths (TrackBuilder output) */
    .rail-track {
      stroke: ${lineColor};
      stroke-width: 2;
      fill: none;
    }

    /* Start / end terminal circles */
    .start-terminal,
    .end-terminal {
      fill: ${lineColor};
    }

    /* Text boxes */
    .textbox {
      stroke: ${lineColor};
      stroke-width: 1.5;
    }

    .textbox.terminal {
      fill: ${terminalFill};
    }

    .textbox.nonterminal {
      fill: ${nonTerminalFill};
      stroke-dasharray: 5 3;
    }

    .textbox-text {
      fill: ${textColor};
      font-weight: 500;
    }

    .textbox-text.nonterminal {
      text-decoration: underline;
    }

    /* Rule name label */
    .rule-name {
      fill: ${textColor};
      font-size: 12px;
      font-weight: bold;
    }
  `;
};

export default styles;
