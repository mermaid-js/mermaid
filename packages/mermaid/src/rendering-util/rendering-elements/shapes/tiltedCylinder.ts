import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

function createCylinderPathD(rx: number, ry: number, w: number, h: number) {
  return `M ${w / 2} ${-h / 2}
            L ${-w / 2} ${-h / 2}
            A ${rx} ${ry} 0 0 0 ${-w / 2} ${h / 2}
            L ${w / 2} ${h / 2}
            A ${rx} ${ry} 0 0 0 ${w / 2} ${-h / 2}
            A ${rx} ${ry} 0 0 0 ${w / 2} ${h / 2}`;
}

export const titledCylinder = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const h = bbox.height + node.padding;
  const ry = h / 2;
  const rx = ry / (2.5 + h / 50);
  const w = bbox.width + rx + node.padding;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handdrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const cylinderPath = createCylinderPathD(rx, ry, w, h);
  const cylinderNode = rc.path(cylinderPath, options);

  const titledCylinder = shapeSvg.insert('g', ':first-child');
  titledCylinder.insert(() => cylinderNode, ':first-child');

  titledCylinder.attr('class', 'basic label-container');

  if (cssStyles) {
    titledCylinder.attr('style', cssStyles);
  }

  if (nodeStyles) {
    titledCylinder.attr('style', nodeStyles);
  }

  updateNodeBounds(node, titledCylinder);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    const y = pos.y - (node.y ?? 0);

    if (
      ry != 0 &&
      (Math.abs(y) < (node.height ?? 0) / 2 ||
        (Math.abs(y) == (node.height ?? 0) / 2 &&
          Math.abs(pos.x - (node.x ?? 0)) > (node.width ?? 0) / 2 - rx))
    ) {
      let x = rx * rx * (1 - (y * y) / (ry * ry));
      if (x != 0) {
        x = Math.sqrt(x);
      }
      x = rx - x;
      if (point.x - (node.x ?? 0) > 0) {
        x = -x;
      }

      pos.x += x;
    }

    return pos;
  };

  return shapeSvg;
};
