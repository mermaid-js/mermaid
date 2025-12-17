import type { RailroadStyleOptions } from './railroadTypes.js';

/**
 * Generate CSS styles for Railroad diagrams
 */
export const getStyles = (options?: RailroadStyleOptions): string => {
  const fontFamily = options?.fontFamily || 'monospace';
  const fontSize = options?.fontSize || 14;

  const terminalFill = options?.terminalFill || '#FFFFC0';
  const terminalStroke = options?.terminalStroke || '#000000';
  const terminalTextColor = options?.terminalTextColor || '#000000';

  const nonTerminalFill = options?.nonTerminalFill || '#FFFFFF';
  const nonTerminalStroke = options?.nonTerminalStroke || '#000000';
  const nonTerminalTextColor = options?.nonTerminalTextColor || '#000000';

  const lineColor = options?.lineColor || '#000000';
  const strokeWidth = options?.strokeWidth || 2;

  const markerFill = options?.markerFill || '#000000';

  const commentFill = options?.commentFill || '#E8E8E8';
  const commentStroke = options?.commentStroke || '#888888';
  const commentTextColor = options?.commentTextColor || '#666666';

  const specialFill = options?.specialFill || '#F0E0FF';
  const specialStroke = options?.specialStroke || '#8800CC';

  const ruleNameColor = options?.ruleNameColor || '#000066';

  return `
  .railroad-diagram {
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
  }

  .railroad-terminal rect {
    fill: ${terminalFill};
    stroke: ${terminalStroke};
    stroke-width: ${strokeWidth}px;
  }

  .railroad-terminal text {
    fill: ${terminalTextColor};
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-nonterminal rect {
    fill: ${nonTerminalFill};
    stroke: ${nonTerminalStroke};
    stroke-width: ${strokeWidth}px;
  }

  .railroad-nonterminal text {
    fill: ${nonTerminalTextColor};
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-line {
    stroke: ${lineColor};
    stroke-width: ${strokeWidth}px;
    fill: none;
  }

  .railroad-start circle,
  .railroad-end circle {
    fill: ${markerFill};
  }

  .railroad-comment ellipse {
    fill: ${commentFill};
    stroke: ${commentStroke};
    stroke-width: ${strokeWidth}px;
  }

  .railroad-comment text {
    fill: ${commentTextColor};
    font-style: italic;
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-special rect {
    fill: ${specialFill};
    stroke: ${specialStroke};
    stroke-width: ${strokeWidth}px;
    stroke-dasharray: 5,3;
  }

  .railroad-special text {
    fill: ${nonTerminalTextColor};
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-rule-name {
    font-weight: bold;
    fill: ${ruleNameColor};
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
  }

  .railroad-group {
    /* Grouping container, no specific styles */
  }
`;
};

export default getStyles;
