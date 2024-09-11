import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import type { Node } from '../../types.js';
import type { SVG } from '../../../diagram-api/types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import { createPathFromPoints } from './util.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';

export const imageSquare = async (parent: SVG, node: Node) => {
  //image dimensions
  const img = new Image();
  img.src = node?.img ?? '';
  await img.decode();

  const imageNaturalWidth = Number(img.naturalWidth.toString().replace('px', ''));
  const imageNaturalHeight = Number(img.naturalHeight.toString().replace('px', ''));

  const defaultWidth = getConfig().flowchart?.wrappingWidth;
  const imageWidth = Math.max(
    node.label ? (defaultWidth ?? 0) : 0,
    node?.assetWidth ?? imageNaturalWidth
  );
  const imageHeight = node?.assetHeight ?? imageNaturalHeight;

  const imagePoints = [
    { x: -imageWidth / 2, y: -imageHeight },
    { x: imageWidth / 2, y: -imageHeight },
    { x: imageWidth / 2, y: 0 },
    { x: -imageWidth / 2, y: 0 },
  ];

  //label dimensions
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  // const { shapeSvg, bbox, halfPadding, label } = await labelHelper(
  //   parent,
  //   node,
  //   'icon-shape default'
  // );

  const { cssStyles } = node;
  // const defaultHeight = bbox.height;
  // node.height = Math.max(node.height ?? 0, node.label ? (defaultHeight ?? 0) : 0, imageHeight);
  const labelWidth = Math.max(node.width ?? 0, node.label ? (defaultWidth ?? 0) : 0, imageWidth);
  node.width = node.label ? labelWidth : 0;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, 'image-shape default');

  // const width = Math.max(bbox.width + (node.padding ?? 0), node?.width ?? 0);
  const height = Math.max(bbox.height + (node.padding ?? 0), node?.height ?? 0);
  const labelHeight = node.label ? height : 0;

  const imagePosition = node?.pos ?? 'b';

  const labelPoints = [
    { x: -labelWidth / 2, y: 0 },
    { x: labelWidth / 2, y: 0 },
    { x: labelWidth / 2, y: labelHeight },
    { x: -labelWidth / 2, y: labelHeight },
  ];

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const imagePath = createPathFromPoints(imagePoints);
  const imagePathNode = rc.path(imagePath, options);

  const linePath = createPathFromPoints(labelPoints);
  const lineNode = rc.path(linePath, { ...options });

  const imageShape = shapeSvg.insert(() => lineNode, ':first-child').attr('opacity', 0);
  imageShape.insert(() => imagePathNode, ':first-child');

  imageShape.attr('transform', `translate(${0},${(imageHeight - labelHeight) / 2})`);

  // Image operations
  if (node.img) {
    const image = shapeSvg.append('image');

    // Set the image attributes
    image.attr('href', node.img);
    image.attr('width', imageWidth);
    image.attr('height', imageHeight);
    image.attr('preserveAspectRatio', 'none');

    const yPos =
      imagePosition === 'b' ? -imageHeight / 2 - labelHeight / 2 : (-imageHeight + labelHeight) / 2;
    image.attr('transform', `translate(${-imageWidth / 2}, ${yPos})`);
  }

  if (cssStyles && node.look !== 'handDrawn') {
    imageShape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    imageShape.selectAll('path').attr('style', nodeStyles);
  }

  const yPos =
    imagePosition === 'b'
      ? (imageHeight + labelHeight) / 2 - bbox.height - (bbox.y - (bbox.top ?? 0))
      : -(imageHeight + labelHeight) / 2 + (node?.padding ?? 0) / 2 - (bbox.y - (bbox.top ?? 0));

  label.attr('transform', `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${yPos})`);

  updateNodeBounds(node, imageShape);

  node.intersect = function (point) {
    log.info('imageSquare intersect', node, point);

    const combinedPoints = [...imagePoints, ...labelPoints];

    const pos = intersect.polygon(node, combinedPoints, point);
    return pos;
  };

  return shapeSvg;
};
