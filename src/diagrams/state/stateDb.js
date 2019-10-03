import { logger } from '../../logger';

let rootDoc = [];
const setRootDoc = o => {
  console.warn('Setting root doc', o);
  rootDoc = o;
};

const getRootDoc = () => rootDoc;

const extract = doc => {
  const res = { states: [], relations: [] };
  clear();
  doc.forEach(item => {
    if (item.stmt === 'state') {
      // if (item.doc) {
      //   addState(item.id, 'composit');
      //   addDocument(item.id);
      //   extract(item.doc);
      //   currentDocument = currentDocument.parent;
      // } else {
      addState(item.id, item.type, item.doc);
      // }
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
    documents: {}
  };
};

let documents = {
  root: newDoc()
};

let currentDocument = documents.root;

let startCnt = 0;
let endCnt = 0;

/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @param text
 * @param type
 * @param style
 */
export const addState = function(id, type, doc) {
  console.warn('Add state', id);
  if (typeof currentDocument.states[id] === 'undefined') {
    currentDocument.states[id] = {
      id: id,
      descriptions: [],
      type,
      doc
    };
  } else {
    if (!currentDocument.states[id].doc) {
      currentDocument.states[id].doc = doc;
    }
    if (!currentDocument.states[id].type) {
      currentDocument.states[id].type = type;
    }
  }
};

export const clear = function() {
  documents = {
    root: newDoc()
  };
  currentDocument = documents.root;
};

export const getState = function(id) {
  return currentDocument.states[id];
};
export const addDocument = id => {
  console.warn(currentDocument, documents);
  currentDocument.documents[id] = newDoc();
  currentDocument.documents[id].parent = currentDocument;
  currentDocument = currentDocument.documents[id];
};
export const getStates = function() {
  return currentDocument.states;
};
export const logDocuments = function() {
  console.warn('Documents = ', documents);
};
export const getRelations = function() {
  // const relations1 = [{ id1: 'start1', id2: 'state1' }, { id1: 'state1', id2: 'exit1' }];
  // return relations;
  return currentDocument.relations;
};

export const addRelation = function(_id1, _id2, title) {
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
  console.log(id1, id2, title);
  addState(id1, type1);
  addState(id2, type2);
  currentDocument.relations.push({ id1, id2, title });
};

export const addDescription = function(id, _descr) {
  const theState = currentDocument.states[id];
  let descr = _descr;
  if (descr[0] === ':') {
    descr = descr.substr(1).trim();
  }

  theState.descriptions.push(descr);
};

export const cleanupLabel = function(label) {
  if (label.substring(0, 1) === ':') {
    return label.substr(2).trim();
  } else {
    return label.trim();
  }
};

export const lineType = {
  LINE: 0,
  DOTTED_LINE: 1
};

export const relationType = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3
};

export default {
  addState,
  clear,
  getState,
  getStates,
  getRelations,
  addRelation,
  addDescription,
  cleanupLabel,
  lineType,
  relationType,
  logDocuments,
  addDocument,
  getRootDoc,
  setRootDoc,
  extract
};
