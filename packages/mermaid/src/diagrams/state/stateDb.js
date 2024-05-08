import { log } from '../../logger.js';
import { generateId } from '../../utils.js';
import common from '../common/common.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';

import {
  DEFAULT_DIAGRAM_DIRECTION,
  STMT_STATE,
  STMT_RELATION,
  STMT_CLASSDEF,
  STMT_APPLYCLASS,
  DEFAULT_STATE_TYPE,
  DIVIDER_TYPE,
  G_EDGE_STYLE,
  G_EDGE_ARROWHEADSTYLE,
  G_EDGE_LABELPOS,
  G_EDGE_LABELTYPE,
  G_EDGE_THICKNESS,
  CSS_EDGE,
  DEFAULT_NESTED_DOC_DIR,
  SHAPE_DIVIDER,
  SHAPE_GROUP,
  CSS_DIAGRAM_CLUSTER,
  CSS_DIAGRAM_CLUSTER_ALT,
  CSS_DIAGRAM_STATE,
  SHAPE_STATE_WITH_DESC,
  SHAPE_STATE,
  SHAPE_START,
  SHAPE_END,
  SHAPE_NOTE,
  SHAPE_NOTEGROUP,
  CSS_DIAGRAM_NOTE,
  DOMID_TYPE_SPACER,
  DOMID_STATE,
  NOTE_ID,
  PARENT_ID,
  NOTE,
  PARENT,
  CSS_EDGE_NOTE_EDGE,
} from './stateCommon.js';
import { node } from 'stylis';

const START_NODE = '[*]';
const START_TYPE = 'start';
const END_NODE = START_NODE;
const END_TYPE = 'end';

const COLOR_KEYWORD = 'color';
const FILL_KEYWORD = 'fill';
const BG_FILL = 'bgFill';
const STYLECLASS_SEP = ',';

/**
 * Returns a new list of classes.
 * In the future, this can be replaced with a class common to all diagrams.
 * ClassDef information = { id: id, styles: [], textStyles: [] }
 *
 * @returns {{}}
 */
function newClassesList() {
  return {};
}

let direction = DEFAULT_DIAGRAM_DIRECTION;
let rootDoc = [];
let classes = newClassesList(); // style classes defined by a classDef

// --------------------------------------
// List of nodes created from the parsed diagram statement items
let nodeDb = {};

let graphItemCount = 0; // used to construct ids, etc.

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
      } else {
        // This is just a plain state, not a start or end
        node.id = node.id.trim();
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
 * This will push the statement into the list of statements for the current document.
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
          item.id.trim(),
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
        addStyleClass(item.id.trim(), item.classes);
        break;
      case STMT_APPLYCLASS:
        setCssClass(item.id.trim(), item.styleClass);
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
  const trimmedId = id?.trim();
  // add the state if needed
  if (currentDocument.states[trimmedId] === undefined) {
    log.info('Adding state ', trimmedId, descr);
    currentDocument.states[trimmedId] = {
      id: trimmedId,
      descriptions: [],
      type,
      doc,
      note,
      classes: [],
      styles: [],
      textStyles: [],
    };
  } else {
    if (!currentDocument.states[trimmedId].doc) {
      currentDocument.states[trimmedId].doc = doc;
    }
    if (!currentDocument.states[trimmedId].type) {
      currentDocument.states[trimmedId].type = type;
    }
  }

  if (descr) {
    log.info('Setting state description', trimmedId, descr);
    if (typeof descr === 'string') {
      addDescription(trimmedId, descr.trim());
    }

    if (typeof descr === 'object') {
      descr.forEach((des) => addDescription(trimmedId, des.trim()));
    }
  }

  if (note) {
    currentDocument.states[trimmedId].note = note;
    currentDocument.states[trimmedId].note.text = common.sanitizeText(
      currentDocument.states[trimmedId].note.text,
      getConfig()
    );
  }

  if (classes) {
    log.info('Setting state classes', trimmedId, classes);
    const classesList = typeof classes === 'string' ? [classes] : classes;
    classesList.forEach((cssClass) => setCssClass(trimmedId, cssClass.trim()));
  }

  if (styles) {
    log.info('Setting state styles', trimmedId, styles);
    const stylesList = typeof styles === 'string' ? [styles] : styles;
    stylesList.forEach((style) => setStyle(trimmedId, style.trim()));
  }

  if (textStyles) {
    log.info('Setting state styles', trimmedId, styles);
    const textStylesList = typeof textStyles === 'string' ? [textStyles] : textStyles;
    textStylesList.forEach((textStyle) => setTextStyle(trimmedId, textStyle.trim()));
  }
};

