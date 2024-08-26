import { labelHelper, getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';

function createCylinderPathD(rx: number, ry: number, w: number, h: number) {
  return `M ${w / 2} ${-h / 2}
            L ${-w / 2} ${-h / 2}
            A ${rx} ${ry} 0 0 0 ${-w / 2} ${h / 2}
            L ${w / 2} ${h / 2}
            A ${rx} ${ry} 0 0 0 ${w / 2} ${-h / 2}
            `;
}

function createInnerPathD(rx: number, ry: number, w: number, h: number) {
  return `M${w / 2} ${-h / 2}
            A ${rx} ${ry} 0 0 0 ${w / 2} ${h / 2}`;
}

export const tiltedCylinder = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const h = bbox.height + node.padding;
  const ry = h / 2;
  const rx = ry / (2.5 + h / 50);
  const w = bbox.width + rx + node.padding;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const cylinderPath = createCylinderPathD(rx, ry, w, h);
  const cylinderNode = rc.path(cylinderPath, options);

  const innerPath = createInnerPathD(rx, ry, w, h);
  const innerNode = rc.path(innerPath, { ...options, fill: 'none' });

  const tiltedCylinder = shapeSvg.insert(() => innerNode, ':first-child');
  tiltedCylinder.insert(() => cylinderNode, ':first-child');

  tiltedCylinder.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    tiltedCylinder.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    tiltedCylinder.selectAll('path').attr('style', nodeStyles);
  }

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - rx - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, tiltedCylinder);

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
