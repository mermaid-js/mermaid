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
 * @param {object} conf The configuration object
 */
function drawNodes(svg, mindmap, conf) {
  svgDraw.drawNode(svg, mindmap, conf);
  if (mindmap.children) {
    mindmap.children.forEach((child) => {
      drawNodes(svg, child, conf);
    });
  }
}

/** @param {any} svg The svg element to draw the diagram onto */
function drawEdges() {}

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
  console.log('transpose', mindmap);
  eachNode(mindmap, (node) => {
    // node.y = node.y - (node.y - bb.top) * 2 - node.height;
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
  console.log('bottomToUp', mindmap);
  eachNode(mindmap.result, (node) => {
    // node.y = node.y - (node.y - bb.top) * 2 - node.height;
    node.y = node.y - (node.y - 0) * 2 - node.height;
  });
  return mindmap;
}
/** @param {object} mindmap The mindmap hierarchy */
function rightToLeft(mindmap) {
  console.log('bottomToUp', mindmap);
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
  const bb = new BoundingBox(40, 40);

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
  const dirNum = index % 4;
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

  // Merge the trees into a single tree
  const result = mergeTrees(node, trees);

  // return layout(node, 'BT', conf);
  // const res = layout(node, 'BT', conf);
  // res.result.children = [];
  // trees.forEach((tree) => {
  //   res.result.children.push(tree.result);
  // });
  console.log('Trees', trees);
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

    const nodesElem = svg.append('g');
    nodesElem.attr('class', 'mindmap-nodes');
    drawNodes(nodesElem, mm, conf);

    // Next step is to layout the mindmap, giving each node a position

    console.log('Before', mm);
    const positionedMindmap = layoutMindmap(mm, conf);
    console.log(positionedMindmap);

    // After this we can draw, first the edges and the then nodes with the correct position
    // drawEdges(svg, mm, conf);

    positionNodes(positionedMindmap, conf);

    // Setup the view box and size of the svg element
    setupGraphViewbox(undefined, svg, conf.mindmap.diagramPadding, conf.mindmap.useMaxWidth);
  } catch (e) {
    log.error('Error while rendering info diagram');
    log.error(e.message);
  }
};

export default {
  draw,
};
