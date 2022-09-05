/** Created by knut on 14-12-11. */
import { select } from 'd3';
import { log, getConfig, setupGraphViewbox } from '../../diagram-api/diagramAPI';
import svgDraw from './svgDraw';
import { BoundingBox, Layout, Tree } from 'non-layered-tidy-tree-layout';
import clone from 'fast-clone';
import db from './mindmapDb';

/**
 * @param {any} svg The svg element to draw the diagram onto
 * @param {object} mindmap The maindmap data and hierarchy
 * @param section
 * @param {object} conf The configuration object
 */
function drawNodes(svg, mindmap, section, conf) {
  svgDraw.drawNode(svg, mindmap, section, conf);
  if (mindmap.children) {
    mindmap.children.forEach((child, index) => {
      drawNodes(svg, child, section < 0 ? index : section, conf);
    });
  }
}

/**
 * @param {any} svg The svg element to draw the diagram onto
 * @param edgesElem
 * @param mindmap
 * @param parent
 * @param depth
 * @param section
 * @param conf
 */
function drawEdges(edgesElem, mindmap, parent, depth, section, conf) {
  if (parent) {
    svgDraw.drawEdge(edgesElem, mindmap, parent, depth, section, conf);
  }
  if (mindmap.children) {
    mindmap.children.forEach((child, index) => {
      drawEdges(edgesElem, child, mindmap, depth + 1, section < 0 ? index : section, conf);
    });
  }
}

/**
 * @param mindmap
 * @param callback
 */
function eachNode(mindmap, callback) {
  callback(mindmap);
  if (mindmap.children) {
    mindmap.children.forEach((child) => {
      eachNode(child, callback);
    });
  }
}
/** @param {object} mindmap */
function transpose(mindmap) {
  eachNode(mindmap, (node) => {
    const orgWidth = node.width;
    const orgX = node.x;
    node.width = node.height;
    node.height = orgWidth;
    node.x = node.y;
    node.y = orgX;
  });
  return mindmap;
}
/** @param {object} mindmap */
function bottomToUp(mindmap) {
  log.debug('bottomToUp', mindmap);
  eachNode(mindmap.result, (node) => {
    // node.y = node.y - (node.y - bb.top) * 2 - node.height;
    node.y = node.y - (node.y - 0) * 2 - node.height;
  });
  return mindmap;
}
/** @param {object} mindmap The mindmap hierarchy */
function rightToLeft(mindmap) {
  eachNode(mindmap.result, (node) => {
    // node.y = node.y - (node.y - bb.top) * 2 - node.height;
    node.x = node.x - (node.x - 0) * 2 - node.width;
  });
  return mindmap;
}

/**
 * @param mindmap
 * @param dir
 * @param conf
 */
function layout(mindmap, dir, conf) {
  const bb = new BoundingBox(30, 60);

  const layout = new Layout(bb);
  switch (dir) {
    case 'TB':
      return layout.layout(mindmap);
    case 'BT':
      return bottomToUp(layout.layout(mindmap));
    case 'RL': {
      transpose(mindmap);
      let newRes = layout.layout(mindmap);
      transpose(newRes.result);
      return rightToLeft(newRes);
    }
    case 'LR': {
      transpose(mindmap);
      let newRes = layout.layout(mindmap);
      transpose(newRes.result);
      return newRes;
    }
    default:
  }
}
const dirFromIndex = (index) => {
  const dirNum = (index + 2) % 4;
  switch (dirNum) {
    case 0:
      return 'LR';
    case 1:
      return 'RL';
    case 2:
      return 'TB';
    case 3:
      return 'BT';
    default:
      return 'TB';
  }
};

const mergeTrees = (node, trees) => {
  node.x = trees[0].result.x;
  node.y = trees[0].result.y;
  trees.forEach((tree) => {
    tree.result.children.forEach((child) => {
      const dx = node.x - tree.result.x;
      const dy = node.y - tree.result.y;
      eachNode(child, (childNode) => {
        const orgNode = db.getNodeById(childNode.id);
        if (orgNode) {
          orgNode.x = childNode.x + dx;
          orgNode.y = childNode.y + dy;
        }
      });
    });
  });
  return node;
};

