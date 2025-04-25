import type { MermaidConfig } from '../../config.type.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import common from '../common/common.js';
import {
  CSS_DIAGRAM_CLUSTER,
  CSS_DIAGRAM_CLUSTER_ALT,
  CSS_DIAGRAM_NOTE,
  CSS_DIAGRAM_STATE,
  CSS_EDGE,
  CSS_EDGE_NOTE_EDGE,
  DEFAULT_NESTED_DOC_DIR,
  DEFAULT_STATE_TYPE,
  DIVIDER_TYPE,
  DOMID_STATE,
  DOMID_TYPE_SPACER,
  G_EDGE_ARROWHEADSTYLE,
  G_EDGE_LABELPOS,
  G_EDGE_LABELTYPE,
  G_EDGE_STYLE,
  G_EDGE_THICKNESS,
  NOTE,
  NOTE_ID,
  PARENT,
  PARENT_ID,
  SHAPE_DIVIDER,
  SHAPE_END,
  SHAPE_GROUP,
  SHAPE_NOTE,
  SHAPE_NOTEGROUP,
  SHAPE_START,
  SHAPE_STATE,
  SHAPE_STATE_WITH_DESC,
  STMT_RELATION,
  STMT_STATE,
} from './stateCommon.js';
import type { Edge, NodeData, StateStmt, Stmt, StyleClass } from './stateDb.js';

// List of nodes created from the parsed diagram statement items
const nodeDb = new Map<string, NodeData>();

let graphItemCount = 0; // used to construct ids, etc.

/**
 * Create a standard string for the dom ID of an item.
 * If a type is given, insert that before the counter, preceded by the type spacer
 *
 */
export function stateDomId(
  itemId = '',
  counter = 0,
  type: string | null = '',
  typeSpacer = DOMID_TYPE_SPACER
) {
  const typeStr = type !== null && type.length > 0 ? `${typeSpacer}${type}` : '';
  return `${DOMID_STATE}-${itemId}${typeStr}-${counter}`;
}

