import { log } from '../../logger';
import { generateId } from '../../utils';
import mermaidAPI from '../../mermaidAPI';
import common from '../common/common';
import * as configApi from '../../config';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../../commonDb';

import {
  DEFAULT_DIAGRAM_DIRECTION,
  STMT_STATE,
  STMT_RELATION,
  STMT_CLASSDEF,
  STMT_APPLYCLASS,
  DEFAULT_STATE_TYPE,
  DIVIDER_TYPE,
} from './stateCommon';

const START_NODE = '[*]';
const START_TYPE = 'start';
const END_NODE = START_NODE;
const END_TYPE = 'end';

const COLOR_KEYWORD = 'color';
const FILL_KEYWORD = 'fill';
const BG_FILL = 'bgFill';
const STYLECLASS_SEP = ',';

// Returns a new list of classes.
// In the future, this can be replaced with a class common to all diagrams.
function newClassesList() {
  return {};
}

let direction = DEFAULT_DIAGRAM_DIRECTION;
let rootDoc = [];
let classes = newClassesList(); // style classes defined by a classDef

const newDoc = () => {
  return {
    relations: [],
    states: {},
    documents: {},
  };
};
let documents = {
  root: newDoc(),
};

let currentDocument = documents.root;
let startEndCount = 0;
let dividerCnt = 0;

export const lineType = {
  LINE: 0,
  DOTTED_LINE: 1,
};

export const relationType = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3,
};

const clone = (o) => JSON.parse(JSON.stringify(o));

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

const setRootDoc = (o) => {
  log.info('Setting root doc', o);
  // rootDoc = { id: 'root', doc: o };
  rootDoc = o;
};

const getRootDoc = () => rootDoc;

const docTranslator = (parent, node, first) => {
  if (node.stmt === STMT_RELATION) {
    docTranslator(parent, node.state1, true);
    docTranslator(parent, node.state2, false);
  } else {
    if (node.stmt === STMT_STATE) {
      if (node.id === '[*]') {
        node.id = first ? parent.id + '_start' : parent.id + '_end';
        node.start = first;
      }
    }

    if (node.doc) {
      const doc = [];
      // Check for concurrency
      let currentDoc = [];
      let i;
      for (i = 0; i < node.doc.length; i++) {
        if (node.doc[i].type === DIVIDER_TYPE) {
          // debugger;
          const newNode = clone(node.doc[i]);
          newNode.doc = clone(currentDoc);
          doc.push(newNode);
          currentDoc = [];
        } else {
          currentDoc.push(node.doc[i]);
        }
      }

      // If any divider was encountered
      if (doc.length > 0 && currentDoc.length > 0) {
        const newNode = {
          stmt: STMT_STATE,
          id: generateId(),
          type: 'divider',
          doc: clone(currentDoc),
        };
        doc.push(clone(newNode));
        node.doc = doc;
      }

      node.doc.forEach((docNode) => docTranslator(node, docNode, true));
    }
  }
};
const getRootDocV2 = () => {
  docTranslator({ id: 'root' }, { id: 'root', doc: rootDoc }, true);
  return { id: 'root', doc: rootDoc };
  // Here
};

/**
 * Convert all of the statements (stmts) that were parsed into states and relationships.
 * This is done because a state diagram may have nested sections,
 * where each section is a 'document' and has its own set of statements.
 * Ex: the section within a fork has its own statements, and incoming and outgoing statements
 * refer to the fork as a whole (document).
 * See the parser grammar:  the definition of a document is a document then a 'line', where a line can be a statement.
 * This will push the statement into the the list of statements for the current document.
 *
 * @param _doc
 */
const extract = (_doc) => {
  // const res = { states: [], relations: [] };
  let doc;
  if (_doc.doc) {
    doc = _doc.doc;
  } else {
    doc = _doc;
  }
  // let doc = root.doc;
  // if (!doc) {
  //   doc = root;
  // }
  log.info(doc);
  clear(true);

  log.info('Extract', doc);

  doc.forEach((item) => {
    switch (item.stmt) {
      case STMT_STATE:
        addState(
          item.id,
          item.type,
          item.doc,
          item.description,
          item.note,
          item.classes,
          item.styles,
          item.textStyles
        );
        break;
      case STMT_RELATION:
        addRelation(item.state1, item.state2, item.description);
        break;
      case STMT_CLASSDEF:
        addStyleClass(item.id, item.classes);
        break;
      case STMT_APPLYCLASS:
        setCssClass(item.id, item.styleClass);
        break;
    }
  });
};

/**
 * Function called by parser when a node definition has been found.
 *
 * @param {null | string} id
 * @param {null | string} type
 * @param {null | string} doc
 * @param {null | string | string[]} descr - description for the state. Can be a string or a list or strings
 * @param {null | string} note
 * @param {null | string | string[]} classes - class styles to apply to this state. Can be a string (1 style) or an array of styles. If it's just 1 class, convert it to an array of that 1 class.
 * @param {null | string | string[]} styles - styles to apply to this state. Can be a string (1 style) or an array of styles. If it's just 1 style, convert it to an array of that 1 style.
 * @param {null | string | string[]} textStyles - text styles to apply to this state. Can be a string (1 text test) or an array of text styles. If it's just 1 text style, convert it to an array of that 1 text style.
 */
