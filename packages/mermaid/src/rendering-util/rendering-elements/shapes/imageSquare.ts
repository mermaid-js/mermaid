import { log } from '$root/logger.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { createPathFromPoints } from './util.js';

export const imageSquare = async (parent: SVG, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const { cssStyles } = node;

  const imageWidth = node?.width ?? 100;
  const imageHeight = node?.height ?? 100;

  const width = Math.max(bbox.width + (node.padding ?? 0), imageWidth);
  const height = Math.max(bbox.height + (node.padding ?? 0), imageHeight);

  // const imageSizeWidth = width / 2;   // Image will be smaller than the full width
  const imageSizeHeight = height * 0.1; // Image will be smaller than the full height

  const skeletonWidth = width + (node?.padding ?? 0);
  const skeletonHeight = height + imageSizeHeight + bbox.height;

  const imagePosition = node?.pos ?? 'b';
  const points = [
    { x: 0, y: 0 },
    { x: skeletonWidth, y: 0 },
    { x: skeletonWidth, y: skeletonHeight },
    { x: 0, y: skeletonHeight },
  ];

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const linePath = createPathFromPoints(points);
  const lineNode = rc.path(linePath, options);

  const iconShape = shapeSvg.insert(() => lineNode, ':first-child');
  if (node.img) {
    const image = shapeSvg.append('image');

    // Set the image attributes
    image.attr('href', node.img);
    image.attr('width', imageWidth);
    image.attr('height', imageHeight);

    const yPos =
      imagePosition === 't'
        ? -(skeletonHeight / 2 - imageSizeHeight / 2)
        : skeletonHeight / 2 - height - imageSizeHeight / 2;
    image.attr('transform', `translate(${-imageWidth / 2}, ${yPos})`);
  }

  // Apply styles for the shape
  if (cssStyles && node.look !== 'handDrawn') {
    iconShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    iconShape.selectAll('path').attr('style', nodeStyles);
  }

  // Position the shape at the center
  iconShape.attr('transform', `translate(${-skeletonWidth / 2},${-skeletonHeight / 2})`);

  // Position the label at the top center of the shape
  const yPos =
    imagePosition === 't'
      ? skeletonHeight / 2 - bbox.height
      : -skeletonHeight / 2 + (node?.padding ?? 0) / 2;

  label.attr('transform', `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${yPos})`);

  updateNodeBounds(node, iconShape);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
