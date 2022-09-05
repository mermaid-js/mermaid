import mermaidAPI from '../../mermaidAPI';
import * as configApi from '../../config';
import { log } from '../../logger';
import { sanitizeText } from '../common/common';
import { setAccTitle, getAccTitle, getAccDescription, setAccDescription } from '../../commonDb';

let c4ShapeArray = [];
let boundaryParseStack = [''];
let currentBoundaryParse = 'global';
let parentBoundaryParse = '';
let boundarys = [
  {
    alias: 'global',
    label: { text: 'global' },
    type: { text: 'global' },
    tags: null,
    link: null,
    parentBoundary: '',
  },
];
let rels = [];
let title = '';
let wrapEnabled = false;
let description = '';
let c4ShapeInRow = 4;
let c4BoundaryInRow = 2;
let c4Type;

export const getC4Type = function () {
  return c4Type;
};

export const setC4Type = function (c4TypeParam) {
  let sanitizedText = sanitizeText(c4TypeParam, configApi.getConfig());
  c4Type = sanitizedText;
};

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

//type, from, to, label, ?techn, ?descr, ?sprite, ?tags, $link
export const addRel = function (type, from, to, label, techn, descr, sprite, tags, link) {
  // Don't allow label nulling
  if (
    type === undefined ||
    type === null ||
    from === undefined ||
    from === null ||
    to === undefined ||
    to === null ||
    label === undefined ||
    label === null
  )
    return;

  let rel = {};
  const old = rels.find((rel) => rel.from === from && rel.to === to);
  if (old) {
    rel = old;
  } else {
    rels.push(rel);
  }

  rel.type = type;
  rel.from = from;
  rel.to = to;
  rel.label = { text: label };

  if (techn === undefined || techn === null) {
    rel.techn = { text: '' };
  } else {
    if (typeof techn === 'object') {
      let [key, value] = Object.entries(techn)[0];
      rel[key] = { text: value };
    } else {
      rel.techn = { text: techn };
    }
  }

  if (descr === undefined || descr === null) {
    rel.descr = { text: '' };
  } else {
    if (typeof descr === 'object') {
      let [key, value] = Object.entries(descr)[0];
      rel[key] = { text: value };
    } else {
      rel.descr = { text: descr };
    }
  }

  if (typeof sprite === 'object') {
    let [key, value] = Object.entries(sprite)[0];
    rel[key] = value;
  } else {
    rel.sprite = sprite;
  }
  if (typeof tags === 'object') {
    let [key, value] = Object.entries(tags)[0];
    rel[key] = value;
  } else {
    rel.tags = tags;
  }
  if (typeof link === 'object') {
    let [key, value] = Object.entries(link)[0];
    rel[key] = value;
  } else {
    rel.link = link;
  }
  rel.wrap = autoWrap();
};

//type, alias, label, ?descr, ?sprite, ?tags, $link
export const addPersonOrSystem = function (typeC4Shape, alias, label, descr, sprite, tags, link) {
  // Don't allow label nulling
  if (alias === null || label === null) return;

  let personOrSystem = {};
  const old = c4ShapeArray.find((personOrSystem) => personOrSystem.alias === alias);
  if (old && alias === old.alias) {
    personOrSystem = old;
  } else {
    personOrSystem.alias = alias;
    c4ShapeArray.push(personOrSystem);
  }

  // Don't allow null labels, either
  if (label === undefined || label === null) {
    personOrSystem.label = { text: '' };
  } else {
    personOrSystem.label = { text: label };
  }

  if (descr === undefined || descr === null) {
    personOrSystem.descr = { text: '' };
  } else {
    if (typeof descr === 'object') {
      let [key, value] = Object.entries(descr)[0];
      personOrSystem[key] = { text: value };
    } else {
      personOrSystem.descr = { text: descr };
    }
  }

  if (typeof sprite === 'object') {
    let [key, value] = Object.entries(sprite)[0];
    personOrSystem[key] = value;
  } else {
    personOrSystem.sprite = sprite;
  }
  if (typeof tags === 'object') {
    let [key, value] = Object.entries(tags)[0];
    personOrSystem[key] = value;
  } else {
    personOrSystem.tags = tags;
  }
  if (typeof link === 'object') {
    let [key, value] = Object.entries(link)[0];
    personOrSystem[key] = value;
  } else {
    personOrSystem.link = link;
  }
  personOrSystem.typeC4Shape = { text: typeC4Shape };
  personOrSystem.parentBoundary = currentBoundaryParse;
  personOrSystem.wrap = autoWrap();
};

