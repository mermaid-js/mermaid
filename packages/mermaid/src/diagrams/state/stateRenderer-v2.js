import graphlib from 'graphlib';
import { select } from 'd3';
import { getConfig } from '../../config';
import { render } from '../../dagre-wrapper/index.js';
import { log } from '../../logger';
import { configureSvgSize } from '../../setupGraphViewbox';
import common from '../common/common';
import addSVGAccessibilityFields from '../../accessibility';

const DEFAULT_DIR = 'TD';

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
 * Create a graph node based on the statement information
 *
 * @param g - graph
 * @param {object} parent
 * @param {object} parsedItem - parsed statement item
 * @param {object} diagramDb
 * @param {boolean} altFlag - for clusters, add the "statediagram-cluster-alt" CSS class
 * @todo This duplicates some of what is done in stateDb.js extract method
 */
const setupNode = (g, parent, parsedItem, diagramDb, altFlag) => {
  const itemId = parsedItem.id;
  const classStr = getClassesFromDbInfo(diagramStates[itemId]);

  if (itemId !== 'root') {
    let shape = 'rect';
    if (parsedItem.start === true) {
      shape = 'start';
    }
    if (parsedItem.start === false) {
      shape = 'end';
    }
    if (parsedItem.type !== 'default') {
      shape = parsedItem.type;
    }

    // Add the node to our list (nodeDb)
    if (!nodeDb[itemId]) {
      nodeDb[itemId] = {
        id: itemId,
        shape,
        description: common.sanitizeText(itemId, getConfig()),
        classes: classStr + ' statediagram-state',
      };
    }

    const newNode = nodeDb[itemId];

    // Build of the array of description strings
    if (parsedItem.description) {
      if (Array.isArray(newNode.description)) {
        // There already is an array of strings,add to it
        newNode.shape = 'rectWithTitle';
        newNode.description.push(parsedItem.description);
      } else {
        if (newNode.description.length > 0) {
          // if there is a description already transform it to an array
          newNode.shape = 'rectWithTitle';
          if (newNode.description === itemId) {
            // If the previous description was the is, remove it
            newNode.description = [parsedItem.description];
          } else {
            newNode.description = [newNode.description, parsedItem.description];
          }
        } else {
          newNode.shape = 'rect';
          newNode.description = parsedItem.description;
        }
      }
      newNode.description = common.sanitizeTextOrArray(newNode.description, getConfig());
    }

    // update the node shape
    if (newNode.description.length === 1 && newNode.shape === 'rectWithTitle') {
      newNode.shape = 'rect';
    }

    // Save data for description and group so that for instance a statement without description overwrites
    // one with description

    // group
    if (!newNode.type && parsedItem.doc) {
      log.info('Setting cluster for ', itemId, getDir(parsedItem));
      newNode.type = 'group';
      newNode.dir = getDir(parsedItem);
      newNode.shape = parsedItem.type === 'divider' ? 'divider' : 'roundedWithTitle';

      newNode.classes =
        newNode.classes +
        ' ' +
        (altFlag ? 'statediagram-cluster statediagram-cluster-alt' : 'statediagram-cluster');
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
      domId: 'state-' + itemId + '-' + graphItemCount,
      type: newNode.type,
      padding: 15, //getConfig().flowchart.padding
    };

    if (parsedItem.note) {
      // Todo: set random id
      const noteData = {
        labelStyle: '',
        shape: 'note',
        labelText: parsedItem.note.text,
        classes: 'statediagram-note', //classStr,
        style: '', // styles.style,
        id: itemId + '----note-' + graphItemCount,
        domId: 'state-' + itemId + '----note-' + graphItemCount,
        type: newNode.type,
        padding: 15, //getConfig().flowchart.padding
      };
      const groupData = {
        labelStyle: '',
        shape: 'noteGroup',
        labelText: parsedItem.note.text,
        classes: newNode.classes, //classStr,
        style: '', // styles.style,
        id: itemId + '----parent',
        domId: 'state-' + itemId + '----parent-' + graphItemCount,
        type: 'group',
        padding: 0, //getConfig().flowchart.padding
      };
      graphItemCount++;

      g.setNode(itemId + '----parent', groupData);

      g.setNode(noteData.id, noteData);
      g.setNode(itemId, nodeData);

      g.setParent(itemId, itemId + '----parent');
      g.setParent(noteData.id, itemId + '----parent');

      let from = itemId;
      let to = noteData.id;

      if (parsedItem.note.position === 'left of') {
        from = noteData.id;
        to = itemId;
      }
      g.setEdge(from, to, {
        arrowhead: 'none',
        arrowType: '',
        style: 'fill:none',
        labelStyle: '',
        classes: 'transition note-edge',
        arrowheadStyle: 'fill: #333',
        labelpos: 'c',
        labelType: 'text',
        thickness: 'normal',
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
      case 'state':
        setupNode(g, parentParsedItem, item, diagramDb, altFlag);
        break;
      case 'default':
        setupNode(g, parentParsedItem, item, diagramDb, altFlag);
        break;
      case 'relation':
        {
          setupNode(g, parentParsedItem, item.state1, diagramDb, altFlag);
          setupNode(g, parentParsedItem, item.state2, diagramDb, altFlag);
          const edgeData = {
            id: 'edge' + graphItemCount,
            arrowhead: 'normal',
            arrowTypeEnd: 'arrow_barb',
            style: 'fill:none',
            labelStyle: '',
            label: common.sanitizeText(item.description, getConfig()),
            arrowheadStyle: 'fill: #333',
            labelpos: 'c',
            labelType: 'text',
            thickness: 'normal',
            classes: 'transition',
          };
          g.setEdge(item.state1.id, item.state2.id, edgeData, graphItemCount);
          graphItemCount++;
        }
        break;
    }
  });
};

/**
 * Get the direction from the statement items.  Default is TB  (top to bottom).
 * Look through all of the documents (docs) in the parsedItems
 *
 * @param {object[]} parsedItem - the parsed statement item to look through
 * @param [defaultDir='TB'] - the direction to use if none is found
 * @returns {string}
 */
const getDir = (parsedItem, defaultDir = DEFAULT_DIR) => {
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
  if (typeof dir === 'undefined') dir = DEFAULT_DIR;

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
  render(element, g, ['barb'], 'statediagram', id);

  const padding = 8;

  const bounds = svg.node().getBBox();

  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  // Zoom in a bit
  svg.attr('class', 'statediagram');

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

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
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
