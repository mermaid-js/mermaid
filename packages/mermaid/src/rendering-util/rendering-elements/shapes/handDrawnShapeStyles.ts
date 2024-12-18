import { getConfig } from '../../../diagram-api/diagramAPI.js';
import type { Node } from '../../types.js';

// Striped fill like start or fork nodes in state diagrams
export const solidStateFill = (color: string) => {
  const { handDrawnSeed } = getConfig();
  return {
    fill: color,
    hachureAngle: 120, // angle of hachure,
    hachureGap: 4,
    fillWeight: 2,
    roughness: 0.7,
    stroke: color,
    seed: handDrawnSeed,
  };
};

export const compileStyles = (node: Node) => {
  // node.cssCompiledStyles is an array of strings in the form of 'key: value' where jey is the css property and value is the value
  // the array is the styles of node node from the classes it is using
  // node.cssStyles is an array of styles directly set on the node
  // concat the arrays and remove duplicates such that the values from node.cssStyles are used if there are duplicates
  const stylesMap = styles2Map([...(node.cssCompiledStyles || []), ...(node.cssStyles || [])]);
  return { stylesMap, stylesArray: [...stylesMap] };
};

export const styles2Map = (styles: string[]) => {
  const styleMap = new Map<string, string>();
  styles.forEach((style) => {
    const [key, value] = style.split(':');
    styleMap.set(key.trim(), value?.trim());
  });
  return styleMap;
};
export const isLabelStyle = (key: string) => {
  return (
    key === 'color' ||
    key === 'font-size' ||
    key === 'font-family' ||
    key === 'font-weight' ||
    key === 'font-style' ||
    key === 'text-decoration' ||
    key === 'text-align' ||
    key === 'text-transform' ||
    key === 'line-height' ||
    key === 'letter-spacing' ||
    key === 'word-spacing' ||
    key === 'text-shadow' ||
    key === 'text-overflow' ||
    key === 'white-space' ||
    key === 'word-wrap' ||
    key === 'word-break' ||
    key === 'overflow-wrap' ||
    key === 'hyphens'
  );
};
export const styles2String = (node: Node) => {
  const { stylesArray } = compileStyles(node);
  const labelStyles: string[] = [];
  const nodeStyles: string[] = [];
  const borderStyles: string[] = [];
  const backgroundStyles: string[] = [];

  stylesArray.forEach((style) => {
    const key = style[0];
    if (isLabelStyle(key)) {
      labelStyles.push(style.join(':') + ' !important');
    } else {
      nodeStyles.push(style.join(':') + ' !important');
      if (key.includes('stroke')) {
        borderStyles.push(style.join(':') + ' !important');
      }
      if (key === 'fill') {
        backgroundStyles.push(style.join(':') + ' !important');
      }
    }
  });

  return {
    labelStyles: labelStyles.join(';'),
    nodeStyles: nodeStyles.join(';'),
    stylesArray,
    borderStyles,
    backgroundStyles,
  };
};

// Striped fill like start or fork nodes in state diagrams
// TODO remove any
export const userNodeOverrides = (node: Node, options: any) => {
  const { themeVariables, handDrawnSeed } = getConfig();
  const { nodeBorder, mainBkg } = themeVariables;
  const { stylesMap } = compileStyles(node);

  // index the style array to a map object
  const result = Object.assign(
    {
      roughness: 0.7,
      fill: stylesMap.get('fill') || mainBkg,
      fillStyle: 'hachure', // solid fill
      fillWeight: 4,
      hachureGap: 5.2,
      stroke: stylesMap.get('stroke') || nodeBorder,
      seed: handDrawnSeed,
      strokeWidth: stylesMap.get('stroke-width')?.replace('px', '') || 1.3,
      fillLineDash: [0, 0],
    },
    options
  );
  return result;
};
