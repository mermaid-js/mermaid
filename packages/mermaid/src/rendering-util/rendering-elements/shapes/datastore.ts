import type { Node, RectOptions } from '../../types.js';
import type { D3Selection } from '../../../types.js';
import { drawRect } from './drawRect.js';
import { userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

export async function datastore<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { cssClasses, labelPaddingX, labelPaddingY, padding, width, height } = node;

  const options: RectOptions = {
    rx: 0,
    ry: 0,
    classes: cssClasses ?? '',
    labelPaddingX: labelPaddingX ?? (padding ?? 0) * 2,
    labelPaddingY: labelPaddingY ?? padding ?? 0,
  };

  const rect = await drawRect(parent, node, options);

  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(rect);
    const options = userNodeOverrides(node, {});

    const borderSelection = rect.select('.basic.label-container > path:nth-child(2)');
    const borderPath = borderSelection.node() as SVGPathElement;
    const bb = borderPath.getBBox();

    rect.insert(
      () => rc.line(bb.x, bb.y, bb.x + bb.width, bb.y, options),
      '.basic.label-container g.label'
    );
    rect.insert(
      () => rc.line(bb.x, bb.y + bb.height, bb.x + bb.width, bb.y + bb.height, options),
      '.basic.label-container g.label'
    );
    borderSelection.remove();
    return rect;
  }

  const selection = rect.select('.basic.label-container');
  const datastoreWidth = (Number(selection.attr('width')) || width) ?? 0;
  const datastoreHeight = (Number(selection.attr('height')) || height) ?? 0;
  if (datastoreWidth > 0 && datastoreHeight > 0) {
    selection.attr('stroke-dasharray', `${datastoreWidth} ${datastoreHeight}`);
  }

  return rect;
}
