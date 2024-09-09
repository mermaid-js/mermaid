import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';

export const createCylinderPathWithoutInnerArcD = (
  w: number,
  h: number,
  rx: number,
  ry: number
) => {
  return `M ${-w / 2} ${-h / 2}
    L ${-w / 2} ${h / 2}
    A ${rx} ${ry} 0 0 0 ${w / 2},${h / 2}
    L ${w / 2} ${-h / 2}
    A ${rx} ${ry} 0 0 0 ${-w / 2},${-h / 2}`;
};

export const createCylinderUpperArcPathD = (w: number, h: number, rx: number, ry: number) => {
  return `M ${-w / 2} ${-h / 2}
    A ${rx} ${ry} 0 0 0 ${w / 2} ${-h / 2}`;
};

export const createCylinderLowerArcPathD = (
  w: number,
  h: number,
  rx: number,
  ry: number,
  outerOffset: number
) => {
  return `M ${w / 2} ${-h / 2 + outerOffset}
    A ${rx} ${ry} 0 0 1 ${-w / 2} ${-h / 2 + outerOffset}`;
};

export const linedCylinder = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1 : nodePadding;
  const w = Math.max(bbox.width + labelPaddingX, node?.width ?? 0);
  const rx = w / 2;
  const ry = rx / (2.5 + w / 50);
  const h = Math.max(bbox.height + ry + labelPaddingY, node?.height ?? 0);
  const outerOffset = h * 0.1; // 10% of height

  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const cylinderPath = createCylinderPathWithoutInnerArcD(w, h, rx, ry);
  const cylinderNode = rc.path(cylinderPath, options);

  const UpperArcPath = createCylinderUpperArcPathD(w, h, rx, ry);
  const UpperArcPathNode = rc.path(UpperArcPath, { ...options, fill: 'none' });

  const lowerArcPath = createCylinderLowerArcPathD(w, h, rx, ry, outerOffset);
  const lowerArcPathNode = rc.path(lowerArcPath, { ...options, fill: 'none' });

  const linedCylinder = shapeSvg.insert(() => cylinderNode, ':first-child');
  linedCylinder.insert(() => lowerArcPathNode);
  linedCylinder.insert(() => UpperArcPathNode);

  linedCylinder.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    linedCylinder.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    linedCylinder.selectAll('path').attr('style', nodeStyles);
  }

  linedCylinder.attr('label-offset-y', ry);

  updateNodeBounds(node, linedCylinder);

  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) + ry - (bbox.y - (bbox.top ?? 0))})`
  );

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    const x = pos.x - (node.x ?? 0);

    if (
      rx != 0 &&
      (Math.abs(x) < (node.width ?? 0) / 2 ||
        (Math.abs(x) == (node.width ?? 0) / 2 &&
          Math.abs(pos.y - (node.y ?? 0)) > (node.height ?? 0) / 2 - ry))
    ) {
      let y = ry * ry * (1 - (x * x) / (rx * rx));
      if (y > 0) {
        y = Math.sqrt(y);
      }
      y = ry - y;
      if (point.y - (node.y ?? 0) > 0) {
        y = -y;
      }

      pos.y += y;
    }

    return pos;
  };

  return shapeSvg;
};
