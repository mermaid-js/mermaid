import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { Node, Edge } from '../../rendering-util/types.js';
import { sanitizeText } from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
} from '../common/commonDb.js';
import type { C4Node, C4Relation } from './c4Types.js';

let c4ShapeArray = [];
let c4Nodes: Map<string, C4Node>;
let boundaryParseStack = [''];
let currentBoundaryParse = 'global';
let parentBoundaryParse = '';
let boundaries = [
  {
    alias: 'global',
    label: { text: 'global' },
    type: { text: 'global' },
    tags: null,
    link: null,
    parentBoundary: '',
  },
];

let rels: C4Relation[] = [];
let title = '';
let wrapEnabled = false;
let c4ShapeInRow = 4;
let c4BoundaryInRow = 2;
let c4Type: string;

export const getC4Type = function () {
  return c4Type;
};

export const setC4Type = function (c4TypeParam: string) {
  const sanitizedText = sanitizeText(c4TypeParam, getConfig());
  c4Type = sanitizedText;
};

// Helper function to handle object values
const applyValueToObject = (object: object, value: object | string, specifier: string) => {
  if (typeof value === 'object') {
    const [key, text] = Object.entries(value)[0];
    object[key] = text;
  } else {
    object[specifier] = value;
  }
};

//type, from, to, label, ?techn, ?descr, ?sprite, ?tags, $link
export const addRel = function (
  type: string,
  from: string,
  to: string,
  label: string,
  techn: object | string,
  descr: object | string,
  sprite: object | string,
  tags: object | string,
  link: object | string
) {
  // Don't allow label nulling
  if (!type || !from || !to || !label) {
    return;
  }

  const rel = {
    type,
    label,
    from,
    to,
    wrap: autoWrap(),
  };

  applyValueToObject(rel, techn, 'techn');
  applyValueToObject(rel, descr, 'descr');
  applyValueToObject(rel, sprite, 'sprite');
  applyValueToObject(rel, tags, 'tags');
  applyValueToObject(rel, link, 'link');

  rels.push(rel as C4Relation);
};

//type, alias, label, ?descr, ?sprite, ?tags, $link
export const addPersonOrSystem = function (
  typeC4Shape: string,
  alias: string,
  label: string,
  descr: object | string,
  sprite: object | string,
  tags: object | string,
  link: object | string
) {
  // Don't allow label nulling
  if (!alias || !label) {
    return;
  }

  const personOrSystem = {
    type: typeC4Shape,
    isBoundary: false,
    alias,
    label,
    fontColor: '#FFFFFF',
    bgColor: typeC4Shape.includes('person') ? '#08427B' : '#1168BD',
    borderColor: typeC4Shape.includes('person') ? '#073B6F' : '#3C7FC0',
    parent: currentBoundaryParse,
    wrap: autoWrap(),
  };

  if (typeC4Shape.includes('external')) {
    personOrSystem.borderColor = '#8A8A8A';
    if (typeC4Shape.includes('person')) {
      personOrSystem.bgColor = '#686868';
    } else {
      personOrSystem.bgColor = '#999999';
    }
  }

  applyValueToObject(personOrSystem, descr, 'descr');
  applyValueToObject(personOrSystem, sprite, 'sprite');
  applyValueToObject(personOrSystem, tags, 'tags');
  applyValueToObject(personOrSystem, link, 'link');

  c4Nodes.set(alias, personOrSystem as C4Node);
};

