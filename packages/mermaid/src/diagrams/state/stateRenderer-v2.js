import graphlib from 'graphlib';
import { select } from 'd3';
import { getConfig } from '../../config';
import { render } from '../../dagre-wrapper/index.js';
import { log } from '../../logger';
import { configureSvgSize } from '../../setupGraphViewbox';
import common from '../common/common';
import addSVGAccessibilityFields from '../../accessibility';
import {
  DEFAULT_DIAGRAM_DIRECTION,
  DEFAULT_NESTED_DOC_DIR,
  STMT_STATE,
  STMT_RELATION,
  DEFAULT_STATE_TYPE,
  DIVIDER_TYPE,
} from './stateCommon';

// --------------------------------------
// Shapes
const SHAPE_STATE = 'rect';
const SHAPE_STATE_WITH_DESC = 'rectWithTitle';
const SHAPE_START = 'start';
const SHAPE_END = 'end';
const SHAPE_DIVIDER = 'divider';
const SHAPE_GROUP = 'roundedWithTitle';
const SHAPE_NOTE = 'note';
const SHAPE_NOTEGROUP = 'noteGroup';

// --------------------------------------
// CSS classes
const CSS_DIAGRAM = 'statediagram';
const CSS_STATE = 'state';
const CSS_DIAGRAM_STATE = `${CSS_DIAGRAM}-${CSS_STATE}`;
const CSS_EDGE = 'transition';
const CSS_NOTE = 'note';
const CSS_NOTE_EDGE = 'note-edge';
const CSS_EDGE_NOTE_EDGE = `${CSS_EDGE} ${CSS_NOTE_EDGE}`;
const CSS_DIAGRAM_NOTE = `${CSS_DIAGRAM}-${CSS_NOTE}`;
const CSS_CLUSTER = 'cluster';
const CSS_DIAGRAM_CLUSTER = `${CSS_DIAGRAM}-${CSS_CLUSTER}`;
const CSS_CLUSTER_ALT = 'cluster-alt';
const CSS_DIAGRAM_CLUSTER_ALT = `${CSS_DIAGRAM}-${CSS_CLUSTER_ALT}`;

// --------------------------------------
// DOM and element IDs
const PARENT = 'parent';
const NOTE = 'note';
const DOMID_STATE = 'state';
const DOMID_TYPE_SPACER = '----';
const NOTE_ID = `${DOMID_TYPE_SPACER}${NOTE}`;
const PARENT_ID = `${DOMID_TYPE_SPACER}${PARENT}`;
// --------------------------------------
// Graph edge settings
const G_EDGE_STYLE = 'fill:none';
const G_EDGE_ARROWHEADSTYLE = 'fill: #333';
const G_EDGE_LABELPOS = 'c';
const G_EDGE_LABELTYPE = 'text';
const G_EDGE_THICKNESS = 'normal';

// --------------------------------------
// When information is parsed and processed (extracted) by stateDb.extract()
// These are globals so the information can be accessed as needed (e.g. in setUpNode, etc.)
let diagramStates = [];
let diagramClasses = [];

// List of nodes created from the parsed diagram statement items
let nodeDb = {};

let graphItemCount = 0; // used to construct ids, etc.

// Configuration
const conf = {};

// -----------------------------------------------------------------------

export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (let i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};

/**
 * Returns the all the styles from classDef statements in the graph definition.
 *
 * @param {string} text - the diagram text to be parsed
 * @param {Diagram} diagramObj
 * @returns {object} ClassDef styles
 */
export const getClasses = function (text, diagramObj) {
  log.trace('Extracting classes');
  if (diagramClasses.length > 0) return diagramClasses; // we have already extracted the classes

  diagramObj.db.clear();
  try {
    // Parse the graph definition
    diagramObj.parser.parse(text);
    // must run extract() to turn the parsed statements into states, relationships, classes, etc.
    diagramObj.db.extract(diagramObj.db.getRootDocV2());

    return diagramObj.db.getClasses();
  } catch (e) {
    return e;
  }
};

/**
 * Get classes from the db info item.
 * If there aren't any or if dbInfoItem isn't defined, return an empty string.
 * Else create 1 string from the list of classes found
 *
 * @param {undefined | null | object} dbInfoItem
 * @returns {string}
 */
