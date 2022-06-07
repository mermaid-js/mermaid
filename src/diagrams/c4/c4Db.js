import mermaidAPI from '../../mermaidAPI';
import * as configApi from '../../config';
import { log } from '../../logger';
import { sanitizeText } from '../common/common';

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
var c4Type;

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

  if (descr === undefined || descr === null) {
    rel.descr = { text: '' };
  } else {
    rel.descr = { text: descr };
  }

  if (techn === undefined || techn === null) {
    rel.techn = { text: '' };
  } else {
    rel.techn = { text: techn };
  }

  // rel.techn = techn;
  rel.sprite = sprite;
  rel.tags = tags;
  rel.link = link;
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
    personOrSystem.descr = { text: descr };
  }

  personOrSystem.wrap = autoWrap();
  personOrSystem.sprite = sprite;
  personOrSystem.tags = tags;
  personOrSystem.link = link;
  personOrSystem.typeC4Shape = { text: typeC4Shape };
  personOrSystem.parentBoundary = currentBoundaryParse;
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
    container.techn = { text: techn };
  }

  if (descr === undefined || descr === null) {
    container.descr = { text: '' };
  } else {
    container.descr = { text: descr };
  }

  container.sprite = sprite;
  container.tags = tags;
  container.link = link;
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
    component.techn = { text: techn };
  }

  if (descr === undefined || descr === null) {
    component.descr = { text: '' };
  } else {
    component.descr = { text: descr };
  }

  component.sprite = sprite;
  component.tags = tags;
  component.link = link;
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
    boundary.type = { text: type };
  }

  boundary.tags = tags;
  boundary.link = link;
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
    boundary.type = { text: type };
  }

  boundary.tags = tags;
  boundary.link = link;
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
    boundary.type = { text: type };
  }

  if (descr === undefined || descr === null) {
    boundary.descr = { text: '' };
  } else {
    boundary.descr = { text: type };
  }

  boundary.tags = tags;
  boundary.link = link;
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

const setAccDescription = function (description_lex) {
  let sanitizedText = sanitizeText(description_lex, configApi.getConfig());
  description = sanitizedText;
};

const getAccDescription = function () {
  return description;
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