//type, alias, label, ?techn, ?descr ?sprite, ?tags, $link
export const addContainer = function (
  typeC4Shape: string,
  alias: string,
  label: string,
  techn: object | string,
  descr: object | string,
  sprite: object | string,
  tags: object | string,
  link: object | string
) {
  // Don't allow label nulling
  if (!alias || !label) {
    return;
  }

  const container = {
    type: typeC4Shape,
    isBoundary: false,
    alias,
    label,
    fontColor: '#FFFFFF',
    bgColor: !typeC4Shape.includes('external') ? '#438DD5' : '#B3B3B3',
    borderColor: !typeC4Shape.includes('external') ? '#3C7FC0' : '#A6A6A6',
    parent: currentBoundaryParse,
    wrap: autoWrap(),
  };

  applyValueToObject(container, techn, 'techn');
  applyValueToObject(container, descr, 'descr');
  applyValueToObject(container, sprite, 'sprite');
  applyValueToObject(container, tags, 'tags');
  applyValueToObject(container, link, 'link');

  c4Nodes.set(alias, container as C4Node);
};

//type, alias, label, ?techn, ?descr ?sprite, ?tags, $link
export const addComponent = function (
  typeC4Shape: string,
  alias: string,
  label: string,
  techn: object | string,
  descr: object | string,
  sprite: object | string,
  tags: object | string,
  link: object | string
) {
  // Don't allow label nulling
  if (!alias || !label) {
    return;
  }

  const component = {
    type: typeC4Shape,
    isBoundary: false,
    alias,
    label,
    fontColor: '#FFFFFF',
    bgColor: '#85BBF0',
    borderColor: '#78A8D8',
    parent: currentBoundaryParse,
    wrap: autoWrap(),
  };

  applyValueToObject(component, techn, 'techn');
  applyValueToObject(component, descr, 'descr');
  applyValueToObject(component, sprite, 'sprite');
  applyValueToObject(component, tags, 'tags');
  applyValueToObject(component, link, 'link');

  c4Nodes.set(alias, component as C4Node);
};

//alias, label, ?type, ?tags, $link
export const addPersonOrSystemBoundary = function (
  alias: string,
  label: string,
  type: object | string,
  tags: object | string,
  link: object | string
) {
  // Don't allow label nulling
  if (!alias || !label) {
    return;
  }

  const boundary = {
    isBoundary: true,
    alias,
    label,
    parent: currentBoundaryParse,
    wrap: autoWrap(),
  };

  applyValueToObject(boundary, type || 'system', 'type');
  applyValueToObject(boundary, tags, 'tags');
  applyValueToObject(boundary, link, 'link');

  c4Nodes.set(alias, boundary as C4Node);

  parentBoundaryParse = currentBoundaryParse;
  currentBoundaryParse = alias;
  boundaryParseStack.push(parentBoundaryParse);
};

//alias, label, ?type, ?tags, $link
export const addContainerBoundary = function (
  alias: string,
  label: string,
  type: object | string,
  tags: object | string,
  link: object | string
) {
  // Don't allow label nulling
  if (!alias || !label) {
    return;
  }

  const boundary = {
    isBoundary: true,
    alias,
    label,
    parent: currentBoundaryParse,
    wrap: autoWrap(),
  };

  applyValueToObject(boundary, type || 'container', 'type');
  applyValueToObject(boundary, tags, 'tags');
  applyValueToObject(boundary, link, 'link');

  c4Nodes.set(alias, boundary as C4Node);

  parentBoundaryParse = currentBoundaryParse;
  currentBoundaryParse = alias;
  boundaryParseStack.push(parentBoundaryParse);
};

//alias, label, ?type, ?descr, ?sprite, ?tags, $link
export const addDeploymentNode = function (
  nodeType: string,
  alias: string,
  label: string,
  type: object | string,
  descr: object | string,
  sprite: object | string,
  tags: object | string,
  link: object | string
) {
  // Don't allow label nulling
  if (!alias || !label) {
    return;
  }

  const boundary = {
    nodeType,
    isBoundary: true,
    alias,
    label,
    parent: currentBoundaryParse,
    wrap: autoWrap(),
  };

  applyValueToObject(boundary, type || 'node', 'type');
  applyValueToObject(boundary, descr, 'descr');
  applyValueToObject(boundary, sprite, 'sprite');
  applyValueToObject(boundary, tags, 'tags');
  applyValueToObject(boundary, link, 'link');

  c4Nodes.set(alias, boundary as C4Node);

  parentBoundaryParse = currentBoundaryParse;
  currentBoundaryParse = alias;
  boundaryParseStack.push(parentBoundaryParse);
};