function getClassesFromDbInfo(dbInfoItem) {
  if (typeof dbInfoItem === 'undefined' || dbInfoItem === null) return '';
  else {
    if (dbInfoItem.classes) {
      return dbInfoItem.classes.join(' ');
    } else return '';
  }
}

/**
 * Create a standard string for the dom ID of an item.
 * If a type is given, insert that before the counter, preceded by the type spacer
 *
 * @param itemId
 * @param counter
 * @param type
 * @param typeSpacer
 * @returns {string}
 */
export function stateDomId(itemId = '', counter = 0, type = '', typeSpacer = DOMID_TYPE_SPACER) {
  const typeStr = type !== null && type.length > 0 ? `${typeSpacer}${type}` : '';
  return `${DOMID_STATE}-${itemId}${typeStr}-${counter}`;
}

/**
 * Create a graph node based on the statement information
 *
 * @param g - graph
 * @param {object} parent
 * @param {object} parsedItem - parsed statement item
 * @param {object} diagramDb
 * @param {boolean} altFlag - for clusters, add the "statediagram-cluster-alt" CSS class
 */
const setupNode = (g, parent, parsedItem, diagramDb, altFlag) => {
  const itemId = parsedItem.id;
  const classStr = getClassesFromDbInfo(diagramStates[itemId]);

  if (itemId !== 'root') {
    let shape = SHAPE_STATE;
    if (parsedItem.start === true) shape = SHAPE_START;
    if (parsedItem.start === false) shape = SHAPE_END;
    if (parsedItem.type !== DEFAULT_STATE_TYPE) shape = parsedItem.type;

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

    // Save data for description and group so that for instance a statement without description overwrites
    // one with description  @todo TODO What does this mean? If important, add a test for it

    // Build of the array of description strings
    if (parsedItem.description) {
      if (Array.isArray(newNode.description)) {
        // There already is an array of strings,add to it
        newNode.shape = SHAPE_STATE_WITH_DESC;
        newNode.description.push(parsedItem.description);
      } else {
        if (newNode.description.length > 0) {
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
    if (newNode.description.length === 1 && newNode.shape === SHAPE_STATE_WITH_DESC) {
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
      // typeof newNode.description === 'object'
      //   ? newNode.description[0]
      //   : newNode.description,
      classes: newNode.classes,
      style: '', //styles.style,
      id: itemId,
      dir: newNode.dir,
      domId: stateDomId(itemId, graphItemCount),
      type: newNode.type,
      padding: 15, //getConfig().flowchart.padding
    };

    if (parsedItem.note) {
      // Todo: set random id
      const noteData = {
        labelStyle: '',
        shape: SHAPE_NOTE,
        labelText: parsedItem.note.text,
        classes: CSS_DIAGRAM_NOTE,
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
      g.setNode(parentNodeId, groupData);

      g.setNode(noteData.id, noteData);
      g.setNode(itemId, nodeData);

      g.setParent(itemId, parentNodeId);
      g.setParent(noteData.id, parentNodeId);

      let from = itemId;
      let to = noteData.id;

      if (parsedItem.note.position === 'left of') {
        from = noteData.id;
        to = itemId;
      }
      g.setEdge(from, to, {
        arrowhead: 'none',
        arrowType: '',
        style: G_EDGE_STYLE,
        labelStyle: '',
        classes: CSS_EDGE_NOTE_EDGE,
        arrowheadStyle: G_EDGE_ARROWHEADSTYLE,
        labelpos: G_EDGE_LABELPOS,
        labelType: G_EDGE_LABELTYPE,
        thickness: G_EDGE_THICKNESS,
      });
    } else {
      g.setNode(itemId, nodeData);
    }
  }

  if (parent) {
    if (parent.id !== 'root') {
      log.trace('Setting node ', itemId, ' to be child of its parent ', parent.id);
      g.setParent(itemId, parent.id);
    }
  }
  if (parsedItem.doc) {
    log.trace('Adding nodes children ');
    setupDoc(g, parsedItem, parsedItem.doc, diagramDb, !altFlag);
  }
};

/**
 * Turn parsed statements (item.stmt) into nodes, relationships, etc. for a document.
 * (A document may be nested within others.)
 *
 * @param g
 * @param parentParsedItem - parsed Item that is the parent of this document (doc)
 * @param doc - the document to set up
 * @param diagramDb
 * @param altFlag
 * @todo This duplicates some of what is done in stateDb.js extract method
 */
const setupDoc = (g, parentParsedItem, doc, diagramDb, altFlag) => {
  // graphItemCount = 0;
  log.trace('items', doc);
  doc.forEach((item) => {
    switch (item.stmt) {
      case STMT_STATE:
        setupNode(g, parentParsedItem, item, diagramDb, altFlag);
        break;
      case DEFAULT_STATE_TYPE:
        setupNode(g, parentParsedItem, item, diagramDb, altFlag);
        break;
      case STMT_RELATION:
        {
          setupNode(g, parentParsedItem, item.state1, diagramDb, altFlag);
          setupNode(g, parentParsedItem, item.state2, diagramDb, altFlag);
          const edgeData = {
            id: 'edge' + graphItemCount,
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
          };
          g.setEdge(item.state1.id, item.state2.id, edgeData, graphItemCount);
          graphItemCount++;
        }
        break;
    }
  });
};

/**
 * Get the direction from the statement items.
 * Look through all of the documents (docs) in the parsedItems
 * Because is a _document_ direction, the default direction is not necessarily the same as the overall default _diagram_ direction.
 * @param {object[]} parsedItem - the parsed statement item to look through
 * @param [defaultDir=DEFAULT_NESTED_DOC_DIR] - the direction to use if none is found
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
 * Draws a state diagram in the tag with id: id based on the graph definition in text.
 *
 * @param {any} text
 * @param {any} id
 * @param _version
 * @param diag
 */
export const draw = function (text, id, _version, diag) {
  log.info('Drawing state diagram (v2)', id);
  // diag.sb.clear();
  nodeDb = {};
  // Fetch the default direction, use TD if none was found
  let dir = diag.db.getDirection();
  if (typeof dir === 'undefined') dir = DEFAULT_DIAGRAM_DIRECTION;

  const { securityLevel, state: conf } = getConfig();
  const nodeSpacing = conf.nodeSpacing || 50;
  const rankSpacing = conf.rankSpacing || 50;

  log.info(diag.db.getRootDocV2());

  // This parses the diagram text and sets the classes, relations, styles, classDefs, etc.
  diag.db.extract(diag.db.getRootDocV2());
  log.info(diag.db.getRootDocV2());

  diagramStates = diag.db.getStates();
  diagramClasses = diag.db.getClasses();

  // Create the input mermaid.graph
  const g = new graphlib.Graph({
    multigraph: true,
    compound: true,
  })
    .setGraph({
      rankdir: getDir(diag.db.getRootDocV2()),
      nodesep: nodeSpacing,
      ranksep: rankSpacing,
      marginx: 8,
      marginy: 8,
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });

  setupNode(g, undefined, diag.db.getRootDocV2(), diag.db, true);

  // Set up an SVG group so that we can translate the final graph.
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  const svg = root.select(`[id="${id}"]`);

  // Run the renderer. This is what draws the final graph.

  const element = root.select('#' + id + ' g');
  render(element, g, ['barb'], CSS_DIAGRAM, id);

  const padding = 8;

  const bounds = svg.node().getBBox();

  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  // Zoom in a bit
  svg.attr('class', CSS_DIAGRAM);

  const svgBounds = svg.node().getBBox();

  configureSvgSize(svg, height, width, conf.useMaxWidth);

  // Ensure the viewBox includes the whole svgBounds area with extra space for padding
  const vBox = `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`;
  log.debug(`viewBox ${vBox}`);
  svg.attr('viewBox', vBox);

  // Add label rects for non html labels
  // if (!evaluate(conf.htmlLabels) || true) {
  const labels = document.querySelectorAll('[id="' + id + '"] .edgeLabel .label');
  for (let k = 0; k < labels.length; k++) {
    const label = labels[k];

    // Get dimensions of label
    const dim = label.getBBox();

    const rect = document.createElementNS('http://www.w3.org/2000/svg', SHAPE_STATE);
    rect.setAttribute('rx', 0);
    rect.setAttribute('ry', 0);
    rect.setAttribute('width', dim.width);
    rect.setAttribute('height', dim.height);

    label.insertBefore(rect, label.firstChild);
    // }
  }
  addSVGAccessibilityFields(diag.db, svg, id);
};

export default {
  setConf,
  getClasses,
  draw,
};