//type, alias, label, ?techn, ?descr ?sprite, ?tags, $link
export const addContainer = function (typeC4Shape, alias, label, techn, descr, sprite, tags, link) {
  // Don't allow label nulling
  if (alias === null || label === null) return;

  let container = {};
  const old = c4ShapeArray.find((container) => container.alias === alias);
  if (old && alias === old.alias) {
    container = old;
  } else {
    container.alias = alias;
    c4ShapeArray.push(container);
  }

  // Don't allow null labels, either
  if (label === undefined || label === null) {
    container.label = { text: '' };
  } else {
    container.label = { text: label };
  }

  if (techn === undefined || techn === null) {
    container.techn = { text: '' };
  } else {
    if (typeof techn === 'object') {
      let [key, value] = Object.entries(techn)[0];
      container[key] = { text: value };
    } else {
      container.techn = { text: techn };
    }
  }

  if (descr === undefined || descr === null) {
    container.descr = { text: '' };
  } else {
    if (typeof descr === 'object') {
      let [key, value] = Object.entries(descr)[0];
      container[key] = { text: value };
    } else {
      container.descr = { text: descr };
    }
  }

  if (typeof sprite === 'object') {
    let [key, value] = Object.entries(sprite)[0];
    container[key] = value;
  } else {
    container.sprite = sprite;
  }
  if (typeof tags === 'object') {
    let [key, value] = Object.entries(tags)[0];
    container[key] = value;
  } else {
    container.tags = tags;
  }
  if (typeof link === 'object') {
    let [key, value] = Object.entries(link)[0];
    container[key] = value;
  } else {
    container.link = link;
  }
  container.wrap = autoWrap();
  container.typeC4Shape = { text: typeC4Shape };
  container.parentBoundary = currentBoundaryParse;
};

//type, alias, label, ?techn, ?descr ?sprite, ?tags, $link
export const addComponent = function (typeC4Shape, alias, label, techn, descr, sprite, tags, link) {
  // Don't allow label nulling
  if (alias === null || label === null) return;

  let component = {};
  const old = c4ShapeArray.find((component) => component.alias === alias);
  if (old && alias === old.alias) {
    component = old;
  } else {
    component.alias = alias;
    c4ShapeArray.push(component);
  }

  // Don't allow null labels, either
  if (label === undefined || label === null) {
    component.label = { text: '' };
  } else {
    component.label = { text: label };
  }

  if (techn === undefined || techn === null) {
    component.techn = { text: '' };
  } else {
    if (typeof techn === 'object') {
      let [key, value] = Object.entries(techn)[0];
      component[key] = { text: value };
    } else {
      component.techn = { text: techn };
    }
  }

  if (descr === undefined || descr === null) {
    component.descr = { text: '' };
  } else {
    if (typeof descr === 'object') {
      let [key, value] = Object.entries(descr)[0];
      component[key] = { text: value };
    } else {
      component.descr = { text: descr };
    }
  }

  if (typeof sprite === 'object') {
    let [key, value] = Object.entries(sprite)[0];
    component[key] = value;
  } else {
    component.sprite = sprite;
  }
  if (typeof tags === 'object') {
    let [key, value] = Object.entries(tags)[0];
    component[key] = value;
  } else {
    component.tags = tags;
  }
  if (typeof link === 'object') {
    let [key, value] = Object.entries(link)[0];
    component[key] = value;
  } else {
    component.link = link;
  }
  component.wrap = autoWrap();
  component.typeC4Shape = { text: typeC4Shape };
  component.parentBoundary = currentBoundaryParse;
};

//alias, label, ?type, ?tags, $link
export const addPersonOrSystemBoundary = function (alias, label, type, tags, link) {
  // if (parentBoundary === null) return;

  // Don't allow label nulling
  if (alias === null || label === null) return;

  let boundary = {};
  const old = boundarys.find((boundary) => boundary.alias === alias);
  if (old && alias === old.alias) {
    boundary = old;
  } else {
    boundary.alias = alias;
    boundarys.push(boundary);
  }

  // Don't allow null labels, either
  if (label === undefined || label === null) {
    boundary.label = { text: '' };
  } else {
    boundary.label = { text: label };
  }

  if (type === undefined || type === null) {
    boundary.type = { text: 'system' };
  } else {
    if (typeof type === 'object') {
      let [key, value] = Object.entries(type)[0];
      boundary[key] = { text: value };
    } else {
      boundary.type = { text: type };
    }
  }

  if (typeof tags === 'object') {
    let [key, value] = Object.entries(tags)[0];
    boundary[key] = value;
  } else {
    boundary.tags = tags;
  }
  if (typeof link === 'object') {
    let [key, value] = Object.entries(link)[0];
    boundary[key] = value;
  } else {
    boundary.link = link;
  }
  boundary.parentBoundary = currentBoundaryParse;
  boundary.wrap = autoWrap();

  parentBoundaryParse = currentBoundaryParse;
  currentBoundaryParse = alias;
  boundaryParseStack.push(parentBoundaryParse);
};