export const popBoundaryParseStack = function () {
  currentBoundaryParse = parentBoundaryParse;
  boundaryParseStack.pop();
  parentBoundaryParse = boundaryParseStack.pop() || '';
  boundaryParseStack.push(parentBoundaryParse);
};

//elementName, ?bgColor, ?fontColor, ?borderColor, ?shadowing, ?shape, ?sprite, ?techn, ?legendText, ?legendSprite
export const updateElStyle = function (
  typeC4Shape,
  elementName,
  bgColor,
  fontColor,
  borderColor,
  shadowing,
  shape,
  sprite,
  techn,
  legendText,
  legendSprite
) {
  // let old = c4ShapeArray.find((element) => element.alias === elementName);
  // if (old === undefined) {
  //   old = boundaries.find((element) => element.alias === elementName);
  //   if (old === undefined) {
  //     return;
  //   }
  // }
  // if (bgColor !== undefined && bgColor !== null) {
  //   if (typeof bgColor === 'object') {
  //     const [key, value] = Object.entries(bgColor)[0];
  //     old[key] = value;
  //   } else {
  //     old.bgColor = bgColor;
  //   }
  // }
  // if (fontColor !== undefined && fontColor !== null) {
  //   if (typeof fontColor === 'object') {
  //     const [key, value] = Object.entries(fontColor)[0];
  //     old[key] = value;
  //   } else {
  //     old.fontColor = fontColor;
  //   }
  // }
  // if (borderColor !== undefined && borderColor !== null) {
  //   if (typeof borderColor === 'object') {
  //     const [key, value] = Object.entries(borderColor)[0];
  //     old[key] = value;
  //   } else {
  //     old.borderColor = borderColor;
  //   }
  // }
  // if (shadowing !== undefined && shadowing !== null) {
  //   if (typeof shadowing === 'object') {
  //     const [key, value] = Object.entries(shadowing)[0];
  //     old[key] = value;
  //   } else {
  //     old.shadowing = shadowing;
  //   }
  // }
  // if (shape !== undefined && shape !== null) {
  //   if (typeof shape === 'object') {
  //     const [key, value] = Object.entries(shape)[0];
  //     old[key] = value;
  //   } else {
  //     old.shape = shape;
  //   }
  // }
  // if (sprite !== undefined && sprite !== null) {
  //   if (typeof sprite === 'object') {
  //     const [key, value] = Object.entries(sprite)[0];
  //     old[key] = value;
  //   } else {
  //     old.sprite = sprite;
  //   }
  // }
  // if (techn !== undefined && techn !== null) {
  //   if (typeof techn === 'object') {
  //     const [key, value] = Object.entries(techn)[0];
  //     old[key] = value;
  //   } else {
  //     old.techn = techn;
  //   }
  // }
  // if (legendText !== undefined && legendText !== null) {
  //   if (typeof legendText === 'object') {
  //     const [key, value] = Object.entries(legendText)[0];
  //     old[key] = value;
  //   } else {
  //     old.legendText = legendText;
  //   }
  // }
  // if (legendSprite !== undefined && legendSprite !== null) {
  //   if (typeof legendSprite === 'object') {
  //     const [key, value] = Object.entries(legendSprite)[0];
  //     old[key] = value;
  //   } else {
  //     old.legendSprite = legendSprite;
  //   }
  // }

  const updatedEl = c4Nodes.get(elementName);
  if (!updatedEl) {
    return;
  }

  applyValueToObject(updatedEl, bgColor, 'bgColor');
  applyValueToObject(updatedEl, fontColor, 'fontColor');
  applyValueToObject(updatedEl, borderColor, 'borderColor');
  applyValueToObject(updatedEl, shadowing, 'shadowing');
  applyValueToObject(updatedEl, shape, 'shape');
  applyValueToObject(updatedEl, legendText, 'legendText');
  applyValueToObject(updatedEl, legendSprite, 'legendSprite');

  updatedEl.sprite = sprite;
  updatedEl.techn = techn;
};

