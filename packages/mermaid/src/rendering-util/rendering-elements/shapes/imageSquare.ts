import { log } from '../../../logger.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import type { Node } from '../../types.d.ts';
import type { SVG } from '../../../diagram-api/types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { createPathFromPoints } from './util.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';

export const imageSquare = async (parent: SVG, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const img = new Image();
  img.src = node?.img ?? '';

  await img.decode();
  const imageNaturalWidth = Number(img.naturalWidth.toString().replace('px', ''));
  const imageNaturalHeight = Number(img.naturalHeight.toString().replace('px', ''));

  const imageWidth = node?.assetWidth ?? imageNaturalWidth;
  const imageHeight = node?.assetHeight ?? imageNaturalHeight;
  const defaultWidth = getConfig().flowchart?.wrappingWidth;
  // const htmlLabels = getConfig().flowchart?.htmlLabels

  node.width = Math.max(node.width ?? 0, node.label ? (defaultWidth ?? 0) : 0, imageWidth);

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const { cssStyles } = node;
  const defaultHeight = bbox.height;
  node.height = Math.max(node.height ?? 0, node.label ? (defaultHeight ?? 0) : 0, imageHeight);

  const width = Math.max(bbox.width + (node.padding ?? 0), imageWidth, node?.width ?? 0);
  const height = Math.max(bbox.height + (node.padding ?? 0), imageHeight, node?.height ?? 0);

  const skeletonWidth = width + (node?.padding ?? 0) / 2;
  const skeletonHeight = height + bbox.height;

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

  const imageShape = shapeSvg.insert(() => lineNode, ':first-child').attr('opacity', 0);
  if (node.img) {
    const image = shapeSvg.append('image');

    // Set the image attributes
    image.attr('href', node.img);
    image.attr('width', node.width);
    image.attr('height', node.height);
    image.attr('preserveAspectRatio', 'none');

    const yPos =
      imagePosition === 'b'
        ? -(skeletonHeight / 2)
        : skeletonHeight / 2 - height + (bbox.y + (bbox.top ?? 0)) * 2;
    image.attr('transform', `translate(${-node.width / 2}, ${yPos})`);
  }

  if (cssStyles && node.look !== 'handDrawn') {
    imageShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    imageShape.selectAll('path').attr('style', nodeStyles);
  }

  imageShape.attr('transform', `translate(${-skeletonWidth / 2},${-skeletonHeight / 2})`);

  const yPos =
    imagePosition === 'b'
      ? skeletonHeight / 2 - bbox.height - (bbox.y - (bbox.top ?? 0))
      : -skeletonHeight / 2 + (node?.padding ?? 0) / 2 - (bbox.y - (bbox.top ?? 0));

  label.attr('transform', `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${yPos})`);

  updateNodeBounds(node, imageShape);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
};