//alias, label, ?type, ?tags, $link
export const addContainerBoundary = function (alias, label, type, tags, link) {
  // if (parentBoundary === null) return;

  // Don't allow label nulling
  if (alias === null || label === null) return;

  let boundary = {};
  const old = boundarys.find((boundary) => boundary.alias === alias);
  if (old && alias === old.alias) {
    boundary = old;
  } else {
    boundary.alias = alias;
    boundarys.push(boundary);
  }

  // Don't allow null labels, either
  if (label === undefined || label === null) {
    boundary.label = { text: '' };
  } else {
    boundary.label = { text: label };
  }

  if (type === undefined || type === null) {
    boundary.type = { text: 'container' };
  } else {
    if (typeof type === 'object') {
      let [key, value] = Object.entries(type)[0];
      boundary[key] = { text: value };
    } else {
      boundary.type = { text: type };
    }
  }

  if (typeof tags === 'object') {
    let [key, value] = Object.entries(tags)[0];
    boundary[key] = value;
  } else {
    boundary.tags = tags;
  }
  if (typeof link === 'object') {
    let [key, value] = Object.entries(link)[0];
    boundary[key] = value;
  } else {
    boundary.link = link;
  }
  boundary.parentBoundary = currentBoundaryParse;
  boundary.wrap = autoWrap();

  parentBoundaryParse = currentBoundaryParse;
  currentBoundaryParse = alias;
  boundaryParseStack.push(parentBoundaryParse);
};

//alias, label, ?type, ?descr, ?sprite, ?tags, $link
export const addDeploymentNode = function (
  nodeType,
  alias,
  label,
  type,
  descr,
  sprite,
  tags,
  link
) {
  // if (parentBoundary === null) return;

  // Don't allow label nulling
  if (alias === null || label === null) return;

  let boundary = {};
  const old = boundarys.find((boundary) => boundary.alias === alias);
  if (old && alias === old.alias) {
    boundary = old;
  } else {
    boundary.alias = alias;
    boundarys.push(boundary);
  }

  // Don't allow null labels, either
  if (label === undefined || label === null) {
    boundary.label = { text: '' };
  } else {
    boundary.label = { text: label };
  }

  if (type === undefined || type === null) {
    boundary.type = { text: 'node' };
  } else {
    if (typeof type === 'object') {
      let [key, value] = Object.entries(type)[0];
      boundary[key] = { text: value };
    } else {
      boundary.type = { text: type };
    }
  }

  if (descr === undefined || descr === null) {
    boundary.descr = { text: '' };
  } else {
    if (typeof descr === 'object') {
      let [key, value] = Object.entries(descr)[0];
      boundary[key] = { text: value };
    } else {
      boundary.descr = { text: descr };
    }
  }

  if (typeof tags === 'object') {
    let [key, value] = Object.entries(tags)[0];
    boundary[key] = value;
  } else {
    boundary.tags = tags;
  }
  if (typeof link === 'object') {
    let [key, value] = Object.entries(link)[0];
    boundary[key] = value;
  } else {
    boundary.link = link;
  }
  boundary.nodeType = nodeType;
  boundary.parentBoundary = currentBoundaryParse;
  boundary.wrap = autoWrap();

  parentBoundaryParse = currentBoundaryParse;
  currentBoundaryParse = alias;
  boundaryParseStack.push(parentBoundaryParse);
};

