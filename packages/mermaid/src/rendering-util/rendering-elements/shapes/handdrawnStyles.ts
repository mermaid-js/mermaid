import { getConfig } from '$root/diagram-api/diagramAPI.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import styles from '../../../../dist/diagrams/packet/styles';

// Striped fill like start or fork nodes in state diagrams
export const solidStateFill = (color: string) => {
  const { handdrawnSeed } = getConfig();
  return {
    fill: color,
    hachureAngle: 120, // angle of hachure,
    hachureGap: 4,
    fillWeight: 2,
    roughness: 0.7,
    stroke: color,
    seed: handdrawnSeed,
  };
};

export const compileStyles = (node: Node) => {
  // node.cssCompiledStyles is an array of strings in the form of 'key: value' where jey is the css property and value is the value
  // the array is the styles of node node from the classes it is using
  // node.cssStyles is an array of styles directly set on the node

  // concat the arrays and remove duplicates such that the values from node.cssStyles are used if there are duplicates
  return [...(node.cssCompiledStyles || []), ...(node.cssStyles || [])];
};

export const styles2Map = (styles: string[]) => {
  const styleMap = new Map();
  styles.forEach((style) => {
    const [key, value] = style.split(':');
    styleMap.set(key.trim(), value.trim());
  });
  return styleMap;
};

export const styles2String = (node: Node) => {
  const styles = compileStyles(node);
  const labelStyles: string[] = [];
  const nodeStyles: string[] = [];

  styles.forEach((style) => {
    const [key, value] = style.split(':');
    if (key === 'color') {
      labelStyles.push(style);
    } else {
      nodeStyles.push(style);
    }
  });
  return { labelStyles: labelStyles.join(';'), nodeStyles: nodeStyles.join(';') };
};

// Striped fill like start or fork nodes in state diagrams
// TODO remove any
export const userNodeOverrides = (node: Node, options: any) => {
  const { themeVariables, handdrawnSeed } = getConfig();
  const { nodeBorder, mainBkg } = themeVariables;
  const styles = compileStyles(node);

  // index the style array to a map object
  const styleMap = styles2Map(styles);

  const result = Object.assign(
    {
      roughness: 0.7,
      fill: styleMap.get('fill') || mainBkg,
      fillStyle: 'hachure', // solid fill
      fillWeight: 3.5,
      stroke: styleMap.get('stroke') || nodeBorder,
      seed: handdrawnSeed,
      strokeWidth: 1.3,
    },
    options
  );
  return result;
};
