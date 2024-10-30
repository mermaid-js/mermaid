import rough from 'roughjs';
import { log } from '../../../logger.js';
import type { Node, ShapeRenderOptions } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { labelHelper, updateNodeBounds } from './util.js';
import type { D3Selection } from '../../../types.js';

export async function imageSquare<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { flowchart } }: ShapeRenderOptions
) {
  const img = new Image();
  img.src = node?.img ?? '';
  await img.decode();

  const imageNaturalWidth = Number(img.naturalWidth.toString().replace('px', ''));
  const imageNaturalHeight = Number(img.naturalHeight.toString().replace('px', ''));
  node.imageAspectRatio = imageNaturalWidth / imageNaturalHeight;

  const { labelStyles } = styles2String(node);

  node.labelStyle = labelStyles;

  const defaultWidth = flowchart?.wrappingWidth;
  node.defaultWidth = flowchart?.wrappingWidth;

  const imageRawWidth = Math.max(
    node.label ? (defaultWidth ?? 0) : 0,
    node?.assetWidth ?? imageNaturalWidth
  );

  const imageWidth =
    node.constraint === 'on'
      ? node?.assetHeight
        ? node.assetHeight * node.imageAspectRatio
        : imageRawWidth
      : imageRawWidth;

  const imageHeight =
    node.constraint === 'on'
      ? imageWidth / node.imageAspectRatio
      : (node?.assetHeight ?? imageNaturalHeight);
  node.width = Math.max(imageWidth, defaultWidth ?? 0);
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, 'image-shape default');

  const topLabel = node.pos === 't';

  const x = -imageWidth / 2;
  const y = -imageHeight / 2;

  const labelPadding = node.label ? 8 : 0;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const imageNode = rc.rectangle(x, y, imageWidth, imageHeight, options);

  const outerWidth = Math.max(imageWidth, bbox.width);
  const outerHeight = imageHeight + bbox.height + labelPadding;

  const outerNode = rc.rectangle(-outerWidth / 2, -outerHeight / 2, outerWidth, outerHeight, {
    ...options,
    fill: 'none',
    stroke: 'none',
  });

  const iconShape = shapeSvg.insert(() => imageNode, ':first-child');
  const outerShape = shapeSvg.insert(() => outerNode);

  if (node.img) {
    const image = shapeSvg.append('image');

    // Set the image attributes
    image.attr('href', node.img);
    image.attr('width', imageWidth);
    image.attr('height', imageHeight);
    image.attr('preserveAspectRatio', 'none');

    image.attr(
      'transform',
      `translate(${-imageWidth / 2},${topLabel ? outerHeight / 2 - imageHeight : -outerHeight / 2})`
    );
  }

  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${
      topLabel
        ? -imageHeight / 2 - bbox.height / 2 - labelPadding / 2
        : imageHeight / 2 - bbox.height / 2 + labelPadding / 2
    })`
  );

  iconShape.attr(
    'transform',
    `translate(${0},${
      topLabel ? bbox.height / 2 + labelPadding / 2 : -bbox.height / 2 - labelPadding / 2
    })`
  );

  updateNodeBounds(node, outerShape);

  node.intersect = function (point) {
    log.info('iconSquare intersect', node, point);
    if (!node.label) {
      return intersect.rect(node, point);
    }
    const dx = node.x ?? 0;
    const dy = node.y ?? 0;
    const nodeHeight = node.height ?? 0;
    let points = [];
    if (topLabel) {
      points = [
        { x: dx - bbox.width / 2, y: dy - nodeHeight / 2 },
        { x: dx + bbox.width / 2, y: dy - nodeHeight / 2 },
        { x: dx + bbox.width / 2, y: dy - nodeHeight / 2 + bbox.height + labelPadding },
        { x: dx + imageWidth / 2, y: dy - nodeHeight / 2 + bbox.height + labelPadding },
        { x: dx + imageWidth / 2, y: dy + nodeHeight / 2 },
        { x: dx - imageWidth / 2, y: dy + nodeHeight / 2 },
        { x: dx - imageWidth / 2, y: dy - nodeHeight / 2 + bbox.height + labelPadding },
        { x: dx - bbox.width / 2, y: dy - nodeHeight / 2 + bbox.height + labelPadding },
      ];
    } else {
      points = [
        { x: dx - imageWidth / 2, y: dy - nodeHeight / 2 },
        { x: dx + imageWidth / 2, y: dy - nodeHeight / 2 },
        { x: dx + imageWidth / 2, y: dy - nodeHeight / 2 + imageHeight },
        { x: dx + bbox.width / 2, y: dy - nodeHeight / 2 + imageHeight },
        { x: dx + bbox.width / 2 / 2, y: dy + nodeHeight / 2 },
        { x: dx - bbox.width / 2, y: dy + nodeHeight / 2 },
        { x: dx - bbox.width / 2, y: dy - nodeHeight / 2 + imageHeight },
        { x: dx - imageWidth / 2, y: dy - nodeHeight / 2 + imageHeight },
      ];
    }

    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
}