export const clear = function (saveCommon) {
  documents = {
    root: newDoc(),
  };
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
 * @returns {string} - the id (original or constructed)
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
 * @returns {string} - the id (original or constructed)
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
  let id1 = startIdIfNeeded(item1.id.trim());
  let type1 = startTypeIfNeeded(item1.id.trim(), item1.type);
  let id2 = startIdIfNeeded(item2.id.trim());
  let type2 = startTypeIfNeeded(item2.id.trim(), item2.type);

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
    relationTitle: common.sanitizeText(relationTitle, getConfig()),
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
    const id1 = startIdIfNeeded(item1.trim());
    const type1 = startTypeIfNeeded(item1);
    const id2 = endIdIfNeeded(item2.trim());
    const type2 = endTypeIfNeeded(item2);

    addState(id1, type1);
    addState(id2, type2);
    currentDocument.relations.push({
      id1,
      id2,
      title: common.sanitizeText(title, getConfig()),
    });
  }
};

export const addDescription = function (id, descr) {
  const theState = currentDocument.states[id];
  const _descr = descr.startsWith(':') ? descr.replace(':', '').trim() : descr;
  theState.descriptions.push(common.sanitizeText(_descr, getConfig()));
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
 * @param  {string | null} styleAttributes - the string with 1 or more style attributes (each separated by a comma)
 */
export const addStyleClass = function (id, styleAttributes = '') {
  // create a new style class object with this id
  if (classes[id] === undefined) {
    classes[id] = { id: id, styles: [], textStyles: [] }; // This is a classDef
  }
  const foundClass = classes[id];
  if (styleAttributes !== undefined && styleAttributes !== null) {
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
    if (foundState === undefined) {
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
  if (item !== undefined) {
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
  if (item !== undefined) {
    item.textStyles.push(cssClassName);
  }
};

const getDirection = () => direction;
const setDirection = (dir) => {
  direction = dir;
};

const trimColon = (str) => (str && str[0] === ':' ? str.substr(1).trim() : str.trim());

const dataFetcher = (parent, parsedItem, diagramStates, nodes, edges, altFlag, useRough) => {
  const itemId = parsedItem.id;
  const classStr = getClassesFromDbInfo(diagramStates[itemId]);

  if (itemId !== 'root') {
    let shape = SHAPE_STATE;
    if (parsedItem.start === true) {
      shape = SHAPE_START;
    }
    if (parsedItem.start === false) {
      shape = SHAPE_END;
    }
    if (parsedItem.type !== DEFAULT_STATE_TYPE) {
      shape = parsedItem.type;
    }

    // Add the node to our list (nodeDb)
    if (!nodeDb[itemId]) {
      nodeDb[itemId] = {
        id: itemId,
        shape,
        description: common.sanitizeText(itemId, getConfig()),
        classes: `${classStr} ${CSS_DIAGRAM_STATE}`,
      };
    }

    const newNode = nodeDb[itemId];
    console.log('New Node:', newNode);

    // Save data for description and group so that for instance a statement without description overwrites
    // one with description  @todo TODO What does this mean? If important, add a test for it

    // Build of the array of description strings
    if (parsedItem.description) {
      if (Array.isArray(newNode.description)) {
        // There already is an array of strings,add to it
        newNode.shape = SHAPE_STATE_WITH_DESC;
        newNode.description.push(parsedItem.description);
      } else {
        if (newNode.description?.length > 0) {
          // if there is a description already transform it to an array
          newNode.shape = SHAPE_STATE_WITH_DESC;
          if (newNode.description === itemId) {
            // If the previous description was this, remove it
            newNode.description = [parsedItem.description];
          } else {
            newNode.description = [newNode.description, parsedItem.description];
          }
        } else {
          newNode.shape = SHAPE_STATE;
          newNode.description = parsedItem.description;
        }
      }
      newNode.description = common.sanitizeTextOrArray(newNode.description, getConfig());
    }

    // If there's only 1 description entry, just use a regular state shape
    if (newNode.description?.length === 1 && newNode.shape === SHAPE_STATE_WITH_DESC) {
      newNode.shape = SHAPE_STATE;
    }

    // group
    if (!newNode.type && parsedItem.doc) {
      log.info('Setting cluster for ', itemId, getDir(parsedItem));
      newNode.type = 'group';
      newNode.dir = getDir(parsedItem);
      newNode.shape = parsedItem.type === DIVIDER_TYPE ? SHAPE_DIVIDER : SHAPE_GROUP;
      newNode.classes =
        newNode.classes +
        ' ' +
        CSS_DIAGRAM_CLUSTER +
        ' ' +
        (altFlag ? CSS_DIAGRAM_CLUSTER_ALT : '');
    }

    // This is what will be added to the graph
    const nodeData = {
      labelStyle: '',
      shape: newNode.shape,
      labelText: newNode.description,
      classes: newNode.classes,
      style: '',
      id: itemId,
      dir: newNode.dir,
      domId: stateDomId(itemId, graphItemCount),
      type: newNode.type,
      padding: 15,
      rx: 10,
      ry: 10,
      useRough,
    };

    if (parent && parent.id !== 'root') {
      log.trace('Setting node ', itemId, ' to be child of its parent ', parent.id);
      nodeData.parentId = parent.id;
    }

    nodeData.centerLabel = true;

    if (parsedItem.note) {
      // Todo: set random id
      const noteData = {
        labelStyle: '',
        shape: SHAPE_NOTE,
        labelText: parsedItem.note.text,
        classes: CSS_DIAGRAM_NOTE,
        // useHtmlLabels: false,
        style: '', // styles.style,
        id: itemId + NOTE_ID + '-' + graphItemCount,
        domId: stateDomId(itemId, graphItemCount, NOTE),
        type: newNode.type,
        padding: 15, //getConfig().flowchart.padding
      };
      const groupData = {
        labelStyle: '',
        shape: SHAPE_NOTEGROUP,
        labelText: parsedItem.note.text,
        classes: newNode.classes,
        style: '', // styles.style,
        id: itemId + PARENT_ID,
        domId: stateDomId(itemId, graphItemCount, PARENT),
        type: 'group',
        padding: 0, //getConfig().flowchart.padding
      };
      graphItemCount++;

      const parentNodeId = itemId + PARENT_ID;

      //add parent id to groupData
      groupData.id = parentNodeId;
      //add parent id to noteData
      noteData.parentId = parentNodeId;

      //insert groupData
      insertOrUpdateNode(nodes, groupData);
      //insert noteData
      insertOrUpdateNode(nodes, noteData);
      //insert nodeData
      insertOrUpdateNode(nodes, nodeData);

      let from = itemId;
      let to = noteData.id;

      if (parsedItem.note.position === 'left of') {
        from = noteData.id;
        to = itemId;
      }

      edges.push({
        id: from + '-' + to,
        start: from,
        end: to,
        arrowhead: 'none',
        arrowTypeEnd: '',
        style: G_EDGE_STYLE,
        labelStyle: '',
        classes: CSS_EDGE_NOTE_EDGE,
        arrowheadStyle: G_EDGE_ARROWHEADSTYLE,
        labelpos: G_EDGE_LABELPOS,
        labelType: G_EDGE_LABELTYPE,
        thickness: G_EDGE_THICKNESS,
        useRough,
      });
    } else {
      insertOrUpdateNode(nodes, nodeData);
    }

    console.log('Nodes:', nodes);
  }
  if (parsedItem.doc) {
    log.trace('Adding nodes children ');
    setupDoc(parsedItem, parsedItem.doc, diagramStates, nodes, edges, !altFlag, useRough);
  }
};

/**
 *
 * @param nodes
 * @param nodeData
 */
function insertOrUpdateNode(nodes, nodeData) {
  if (!nodeData.id || nodeData.id === '</join></fork>' || nodeData.id === '</choice>') {
    return;
  }
  const existingNodeData = nodes.find((node) => node.id === nodeData.id);
  if (existingNodeData) {
    //update the existing nodeData
    Object.assign(existingNodeData, nodeData);
  } else {
    nodes.push(nodeData);
  }
}

/**
 * Create a standard string for the dom ID of an item.
 * If a type is given, insert that before the counter, preceded by the type spacer
 *
 * @param itemId
 * @param counter
 * @param {string | null} type
 * @param typeSpacer
 * @returns {string}
 */
export function stateDomId(itemId = '', counter = 0, type = '', typeSpacer = DOMID_TYPE_SPACER) {
  const typeStr = type !== null && type.length > 0 ? `${typeSpacer}${type}` : '';
  return `${DOMID_STATE}-${itemId}${typeStr}-${counter}`;
}

const setupDoc = (parentParsedItem, doc, diagramStates, nodes, edges, altFlag, useRough) => {
  // graphItemCount = 0;
  log.trace('items', doc);
  doc.forEach((item) => {
    switch (item.stmt) {
      case STMT_STATE:
        dataFetcher(parentParsedItem, item, diagramStates, nodes, edges, altFlag, useRough);
        break;
      case DEFAULT_STATE_TYPE:
        dataFetcher(parentParsedItem, item, diagramStates, nodes, edges, altFlag, useRough);
        break;
      case STMT_RELATION:
        {
          dataFetcher(
            parentParsedItem,
            item.state1,
            diagramStates,
            nodes,
            edges,
            altFlag,
            useRough
          );
          dataFetcher(
            parentParsedItem,
            item.state2,
            diagramStates,
            nodes,
            edges,
            altFlag,
            useRough
          );
          const edgeData = {
            id: 'edge' + graphItemCount,
            start: item.state1.id,
            end: item.state2.id,
            arrowhead: 'normal',
            arrowTypeEnd: 'arrow_barb',
            style: G_EDGE_STYLE,
            labelStyle: '',
            label: common.sanitizeText(item.description, getConfig()),
            arrowheadStyle: G_EDGE_ARROWHEADSTYLE,
            labelpos: G_EDGE_LABELPOS,
            labelType: G_EDGE_LABELTYPE,
            thickness: G_EDGE_THICKNESS,
            classes: CSS_EDGE,
            useRough,
          };
          edges.push(edgeData);
          //g.setEdge(item.state1.id, item.state2.id, edgeData, graphItemCount);
          graphItemCount++;
        }
        break;
    }
  });
};

export const getData = () => {
  const nodes = [];
  const edges = [];

  // for (const key in currentDocument.states) {
  //   if (currentDocument.states.hasOwnProperty(key)) {
  //     nodes.push({...currentDocument.states[key]});
  //   }
  // }
  extract(getRootDocV2());
  const diagramStates = getStates();

  console.log('Config - DAGA', getConfig());

  const useRough = getConfig().handdrawn;
  dataFetcher(undefined, getRootDocV2(), diagramStates, nodes, edges, true, useRough);

  return { nodes, edges, other: {} };
};

/**
 * Get the direction from the statement items.
 * Look through all of the documents (docs) in the parsedItems
 * Because is a _document_ direction, the default direction is not necessarily the same as the overall default _diagram_ direction.
 * @param {object[]} parsedItem - the parsed statement item to look through
 * @param [defaultDir] - the direction to use if none is found
 * @returns {string}
 */
const getDir = (parsedItem, defaultDir = DEFAULT_NESTED_DOC_DIR) => {
  let dir = defaultDir;
  if (parsedItem.doc) {
    for (let i = 0; i < parsedItem.doc.length; i++) {
      const parsedItemDoc = parsedItem.doc[i];
      if (parsedItemDoc.stmt === 'dir') {
        dir = parsedItemDoc.value;
      }
    }
  }
  return dir;
};

/**
 * Get classes from the db for the info item.
 * If there aren't any or if dbInfoItem isn't defined, return an empty string.
 * Else create 1 string from the list of classes found
 *
 * @param {undefined | null | object} dbInfoItem
 * @returns {string}
 */
function getClassesFromDbInfo(dbInfoItem) {
  if (dbInfoItem === undefined || dbInfoItem === null) {
    return '';
  } else {
    if (dbInfoItem.classes) {
      return dbInfoItem.classes.join(' ');
    } else {
      return '';
    }
  }
}

export default {
  getConfig: () => getConfig().state,
  getData,
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
  setDiagramTitle,
  getDiagramTitle,
};