//textColor, lineColor, ?offsetX, ?offsetY
export const updateRelStyle = function (
  typeC4Shape,
  from,
  to,
  textColor,
  lineColor,
  offsetX,
  offsetY
) {
  // const old = rels.find((rel) => rel.from === from && rel.to === to);
  // if (old === undefined) {
  //   return;
  // }
  // if (textColor !== undefined && textColor !== null) {
  //   if (typeof textColor === 'object') {
  //     const [key, value] = Object.entries(textColor)[0];
  //     old[key] = value;
  //   } else {
  //     old.textColor = textColor;
  //   }
  // }
  // if (lineColor !== undefined && lineColor !== null) {
  //   if (typeof lineColor === 'object') {
  //     const [key, value] = Object.entries(lineColor)[0];
  //     old[key] = value;
  //   } else {
  //     old.lineColor = lineColor;
  //   }
  // }
  // if (offsetX !== undefined && offsetX !== null) {
  //   if (typeof offsetX === 'object') {
  //     const [key, value] = Object.entries(offsetX)[0];
  //     old[key] = parseInt(value);
  //   } else {
  //     old.offsetX = parseInt(offsetX);
  //   }
  // }
  // if (offsetY !== undefined && offsetY !== null) {
  //   if (typeof offsetY === 'object') {
  //     const [key, value] = Object.entries(offsetY)[0];
  //     old[key] = parseInt(value);
  //   } else {
  //     old.offsetY = parseInt(offsetY);
  //   }
  // }

  const updatedRel = rels.find((rel) => rel.from === from && rel.to === to);
  if (!updatedRel) {
    return;
  }
  applyValueToObject(updatedRel, textColor, 'textColor');
  applyValueToObject(updatedRel, lineColor, 'lineColor');
  applyValueToObject(updatedRel, offsetX, 'offsetX');
  applyValueToObject(updatedRel, offsetY, 'offsetY');
};

//?c4ShapeInRow, ?c4BoundaryInRow
export const updateLayoutConfig = function (typeC4Shape, c4ShapeInRowParam, c4BoundaryInRowParam) {
  let c4ShapeInRowValue = c4ShapeInRow;
  let c4BoundaryInRowValue = c4BoundaryInRow;

  if (typeof c4ShapeInRowParam === 'object') {
    const value = Object.values(c4ShapeInRowParam)[0];
    c4ShapeInRowValue = parseInt(value);
  } else {
    c4ShapeInRowValue = parseInt(c4ShapeInRowParam);
  }
  if (typeof c4BoundaryInRowParam === 'object') {
    const value = Object.values(c4BoundaryInRowParam)[0];
    c4BoundaryInRowValue = parseInt(value);
  } else {
    c4BoundaryInRowValue = parseInt(c4BoundaryInRowParam);
  }

  if (c4ShapeInRowValue >= 1) {
    c4ShapeInRow = c4ShapeInRowValue;
  }
  if (c4BoundaryInRowValue >= 1) {
    c4BoundaryInRow = c4BoundaryInRowValue;
  }
};

export const getC4ShapeInRow = function () {
  return c4ShapeInRow;
};
export const getC4BoundaryInRow = function () {
  return c4BoundaryInRow;
};
export const getCurrentBoundaryParse = function () {
  return currentBoundaryParse;
};

export const getParentBoundaryParse = function () {
  return parentBoundaryParse;
};

