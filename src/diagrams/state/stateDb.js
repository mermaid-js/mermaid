import { log } from '../../logger';
import { generateId } from '../../utils';
import mermaidAPI from '../../mermaidAPI';
import * as configApi from '../../config';

const clone = (o) => JSON.parse(JSON.stringify(o));

let rootDoc = [];

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
  if (node.stmt === 'relation') {
    docTranslator(parent, node.state1, true);
    docTranslator(parent, node.state2, false);
  } else {
    if (node.stmt === 'state') {
      if (node.id === '[*]') {
        node.id = first ? parent.id + '_start' : parent.id + '_end';
        node.start = first;
      }
    }

    if (node.doc) {
      const doc = [];
      // Check for concurrency
      let i = 0;
      let currentDoc = [];
      for (i = 0; i < node.doc.length; i++) {
        if (node.doc[i].type === 'divider') {
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
          stmt: 'state',
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
  clear();

  log.info('Extract', doc);

  doc.forEach((item) => {
    if (item.stmt === 'state') {
      addState(item.id, item.type, item.doc, item.description, item.note);
    }
    if (item.stmt === 'relation') {
      addRelation(item.state1.id, item.state2.id, item.description);
    }
  });
};

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

let startCnt = 0;
let endCnt = 0; // eslint-disable-line
// let stateCnt = 0;

/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @param text
 * @param type
 * @param style
 */
export const addState = function (id, type, doc, descr, note) {
  if (typeof currentDocument.states[id] === 'undefined') {
    currentDocument.states[id] = {
      id: id,
      descriptions: [],
      type,
      doc,
      note,
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
    log.info('Adding state ', id, descr);
    if (typeof descr === 'string') addDescription(id, descr.trim());

    if (typeof descr === 'object') {
      descr.forEach((des) => addDescription(id, des.trim()));
    }
  }

  if (note) currentDocument.states[id].note = note;
};

export const clear = function () {
  documents = {
    root: newDoc(),
  };
  currentDocument = documents.root;

  currentDocument = documents.root;

  startCnt = 0;
  endCnt = 0; // eslint-disable-line
  classes = [];
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

export const addRelation = function (_id1, _id2, title) {
  let id1 = _id1;
  let id2 = _id2;
  let type1 = 'default';
  let type2 = 'default';
  if (_id1 === '[*]') {
    startCnt++;
    id1 = 'start' + startCnt;
    type1 = 'start';
  }
  if (_id2 === '[*]') {
    endCnt++;
    id2 = 'end' + startCnt;
    type2 = 'end';
  }
  addState(id1, type1);
  addState(id2, type2);
  currentDocument.relations.push({ id1, id2, title: title });
};

const addDescription = function (id, _descr) {
  const theState = currentDocument.states[id];
  let descr = _descr;
  if (descr[0] === ':') {
    descr = descr.substr(1).trim();
  }

  theState.descriptions.push(descr);
};

export const cleanupLabel = function (label) {
  if (label.substring(0, 1) === ':') {
    return label.substr(2).trim();
  } else {
    return label.trim();
  }
};

export const lineType = {
  LINE: 0,
  DOTTED_LINE: 1,
};

let dividerCnt = 0;
const getDividerId = () => {
  dividerCnt++;
  return 'divider-id-' + dividerCnt;
};

let classes = [];

const getClasses = () => classes;

let direction = 'TB';
const getDirection = () => direction;
const setDirection = (dir) => {
  direction = dir;
};

export const relationType = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3,
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
  // addDescription,
  cleanupLabel,
  lineType,
  relationType,
  logDocuments,
  getRootDoc,
  setRootDoc,
  getRootDocV2,
  extract,
  trimColon,
};