/**
 * @param node
 * @param isRoot
 * @param parent
 * @param conf
 */
function layoutMindmap(node, conf) {
  // BoundingBox(gap, bottomPadding)
  // const bb = new BoundingBox(10, 10);
  // const layout = new Layout(bb);
  // // const layout = new HorizontalLayout(bb);
  if (node.children.length === 0) {
    return node;
  }
  const trees = [];
  // node.children.forEach((child, index) => {
  //   const tree = clone(node);
  //   tree.children = [tree.children[index]];
  //   trees.push(layout(tree, dirFromIndex(index), conf));
  // });

  let cnt = 0;
  // For each direction, create a new tree with the same root, and add a ubset of the children to it.
  for (let i = 0; i < 4; i++) {
    // Calculate the number of the children of the root node that will be used in this direction
    const numChildren =
      Math.floor(node.children.length / 4) + (node.children.length % 4 > i ? 1 : 0);
    // Copy the original root node
    const tree = clone(node);
    // Setup the new copy with the children to be rendered in this direction
    tree.children = [];
    for (let j = 0; j < numChildren; j++) {
      tree.children.push(node.children[cnt]);
      cnt++;
    }
    if (tree.children.length > 0) {
      trees.push(layout(tree, dirFromIndex(i), conf));
    }
  }
  // Let each node know the direct of its tree for when we draw the branches.
  trees.forEach((tree, index) => {
    tree.result.direction = dirFromIndex(index);
    eachNode(tree.result, (node) => {
      node.direction = dirFromIndex(index);
    });
  });

  // Merge the trees into a single tree
  const result = mergeTrees(node, trees);
  eachNode;
  return node;
}
/**
 * @param node
 * @param isRoot
 * @param conf
 */
function positionNodes(node, conf) {
  svgDraw.positionNode(node, conf);
  if (node.children) {
    node.children.forEach((child) => {
      positionNodes(child, conf);
    });
  }
}

/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 *
 * @param {any} text
 * @param {any} id
 * @param {any} version
 * @param diagObj
 */
export const draw = (text, id, version, diagObj) => {
  const conf = getConfig();
  try {
    // const parser = infoParser.parser;
    // parser.yy = db;
    log.debug('Renering info diagram\n' + text);

    const securityLevel = getConfig().securityLevel;
    // Handle root and Document for when rendering in sanbox mode
    let sandboxElement;
    if (securityLevel === 'sandbox') {
      sandboxElement = select('#i' + id);
    }
    const root =
      securityLevel === 'sandbox'
        ? select(sandboxElement.nodes()[0].contentDocument.body)
        : select('body');
    const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

    // Parse the graph definition

    const svg = root.select('#' + id);

    const g = svg.append('g');
    const mm = diagObj.db.getMindmap();

    // Draw the graph and start with drawing the nodes without proper position
    // this gives us the size of the nodes and we can set the positions later

    const edgesElem = svg.append('g');
    edgesElem.attr('class', 'mindmap-edges');
    const nodesElem = svg.append('g');
    nodesElem.attr('class', 'mindmap-nodes');
    drawNodes(nodesElem, mm, -1, conf);

    // Next step is to layout the mindmap, giving each node a position

    const positionedMindmap = layoutMindmap(mm, conf);

    // After this we can draw, first the edges and the then nodes with the correct position
    drawEdges(edgesElem, positionedMindmap, null, 0, -1, conf);
    positionNodes(positionedMindmap, conf);

    // Setup the view box and size of the svg element
    setupGraphViewbox(undefined, svg, conf.mindmap.padding, conf.mindmap.useMaxWidth);
  } catch (e) {
    log.error('Error while rendering info diagram');
    log.error(e.message);
  }
};

export default {
  draw,
};