export const addState = function (
  id,
  type = DEFAULT_STATE_TYPE,
  doc = null,
  descr = null,
  note = null,
  classes = null,
  styles = null,
  textStyles = null
) {
  // add the state if needed
  if (typeof currentDocument.states[id] === 'undefined') {
    log.info('Adding state ', id, descr);
    currentDocument.states[id] = {
      id: id,
      descriptions: [],
      type,
      doc,
      note,
      classes: [],
      styles: [],
      textStyles: [],
    };
  } else {
    if (!currentDocument.states[id].doc) {
      currentDocument.states[id].doc = doc;
    }
    if (!currentDocument.states[id].type) {
      currentDocument.states[id].type = type;
    }
  }

  if (descr) {
    log.info('Setting state description', id, descr);
    if (typeof descr === 'string') {
      addDescription(id, descr.trim());
    }

    if (typeof descr === 'object') {
      descr.forEach((des) => addDescription(id, des.trim()));
    }
  }

  if (note) {
    currentDocument.states[id].note = note;
    currentDocument.states[id].note.text = common.sanitizeText(
      currentDocument.states[id].note.text,
      configApi.getConfig()
    );
  }

  if (classes) {
    log.info('Setting state classes', id, classes);
    const classesList = typeof classes === 'string' ? [classes] : classes;
    classesList.forEach((klass) => setCssClass(id, klass.trim()));
  }

  if (styles) {
    log.info('Setting state styles', id, styles);
    const stylesList = typeof styles === 'string' ? [styles] : styles;
    stylesList.forEach((style) => setStyle(id, style.trim()));
  }

  if (textStyles) {
    log.info('Setting state styles', id, styles);
    const textStylesList = typeof textStyles === 'string' ? [textStyles] : textStyles;
    textStylesList.forEach((textStyle) => setTextStyle(id, textStyle.trim()));
  }
};

export const clear = function (saveCommon) {
  documents = {
    root: newDoc(),
  };
  currentDocument = documents.root;

  currentDocument = documents.root;

  // number of start and end nodes; used to construct ids
  startEndCount = 0;
  classes = newClassesList();
  if (!saveCommon) {
    commonClear();
  }
};

export const getState = function (id) {
  return currentDocument.states[id];
};

export const getStates = function () {
  return currentDocument.states;
};
export const logDocuments = function () {
  log.info('Documents = ', documents);
};
export const getRelations = function () {
  return currentDocument.relations;
};

/**
 * If the id is a start node ( [*] ), then return a new id constructed from
 * the start node name and the current start node count.
 * else return the given id
 *
 * @param {string} id
 * @returns {{id: string, type: string}} - the id and type that should be used
 */
function startIdIfNeeded(id = '') {
  let fixedId = id;
  if (id === START_NODE) {
    startEndCount++;
    fixedId = `${START_TYPE}${startEndCount}`;
  }
  return fixedId;
}

/**
 * If the id is a start node ( [*] ), then return the start type ('start')
 * else return the given type
 *
 * @param {string} id
 * @param {string} type
 * @returns {string} - the type that should be used
 */
function startTypeIfNeeded(id = '', type = DEFAULT_STATE_TYPE) {
  return id === START_NODE ? START_TYPE : type;
}

/**
 * If the id is an end node ( [*] ), then return a new id constructed from
 * the end node name and the current start_end node count.
 * else return the given id
 *
 * @param {string} id
 * @returns {{id: string, type: string}} - the id and type that should be used
 */
function endIdIfNeeded(id = '') {
  let fixedId = id;
  if (id === END_NODE) {
    startEndCount++;
    fixedId = `${END_TYPE}${startEndCount}`;
  }
  return fixedId;
}

/**
 * If the id is an end node ( [*] ), then return the end type
 * else return the given type
 *
 * @param {string} id
 * @param {string} type
 * @returns {string} - the type that should be used
 */
function endTypeIfNeeded(id = '', type = DEFAULT_STATE_TYPE) {
  return id === END_NODE ? END_TYPE : type;
}

/**
 *
 * @param item1
 * @param item2
 * @param relationTitle
 */
export function addRelationObjs(item1, item2, relationTitle) {
  let id1 = startIdIfNeeded(item1.id);
  let type1 = startTypeIfNeeded(item1.id, item1.type);
  let id2 = startIdIfNeeded(item2.id);
  let type2 = startTypeIfNeeded(item2.id, item2.type);

  addState(
    id1,
    type1,
    item1.doc,
    item1.description,
    item1.note,
    item1.classes,
    item1.styles,
    item1.textStyles
  );
  addState(
    id2,
    type2,
    item2.doc,
    item2.description,
    item2.note,
    item2.classes,
    item2.styles,
    item2.textStyles
  );

  currentDocument.relations.push({
    id1,
    id2,
    relationTitle: common.sanitizeText(relationTitle, configApi.getConfig()),
  });
}