export const getC4ShapeArray = function (parentBoundary) {
  if (parentBoundary === undefined || parentBoundary === null) {
    return c4ShapeArray;
  } else {
    return c4ShapeArray.filter((personOrSystem) => {
      return personOrSystem.parentBoundary === parentBoundary;
    });
  }
};
export const getC4Shape = function (alias) {
  return c4ShapeArray.find((personOrSystem) => personOrSystem.alias === alias);
};
export const getC4ShapeKeys = function (parentBoundary) {
  return Object.keys(getC4ShapeArray(parentBoundary));
};

export const getBoundaries = function (parentBoundary) {
  if (parentBoundary === undefined || parentBoundary === null) {
    return boundaries;
  } else {
    return boundaries.filter((boundary) => boundary.parentBoundary === parentBoundary);
  }
};

/**
 * @deprecated Use {@link getBoundaries} instead
 */
export const getBoundarys = getBoundaries;

export const getRels = function () {
  return rels;
};

export const getTitle = function () {
  return title;
};

export const setWrap = function (wrapSetting: boolean) {
  wrapEnabled = wrapSetting;
};

export const autoWrap = function () {
  return wrapEnabled;
};

export const clear = function () {
  c4ShapeArray = [];
  c4Nodes = new Map();
  boundaries = [
    {
      alias: 'global',
      label: { text: 'global' },
      type: { text: 'global' },
      tags: null,
      link: null,
      parentBoundary: '',
    },
  ];
  parentBoundaryParse = '';
  currentBoundaryParse = 'global';
  boundaryParseStack = [''];
  rels = [];

  boundaryParseStack = [''];
  title = '';
  wrapEnabled = false;
  c4ShapeInRow = 4;
  c4BoundaryInRow = 2;
};

export const LINETYPE = {
  SOLID: 0,
  DOTTED: 1,
  NOTE: 2,
  SOLID_CROSS: 3,
  DOTTED_CROSS: 4,
  SOLID_OPEN: 5,
  DOTTED_OPEN: 6,
  LOOP_START: 10,
  LOOP_END: 11,
  ALT_START: 12,
  ALT_ELSE: 13,
  ALT_END: 14,
  OPT_START: 15,
  OPT_END: 16,
  ACTIVE_START: 17,
  ACTIVE_END: 18,
  PAR_START: 19,
  PAR_AND: 20,
  PAR_END: 21,
  RECT_START: 22,
  RECT_END: 23,
  SOLID_POINT: 24,
  DOTTED_POINT: 25,
};

export const ARROWTYPE = {
  FILLED: 0,
  OPEN: 1,
};

export const PLACEMENT = {
  LEFTOF: 0,
  RIGHTOF: 1,
  OVER: 2,
};

export const setTitle = function (txt: string) {
  const sanitizedText = sanitizeText(txt, getConfig());
  title = sanitizedText;
};

