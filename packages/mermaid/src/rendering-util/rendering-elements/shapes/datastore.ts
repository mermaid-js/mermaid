import type { Node, RectOptions } from '../../types.js';
import type { D3Selection } from '../../../types.js';
import { drawRect } from './drawRect.js';
import { userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

export async function datastore<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { cssClasses, labelPaddingX, labelPaddingY, padding, width, height } = node;

  const rectOptions: RectOptions = {
    rx: 0,
    ry: 0,
    classes: cssClasses ?? '',
    labelPaddingX: labelPaddingX ?? (padding ?? 0) * 2,
    labelPaddingY: labelPaddingY ?? padding ?? 0,
  };

  const rect = await drawRect(parent, node, rectOptions);

  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(rect);
    const nodeOverrideOptions = userNodeOverrides(node, {});

    const borderSelection = rect.select('.basic.label-container > path:nth-child(2)');
    const borderPath = borderSelection.node();
    if (!borderPath) {
      return rect;
    }

    let bbox: DOMRect | null = null;
    if (borderPath instanceof SVGGraphicsElement) {
      bbox = borderPath.getBBox();
    } else {
      return rect;
    }

    rect.insert(
      () => rc.line(bbox.x, bbox.y, bbox.x + bbox.width, bbox.y, nodeOverrideOptions),
      '.basic.label-container g.label'
    );
    rect.insert(
      () =>
        rc.line(
          bbox.x,
          bbox.y + bbox.height,
          bbox.x + bbox.width,
          bbox.y + bbox.height,
          nodeOverrideOptions
        ),
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