/**
 * Add a relation between two items.  The items may be full objects or just the string id of a state.
 *
 * @param {string | object} item1
 * @param {string | object} item2
 * @param {string} title
 */
export const addRelation = function (item1, item2, title) {
  if (typeof item1 === 'object') {
    addRelationObjs(item1, item2, title);
  } else {
    const id1 = startIdIfNeeded(item1);
    const type1 = startTypeIfNeeded(item1);
    const id2 = endIdIfNeeded(item2);
    const type2 = endTypeIfNeeded(item2);

    addState(id1, type1);
    addState(id2, type2);
    currentDocument.relations.push({
      id1,
      id2,
      title: common.sanitizeText(title, configApi.getConfig()),
    });
  }
};

export const addDescription = function (id, descr) {
  const theState = currentDocument.states[id];
  const _descr = descr.startsWith(':') ? descr.replace(':', '').trim() : descr;
  theState.descriptions.push(common.sanitizeText(_descr, configApi.getConfig()));
};

export const cleanupLabel = function (label) {
  if (label.substring(0, 1) === ':') {
    return label.substr(2).trim();
  } else {
    return label.trim();
  }
};

const getDividerId = () => {
  dividerCnt++;
  return 'divider-id-' + dividerCnt;
};

/**
 * Called when the parser comes across a (style) class definition
 * @example classDef my-style fill:#f96;
 *
 * @param {string} id - the id of this (style) class
 * @param  {string} styleAttributes - the string with 1 or more style attributes (each separated by a comma)
 */
export const addStyleClass = function (id, styleAttributes = '') {
  // create a new style class object with this id
  if (typeof classes[id] === 'undefined') {
    classes[id] = { id: id, styles: [], textStyles: [] };
  }
  const foundClass = classes[id];
  if (typeof styleAttributes !== 'undefined') {
    if (styleAttributes !== null) {
      styleAttributes.split(STYLECLASS_SEP).forEach((attrib) => {
        // remove any trailing ;
        const fixedAttrib = attrib.replace(/([^;]*);/, '$1').trim();

        // replace some style keywords
        if (attrib.match(COLOR_KEYWORD)) {
          const newStyle1 = fixedAttrib.replace(FILL_KEYWORD, BG_FILL);
          const newStyle2 = newStyle1.replace(COLOR_KEYWORD, FILL_KEYWORD);
          foundClass.textStyles.push(newStyle2);
        }
        foundClass.styles.push(fixedAttrib);
      });
    }
  }
};

/**
 * Return all of the style classes
 * @returns {{} | any | classes}
 */
export const getClasses = function () {
  return classes;
};

/**
 * Add a (style) class or css class to a state with the given id.
 * If the state isn't already in the list of known states, add it.
 * Might be called by parser when a style class or CSS class should be applied to a state
 *
 * @param {string | string[]} itemIds The id or a list of ids of the item(s) to apply the css class to
 * @param {string} cssClassName CSS class name
 */
export const setCssClass = function (itemIds, cssClassName) {
  itemIds.split(',').forEach(function (id) {
    let foundState = getState(id);
    if (typeof foundState === 'undefined') {
      const trimmedId = id.trim();
      addState(trimmedId);
      foundState = getState(trimmedId);
    }
    foundState.classes.push(cssClassName);
  });
};

/**
 * Add a style to a state with the given id.
 * @example style stateId fill:#f9f,stroke:#333,stroke-width:4px
 *   where 'style' is the keyword
 *   stateId is the id of a state
 *   the rest of the string is the styleText (all of the attributes to be applied to the state)
 *
 * @param itemId The id of item to apply the style to
 * @param styleText - the text of the attributes for the style
 */
export const setStyle = function (itemId, styleText) {
  const item = getState(itemId);
  if (typeof item !== 'undefined') {
    item.textStyles.push(styleText);
  }
};

/**
 * Add a text style to a state with the given id
 *
 * @param itemId The id of item to apply the css class to
 * @param cssClassName CSS class name
 */
export const setTextStyle = function (itemId, cssClassName) {
  const item = getState(itemId);
  if (typeof item !== 'undefined') {
    item.textStyles.push(cssClassName);
  }
};

const getDirection = () => direction;
const setDirection = (dir) => {
  direction = dir;
};

const trimColon = (str) => (str && str[0] === ':' ? str.substr(1).trim() : str.trim());

export default {
  parseDirective,
  getConfig: () => configApi.getConfig().state,
  addState,
  clear,
  getState,
  getStates,
  getRelations,
  getClasses,
  getDirection,
  addRelation,
  getDividerId,
  setDirection,
  cleanupLabel,
  lineType,
  relationType,
  logDocuments,
  getRootDoc,
  setRootDoc,
  getRootDocV2,
  extract,
  trimColon,
  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
  addStyleClass,
  setCssClass,
  addDescription,
};