export const getData = function () {
  const config = getConfig();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // let personImg =
  //   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAACD0lEQVR4Xu2YoU4EMRCGT+4j8Ai8AhaH4QHgAUjQuFMECUgMIUgwJAgMhgQsAYUiJCiQIBBY+EITsjfTdme6V24v4c8vyGbb+ZjOtN0bNcvjQXmkH83WvYBWto6PLm6v7p7uH1/w2fXD+PBycX1Pv2l3IdDm/vn7x+dXQiAubRzoURa7gRZWd0iGRIiJbOnhnfYBQZNJjNbuyY2eJG8fkDE3bbG4ep6MHUAsgYxmE3nVs6VsBWJSGccsOlFPmLIViMzLOB7pCVO2AtHJMohH7Fh6zqitQK7m0rJvAVYgGcEpe//PLdDz65sM4pF9N7ICcXDKIB5Nv6j7tD0NoSdM2QrU9Gg0ewE1LqBhHR3BBdvj2vapnidjHxD/q6vd7Pvhr31AwcY8eXMTXAKECZZJFXuEq27aLgQK5uLMohCenGGuGewOxSjBvYBqeG6B+Nqiblggdjnc+ZXDy+FNFpFzw76O3UBAROuXh6FoiAcf5g9eTvUgzy0nWg6I8cXHRUpg5bOVBCo+KDpFajOf23GgPme7RSQ+lacIENUgJ6gg1k6HjgOlqnLqip4tEuhv0hNEMXUD0clyXE3p6pZA0S2nnvTlXwLJEZWlb7cTQH1+USgTN4VhAenm/wea1OCAOmqo6fE1WCb9WSKBah+rbUWPWAmE2Rvk0ApiB45eOyNAzU8xcTvj8KvkKEoOaIYeHNA3ZuygAvFMUO0AAAAASUVORK5CYII=';
  // switch (c4Shape.typeC4Shape.text) {
  //   case 'person':
  //     personImg =
  //       'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAACD0lEQVR4Xu2YoU4EMRCGT+4j8Ai8AhaH4QHgAUjQuFMECUgMIUgwJAgMhgQsAYUiJCiQIBBY+EITsjfTdme6V24v4c8vyGbb+ZjOtN0bNcvjQXmkH83WvYBWto6PLm6v7p7uH1/w2fXD+PBycX1Pv2l3IdDm/vn7x+dXQiAubRzoURa7gRZWd0iGRIiJbOnhnfYBQZNJjNbuyY2eJG8fkDE3bbG4ep6MHUAsgYxmE3nVs6VsBWJSGccsOlFPmLIViMzLOB7pCVO2AtHJMohH7Fh6zqitQK7m0rJvAVYgGcEpe//PLdDz65sM4pF9N7ICcXDKIB5Nv6j7tD0NoSdM2QrU9Gg0ewE1LqBhHR3BBdvj2vapnidjHxD/q6vd7Pvhr31AwcY8eXMTXAKECZZJFXuEq27aLgQK5uLMohCenGGuGewOxSjBvYBqeG6B+Nqiblggdjnc+ZXDy+FNFpFzw76O3UBAROuXh6FoiAcf5g9eTvUgzy0nWg6I8cXHRUpg5bOVBCo+KDpFajOf23GgPme7RSQ+lacIENUgJ6gg1k6HjgOlqnLqip4tEuhv0hNEMXUD0clyXE3p6pZA0S2nnvTlXwLJEZWlb7cTQH1+USgTN4VhAenm/wea1OCAOmqo6fE1WCb9WSKBah+rbUWPWAmE2Rvk0ApiB45eOyNAzU8xcTvj8KvkKEoOaIYeHNA3ZuygAvFMUO0AAAAASUVORK5CYII=';
  //     break;
  //   case 'external_person':
  //     personImg =
  //       'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAB6ElEQVR4Xu2YLY+EMBCG9+dWr0aj0Wg0Go1Go0+j8Xdv2uTCvv1gpt0ebHKPuhDaeW4605Z9mJvx4AdXUyTUdd08z+u6flmWZRnHsWkafk9DptAwDPu+f0eAYtu2PEaGWuj5fCIZrBAC2eLBAnRCsEkkxmeaJp7iDJ2QMDdHsLg8SxKFEJaAo8lAXnmuOFIhTMpxxKATebo4UiFknuNo4OniSIXQyRxEA3YsnjGCVEjVXD7yLUAqxBGUyPv/Y4W2beMgGuS7kVQIBycH0fD+oi5pezQETxdHKmQKGk1eQEYldK+jw5GxPfZ9z7Mk0Qnhf1W1m3w//EUn5BDmSZsbR44QQLBEqrBHqOrmSKaQAxdnLArCrxZcM7A7ZKs4ioRq8LFC+NpC3WCBJsvpVw5edm9iEXFuyNfxXAgSwfrFQ1c0iNda8AdejvUgnktOtJQQxmcfFzGglc5WVCj7oDgFqU18boeFSs52CUh8LE8BIVQDT1ABrB0HtgSEYlX5doJnCwv9TXocKCaKbnwhdDKPq4lf3SwU3HLq4V/+WYhHVMa/3b4IlfyikAduCkcBc7mQ3/z/Qq/cTuikhkzB12Ae/mcJC9U+Vo8Ej1gWAtgbeGgFsAMHr50BIWOLCbezvhpBFUdY6EJuJ/QDW0XoMX60zZ0AAAAASUVORK5CYII=';
  //     break;
  // }

  for (const alias of c4Nodes.keys()) {
    const c4Node = c4Nodes.get(alias)!;

    switch (c4Node.type) {
      case 'person':
        c4Node.sprite =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAACD0lEQVR4Xu2YoU4EMRCGT+4j8Ai8AhaH4QHgAUjQuFMECUgMIUgwJAgMhgQsAYUiJCiQIBBY+EITsjfTdme6V24v4c8vyGbb+ZjOtN0bNcvjQXmkH83WvYBWto6PLm6v7p7uH1/w2fXD+PBycX1Pv2l3IdDm/vn7x+dXQiAubRzoURa7gRZWd0iGRIiJbOnhnfYBQZNJjNbuyY2eJG8fkDE3bbG4ep6MHUAsgYxmE3nVs6VsBWJSGccsOlFPmLIViMzLOB7pCVO2AtHJMohH7Fh6zqitQK7m0rJvAVYgGcEpe//PLdDz65sM4pF9N7ICcXDKIB5Nv6j7tD0NoSdM2QrU9Gg0ewE1LqBhHR3BBdvj2vapnidjHxD/q6vd7Pvhr31AwcY8eXMTXAKECZZJFXuEq27aLgQK5uLMohCenGGuGewOxSjBvYBqeG6B+Nqiblggdjnc+ZXDy+FNFpFzw76O3UBAROuXh6FoiAcf5g9eTvUgzy0nWg6I8cXHRUpg5bOVBCo+KDpFajOf23GgPme7RSQ+lacIENUgJ6gg1k6HjgOlqnLqip4tEuhv0hNEMXUD0clyXE3p6pZA0S2nnvTlXwLJEZWlb7cTQH1+USgTN4VhAenm/wea1OCAOmqo6fE1WCb9WSKBah+rbUWPWAmE2Rvk0ApiB45eOyNAzU8xcTvj8KvkKEoOaIYeHNA3ZuygAvFMUO0AAAAASUVORK5CYII=';
        c4Node.shape = 'rect';
        break;
      case 'external_person':
        c4Node.sprite =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAB6ElEQVR4Xu2YLY+EMBCG9+dWr0aj0Wg0Go1Go0+j8Xdv2uTCvv1gpt0ebHKPuhDaeW4605Z9mJvx4AdXUyTUdd08z+u6flmWZRnHsWkafk9DptAwDPu+f0eAYtu2PEaGWuj5fCIZrBAC2eLBAnRCsEkkxmeaJp7iDJ2QMDdHsLg8SxKFEJaAo8lAXnmuOFIhTMpxxKATebo4UiFknuNo4OniSIXQyRxEA3YsnjGCVEjVXD7yLUAqxBGUyPv/Y4W2beMgGuS7kVQIBycH0fD+oi5pezQETxdHKmQKGk1eQEYldK+jw5GxPfZ9z7Mk0Qnhf1W1m3w//EUn5BDmSZsbR44QQLBEqrBHqOrmSKaQAxdnLArCrxZcM7A7ZKs4ioRq8LFC+NpC3WCBJsvpVw5edm9iEXFuyNfxXAgSwfrFQ1c0iNda8AdejvUgnktOtJQQxmcfFzGglc5WVCj7oDgFqU18boeFSs52CUh8LE8BIVQDT1ABrB0HtgSEYlX5doJnCwv9TXocKCaKbnwhdDKPq4lf3SwU3HLq4V/+WYhHVMa/3b4IlfyikAduCkcBc7mQ3/z/Qq/cTuikhkzB12Ae/mcJC9U+Vo8Ej1gWAtgbeGgFsAMHr50BIWOLCbezvhpBFUdY6EJuJ/QDW0XoMX60zZ0AAAAASUVORK5CYII=';
        c4Node.shape = 'rect';
        break;
      case 'system':
      case 'external_system':
      case 'container':
      case 'external_container':
      case 'component':
      case 'external_component':
        c4Node.shape = 'rect';
        break;
      case 'system_db':
      case 'external_system_db':
      case 'container_db':
      case 'external_container_db':
      case 'component_db':
      case 'external_component_db':
        c4Node.shape = 'database';
        break;
      case 'system_queue':
      case 'external_system_queue':
      case 'container_queue':
      case 'external_container_queue':
      case 'component_queue':
      case 'external_component_queue':
        c4Node.shape = 'das';
        break;
    }
    const node: Node = {
      id: c4Node.alias,
      parentId: c4Node.parent !== 'global' ? c4Node.parent : undefined,
      isGroup: c4Node.isBoundary,
      label: !c4Node.isBoundary
        ? `<em>«${c4Node.type}»</em>\n${c4Node.sprite ? '<br><br>' : ''}<strong>${c4Node.label}</strong>${c4Node.techn ? `<br><em>[${c4Node.techn}]</em>` : ''}${c4Node.descr ? `<br><br>${c4Node.descr}` : ''}`
        : `<strong>${c4Node.label}</strong>\n[${c4Node.type}]`,
      padding: config.c4?.c4ShapePadding || 6,
      shape: c4Node.shape,
      position: c4Node.sprite,
      rx: 2.5,
      ry: 2.5,
      cssStyles: c4Node.isBoundary
        ? [
            c4Node.borderColor ? `stroke: ${c4Node.borderColor}` : '',
            c4Node.bgColor ? `fill: ${c4Node.bgColor}` : '',
            c4Node.fontColor ? `color: ${c4Node.fontColor}` : '',
          ]
        : [
            `stroke: ${c4Node.borderColor || ''}`,
            `fill: ${c4Node.bgColor || ''}`,
            `color: ${c4Node.fontColor || ''}`,
          ],
      look: config.look,
    };
    node.sprite = c4Node.sprite;
    nodes.push(node);
  }

  let count = 0;
  for (const rel of rels) {
    const edge: Edge = {
      id: `${rel.from}-${rel.to}-${count}`,
      start: rel.from,
      end: rel.to,
      label: rel.label + (rel.techn ? `\n<em>[${rel.techn}]</em>` : ''),
      labelpos: 'c',
      type: 'normal',
      thickness: 'normal',
      arrowTypeStart: rel.type === 'birel' ? 'extension' : '',
      arrowTypeEnd: 'extension',
      arrowheadStyle: '',
      labelStyle: [`color: ${rel.textColor}`],
      style: ['fill: none', `stroke: ${rel.lineColor || ''}`],
      classes: 'edge',
      pattern: 'solid',
      look: config.look,
    };
    edges.push(edge);
    count++;
  }

  return { nodes, edges, other: {}, config };
};

export default {
  addPersonOrSystem,
  addPersonOrSystemBoundary,
  addContainer,
  addContainerBoundary,
  addComponent,
  addDeploymentNode,
  popBoundaryParseStack,
  addRel,
  updateElStyle,
  updateRelStyle,
  updateLayoutConfig,
  autoWrap,
  setWrap,
  getC4ShapeArray,
  getC4Shape,
  getC4ShapeKeys,
  getBoundaries,
  getBoundarys,
  getCurrentBoundaryParse,
  getParentBoundaryParse,
  getRels,
  getTitle,
  getC4Type,
  getC4ShapeInRow,
  getC4BoundaryInRow,
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  getConfig: () => getConfig().c4,
  clear,
  LINETYPE,
  ARROWTYPE,
  PLACEMENT,
  setTitle,
  setC4Type,
  getData,
  // apply,
};