const setupDoc = (
  parentParsedItem: StateStmt | undefined,
  doc: Stmt[],
  diagramStates: Map<string, StateStmt>,
  nodes: NodeData[],
  edges: Edge[],
  altFlag: boolean,
  look: MermaidConfig['look'],
  classes: Map<string, StyleClass>
) => {
  // graphItemCount = 0;
  log.trace('items', doc);
  doc.forEach((item) => {
    switch (item.stmt) {
      case STMT_STATE:
        dataFetcher(parentParsedItem, item, diagramStates, nodes, edges, altFlag, look, classes);
        break;
      case DEFAULT_STATE_TYPE:
        dataFetcher(parentParsedItem, item, diagramStates, nodes, edges, altFlag, look, classes);
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
            look,
            classes
          );
          dataFetcher(
            parentParsedItem,
            item.state2,
            diagramStates,
            nodes,
            edges,
            altFlag,
            look,
            classes
          );
          const edgeData = {
            id: 'edge' + graphItemCount,
            start: item.state1.id,
            end: item.state2.id,
            arrowhead: 'normal',
            arrowTypeEnd: 'arrow_barb',
            style: G_EDGE_STYLE,
            labelStyle: '',
            label: common.sanitizeText(item.description ?? '', getConfig()),
            arrowheadStyle: G_EDGE_ARROWHEADSTYLE,
            labelpos: G_EDGE_LABELPOS,
            labelType: G_EDGE_LABELTYPE,
            thickness: G_EDGE_THICKNESS,
            classes: CSS_EDGE,
            look,
          };
          edges.push(edgeData);
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
 * @param parsedItem - the parsed statement item to look through
 * @param defaultDir - the direction to use if none is found
 */
const getDir = (parsedItem: { doc?: Stmt[] }, defaultDir = DEFAULT_NESTED_DOC_DIR) => {
  let dir = defaultDir;
  if (parsedItem.doc) {
    for (const parsedItemDoc of parsedItem.doc) {
      if (parsedItemDoc.stmt === 'dir') {
        dir = parsedItemDoc.value;
      }
    }
  }
  return dir;
};

function insertOrUpdateNode(
  nodes: NodeData[],
  nodeData: NodeData,
  classes: Map<string, StyleClass>
) {
  if (!nodeData.id || nodeData.id === '</join></fork>' || nodeData.id === '</choice>') {
    return;
  }

  //Populate node style attributes if nodeData has classes defined
  if (nodeData.cssClasses) {
    if (!Array.isArray(nodeData.cssCompiledStyles)) {
      nodeData.cssCompiledStyles = [];
    }

    nodeData.cssClasses.split(' ').forEach((cssClass) => {
      const classDef = classes.get(cssClass);
      if (classDef) {
        nodeData.cssCompiledStyles = [...(nodeData.cssCompiledStyles ?? []), ...classDef.styles];
      }
    });
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
 * Get classes from the db for the info item.
 * If there aren't any or if dbInfoItem isn't defined, return an empty string.
 * Else create 1 string from the list of classes found
 *
 */
function getClassesFromDbInfo(dbInfoItem?: StateStmt): string {
  return dbInfoItem?.classes?.join(' ') ?? '';
}

function getStylesFromDbInfo(dbInfoItem?: StateStmt): string[] {
  return dbInfoItem?.styles ?? [];
}

export const dataFetcher = (
  parent: StateStmt | undefined,
  parsedItem: StateStmt,
  diagramStates: Map<string, StateStmt>,
  nodes: NodeData[],
  edges: Edge[],
  altFlag: boolean,
  look: MermaidConfig['look'],
  classes: Map<string, StyleClass>
) => {
  const itemId = parsedItem.id;
  const dbState = diagramStates.get(itemId);
  const classStr = getClassesFromDbInfo(dbState);
  const style = getStylesFromDbInfo(dbState);
  const config = getConfig();

  log.info('dataFetcher parsedItem', parsedItem, dbState, style);

  if (itemId !== 'root') {
    let shape = SHAPE_STATE;
    // The if === true / false can be removed if we can guarantee that the parsedItem.start is always a boolean
    if (parsedItem.start === true) {
      shape = SHAPE_START;
    } else if (parsedItem.start === false) {
      shape = SHAPE_END;
    }
    if (parsedItem.type !== DEFAULT_STATE_TYPE) {
      shape = parsedItem.type;
    }

    // Add the node to our list (nodeDb)
    if (!nodeDb.get(itemId)) {
      nodeDb.set(itemId, {
        id: itemId,
        shape,
        description: common.sanitizeText(itemId, config),
        cssClasses: `${classStr} ${CSS_DIAGRAM_STATE}`,
        cssStyles: style,
      });
    }

    const newNode = nodeDb.get(itemId)!;

    // Save data for description and group so that for instance a statement without description overwrites
    // one with description  @todo TODO What does this mean? If important, add a test for it

    // Build of the array of description strings
    if (parsedItem.description) {
      if (Array.isArray(newNode.description)) {
        // There already is an array of strings,add to it
        newNode.shape = SHAPE_STATE_WITH_DESC;
        newNode.description.push(parsedItem.description);
      } else {
        if (newNode.description?.length && newNode.description.length > 0) {
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
      newNode.description = common.sanitizeTextOrArray(newNode.description, config);
    }

    // If there's only 1 description entry, just use a regular state shape
    if (newNode.description?.length === 1 && newNode.shape === SHAPE_STATE_WITH_DESC) {
      if (newNode.type === 'group') {
        newNode.shape = SHAPE_GROUP;
      } else {
        newNode.shape = SHAPE_STATE;
      }
    }

    // group
    if (!newNode.type && parsedItem.doc) {
      log.info('Setting cluster for XCX', itemId, getDir(parsedItem));
      newNode.type = 'group';
      newNode.isGroup = true;
      newNode.dir = getDir(parsedItem);
      newNode.shape = parsedItem.type === DIVIDER_TYPE ? SHAPE_DIVIDER : SHAPE_GROUP;
      newNode.cssClasses = `${newNode.cssClasses} ${CSS_DIAGRAM_CLUSTER} ${altFlag ? CSS_DIAGRAM_CLUSTER_ALT : ''}`;
    }

    // This is what will be added to the graph
    const nodeData: NodeData = {
      labelStyle: '',
      shape: newNode.shape,
      label: newNode.description,
      cssClasses: newNode.cssClasses,
      cssCompiledStyles: [],
      cssStyles: newNode.cssStyles,
      id: itemId,
      dir: newNode.dir,
      domId: stateDomId(itemId, graphItemCount),
      type: newNode.type,
      isGroup: newNode.type === 'group',
      padding: 8,
      rx: 10,
      ry: 10,
      look,
    };

    // Clear the label for dividers who have no description
    if (nodeData.shape === SHAPE_DIVIDER) {
      nodeData.label = '';
    }

    if (parent && parent.id !== 'root') {
      log.trace('Setting node ', itemId, ' to be child of its parent ', parent.id);
      nodeData.parentId = parent.id;
    }

    nodeData.centerLabel = true;

    if (parsedItem.note) {
      // Todo: set random id
      const noteData: NodeData = {
        labelStyle: '',
        shape: SHAPE_NOTE,
        label: parsedItem.note.text,
        cssClasses: CSS_DIAGRAM_NOTE,
        // useHtmlLabels: false,
        cssStyles: [],
        cssCompiledStyles: [],
        id: itemId + NOTE_ID + '-' + graphItemCount,
        domId: stateDomId(itemId, graphItemCount, NOTE),
        type: newNode.type,
        isGroup: newNode.type === 'group',
        padding: config.flowchart?.padding,
        look,
        position: parsedItem.note.position,
      };
      const parentNodeId = itemId + PARENT_ID;
      const groupData = {
        labelStyle: '',
        shape: SHAPE_NOTEGROUP,
        label: parsedItem.note.text,
        cssClasses: newNode.cssClasses,
        cssStyles: [],
        id: itemId + PARENT_ID,
        domId: stateDomId(itemId, graphItemCount, PARENT),
        type: 'group',
        isGroup: true,
        padding: 16, //getConfig().flowchart.padding
        look,
        position: parsedItem.note.position,
      };
      graphItemCount++;

      //add parent id to groupData
      groupData.id = parentNodeId;
      //add parent id to noteData
      noteData.parentId = parentNodeId;
      //nodeData.parentId = parentNodeId;

      //insert groupData
      insertOrUpdateNode(nodes, groupData, classes);
      //insert noteData
      insertOrUpdateNode(nodes, noteData, classes);
      //insert nodeData
      insertOrUpdateNode(nodes, nodeData, classes);

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
        look,
      });
    } else {
      insertOrUpdateNode(nodes, nodeData, classes);
    }
  }
  if (parsedItem.doc) {
    log.trace('Adding nodes children ');
    setupDoc(parsedItem, parsedItem.doc, diagramStates, nodes, edges, !altFlag, look, classes);
  }
};

export const reset = () => {
  nodeDb.clear();
  graphItemCount = 0;
};
