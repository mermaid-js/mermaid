import { getConfig as commonGetConfig } from '../../config.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import { isLabelStyle } from '../../rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';

import { cleanAndMerge } from '../../utils.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { TreemapDB, TreemapData, TreemapNode } from './types.js';

const defaultTreemapData: TreemapData = {
  nodes: [],
  levels: new Map(),
};
let outerNodes: TreemapNode[] = [];
let data: TreemapData = structuredClone(defaultTreemapData);

const getConfig = () => {
  return cleanAndMerge({
    ...DEFAULT_CONFIG.treemap,
    ...commonGetConfig().treemap,
  });
};

const getNodes = (): TreemapNode[] => data.nodes;

const addNode = (node: TreemapNode, level: number) => {
  data.nodes.push(node);
  data.levels.set(node, level);

  if (level === 0) {
    outerNodes.push(node);
  }

  // Set the root node if this is a level 0 node and we don't have a root yet
  if (level === 0 && !data.root) {
    data.root = node;
  }
};

const getRoot = (): TreemapNode | undefined => ({ name: '', children: outerNodes });

let classes = new Map<string, DiagramStyleClassDef>();

const addClass = (id: string, _style: string) => {
  const styleClass = classes.get(id) ?? { id, styles: [], textStyles: [] };
  classes.set(id, styleClass);

  const style = _style.replace(/\\,/g, '§§§').replace(/,/g, ';').replace(/§§§/g, ',').split(';');

  if (style) {
    style.forEach((s) => {
      if (isLabelStyle(s)) {
        console.debug('isLabelStyle', s);
        // const newStyle = s.replace('fill', 'bgFill'); // .replace('color', 'fill');
        if (styleClass?.textStyles) {
          styleClass.textStyles.push(s);
        } else {
          styleClass.textStyles = [s];
        }
      }
      if (styleClass?.styles) {
        styleClass.styles.push(s);
      } else {
        styleClass.styles = [s];
      }
    });
  }

  // classes.forEach((value) => {
  //   if (value.cssClasses.includes(id)) {
  //     value.styles.push(...style.flatMap((s) => s.split(',')));
  //   }
  // });

  classes.set(id, styleClass);
};
const getClasses = (): Map<string, DiagramStyleClassDef> => {
  return classes;
};

const getStylesForClass = (classSelector: string) => {
  return classes.get(classSelector)?.styles;
};

const clear = () => {
  commonClear();
  data = structuredClone(defaultTreemapData);
  outerNodes = [];
  classes = new Map();
};

export const db: TreemapDB = {
  getNodes,
  addNode,
  getRoot,
  getConfig,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  addClass,
  getClasses,
  getStylesForClass,
};
