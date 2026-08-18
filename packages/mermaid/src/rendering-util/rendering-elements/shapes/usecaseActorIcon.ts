import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { getIconSVG, isIconAvailable } from '../../icons.js';
import { userNodeOverrides } from './handDrawnShapeStyles.js';
import { renderUsecaseActor, type UsecaseActorNode } from './usecaseActor.js';

const ICON_FRAME_SIZE = 52;
const ICON_SIZE = 42;
const ICON_CENTER_Y = -2;

const drawIconActor = async (
  group: D3Selection<SVGGElement>,
  node: UsecaseActorNode
): Promise<void> => {
  const frameX = -ICON_FRAME_SIZE / 2;
  const frameY = ICON_CENTER_Y - ICON_FRAME_SIZE / 2;

  if (node.look === 'handDrawn') {
    // @ts-expect-error roughjs accepts the underlying SVG group through a D3 selection at runtime.
    const rc = rough.svg(group);
    const frame = rc.rectangle(
      frameX,
      frameY,
      ICON_FRAME_SIZE,
      ICON_FRAME_SIZE,
      userNodeOverrides(node, {})
    );
    group.insert(() => frame, ':first-child').attr('class', 'usecase-actor-icon-frame');
  } else {
    group
      .append('rect')
      .attr('class', 'usecase-actor-icon-frame')
      .attr('x', frameX)
      .attr('y', frameY)
      .attr('width', ICON_FRAME_SIZE)
      .attr('height', ICON_FRAME_SIZE)
      .attr('rx', 4)
      .attr('ry', 4);
  }

  const iconName = node.icon ?? '';
  const available = await isIconAvailable(iconName.includes(':') ? iconName : `fa:${iconName}`);
  const iconSvg = await getIconSVG(iconName, {
    height: ICON_SIZE,
    width: ICON_SIZE,
    fallbackPrefix: 'fa',
  });
  const iconGroup = group
    .append('g')
    .attr('class', `usecase-actor-icon-symbol${available ? '' : ' usecase-actor-icon-fallback'}`)
    .attr('aria-hidden', 'true')
    .html(`<g>${iconSvg}</g>`);

  const iconBox = iconGroup.node()?.getBBox();
  if (iconBox) {
    iconGroup.attr(
      'transform',
      `translate(${-iconBox.width / 2 - iconBox.x},${
        ICON_CENTER_Y - iconBox.height / 2 - iconBox.y
      })`
    );
  }
};

export async function usecaseActorIcon<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  return renderUsecaseActor(parent, node as UsecaseActorNode, 'icon', drawIconActor);
}