export const popBoundaryParseStack = function () {
  currentBoundaryParse = parentBoundaryParse;
  boundaryParseStack.pop();
  parentBoundaryParse = boundaryParseStack.pop();
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
  let old = c4ShapeArray.find((element) => element.alias === elementName);
  if (old === undefined) {
    old = boundarys.find((element) => element.alias === elementName);
    if (old === undefined) {
      return;
    }
  }
  if (bgColor !== undefined && bgColor !== null) {
    if (typeof bgColor === 'object') {
      let [key, value] = Object.entries(bgColor)[0];
      old[key] = value;
    } else {
      old.bgColor = bgColor;
    }
  }
  if (fontColor !== undefined && fontColor !== null) {
    if (typeof fontColor === 'object') {
      let [key, value] = Object.entries(fontColor)[0];
      old[key] = value;
    } else {
      old.fontColor = fontColor;
    }
  }
  if (borderColor !== undefined && borderColor !== null) {
    if (typeof borderColor === 'object') {
      let [key, value] = Object.entries(borderColor)[0];
      old[key] = value;
    } else {
      old.borderColor = borderColor;
    }
  }
  if (shadowing !== undefined && shadowing !== null) {
    if (typeof shadowing === 'object') {
      let [key, value] = Object.entries(shadowing)[0];
      old[key] = value;
    } else {
      old.shadowing = shadowing;
    }
  }
  if (shape !== undefined && shape !== null) {
    if (typeof shape === 'object') {
      let [key, value] = Object.entries(shape)[0];
      old[key] = value;
    } else {
      old.shape = shape;
    }
  }
  if (sprite !== undefined && sprite !== null) {
    if (typeof sprite === 'object') {
      let [key, value] = Object.entries(sprite)[0];
      old[key] = value;
    } else {
      old.sprite = sprite;
    }
  }
  if (techn !== undefined && techn !== null) {
    if (typeof techn === 'object') {
      let [key, value] = Object.entries(techn)[0];
      old[key] = value;
    } else {
      old.techn = techn;
    }
  }
  if (legendText !== undefined && legendText !== null) {
    if (typeof legendText === 'object') {
      let [key, value] = Object.entries(legendText)[0];
      old[key] = value;
    } else {
      old.legendText = legendText;
    }
  }
  if (legendSprite !== undefined && legendSprite !== null) {
    if (typeof legendSprite === 'object') {
      let [key, value] = Object.entries(legendSprite)[0];
      old[key] = value;
    } else {
      old.legendSprite = legendSprite;
    }
  }
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
  const old = rels.find((rel) => rel.from === from && rel.to === to);
  if (old === undefined) {
    return;
  }
  if (textColor !== undefined && textColor !== null) {
    if (typeof textColor === 'object') {
      let [key, value] = Object.entries(textColor)[0];
      old[key] = value;
    } else {
      old.textColor = textColor;
    }
  }
  if (lineColor !== undefined && lineColor !== null) {
    if (typeof lineColor === 'object') {
      let [key, value] = Object.entries(lineColor)[0];
      old[key] = value;
    } else {
      old.lineColor = lineColor;
    }
  }
  if (offsetX !== undefined && offsetX !== null) {
    if (typeof offsetX === 'object') {
      let [key, value] = Object.entries(offsetX)[0];
      old[key] = parseInt(value);
    } else {
      old.offsetX = parseInt(offsetX);
    }
  }
  if (offsetY !== undefined && offsetY !== null) {
    if (typeof offsetY === 'object') {
      let [key, value] = Object.entries(offsetY)[0];
      old[key] = parseInt(value);
    } else {
      old.offsetY = parseInt(offsetY);
    }
  }
};

//?c4ShapeInRow, ?c4BoundaryInRow
export const updateLayoutConfig = function (typeC4Shape, c4ShapeInRowParam, c4BoundaryInRowParam) {
  let c4ShapeInRowValue = c4ShapeInRow;
  let c4BoundaryInRowValue = c4BoundaryInRow;

  if (typeof c4ShapeInRowParam === 'object') {
    let [key, value] = Object.entries(c4ShapeInRowParam)[0];
    c4ShapeInRowValue = parseInt(value);
  } else {
    c4ShapeInRowValue = parseInt(c4ShapeInRowParam);
  }
  if (typeof c4BoundaryInRowParam === 'object') {
    let [key, value] = Object.entries(c4BoundaryInRowParam)[0];
    c4BoundaryInRowValue = parseInt(value);
  } else {
    c4BoundaryInRowValue = parseInt(c4BoundaryInRowParam);
  }

  if (c4ShapeInRowValue >= 1) c4ShapeInRow = c4ShapeInRowValue;
  if (c4BoundaryInRowValue >= 1) c4BoundaryInRow = c4BoundaryInRowValue;
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
  if (parentBoundary === undefined || parentBoundary === null) return c4ShapeArray;
  else
    return c4ShapeArray.filter((personOrSystem) => {
      return personOrSystem.parentBoundary === parentBoundary;
    });
};
export const getC4Shape = function (alias) {
  return c4ShapeArray.find((personOrSystem) => personOrSystem.alias === alias);
};
export const getC4ShapeKeys = function (parentBoundary) {
  return Object.keys(getC4ShapeArray(parentBoundary));
};

export const getBoundarys = function (parentBoundary) {
  if (parentBoundary === undefined || parentBoundary === null) return boundarys;
  else return boundarys.filter((boundary) => boundary.parentBoundary === parentBoundary);
};

export const getRels = function () {
  return rels;
};

export const getTitle = function () {
  return title;
};

export const setWrap = function (wrapSetting) {
  wrapEnabled = wrapSetting;
};

export const autoWrap = function () {
  return wrapEnabled;
};

export const clear = function () {
  c4ShapeArray = [];
  boundarys = [
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
  description = '';
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

export const setTitle = function (txt) {
  let sanitizedText = sanitizeText(txt, configApi.getConfig());
  title = sanitizedText;
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
  parseDirective,
  getConfig: () => configApi.getConfig().c4,
  clear,
  LINETYPE,
  ARROWTYPE,
  PLACEMENT,
  setTitle,
  setC4Type,
  // apply,
};
