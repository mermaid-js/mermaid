export type SubGraphTitlePosition =
  | 'auto'
  | 'top'
  | 'top-left'
  | 'bottom'
  | 'bottom-left'
  | 'top-right'
  | 'bottom-right';

export interface SubGraphTitleRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GetSubGraphTitlePositionInput {
  position?: SubGraphTitlePosition;
  cluster: SubGraphTitleRect;
  label: Pick<SubGraphTitleRect, 'width' | 'height'>;
  occupiedRects?: SubGraphTitleRect[];
  topMargin?: number;
  bottomMargin?: number;
}

const AUTO_POSITION_ORDER: Exclude<SubGraphTitlePosition, 'auto'>[] = [
  'top',
  'top-left',
  'bottom',
  'bottom-left',
  'top-right',
  'bottom-right',
];

const rectsOverlap = (a: SubGraphTitleRect, b: SubGraphTitleRect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

const getCandidateRect = (
  position: Exclude<SubGraphTitlePosition, 'auto'>,
  cluster: SubGraphTitleRect,
  label: Pick<SubGraphTitleRect, 'width' | 'height'>,
  topMargin = 0,
  bottomMargin = 0
): SubGraphTitleRect => {
  const topY = cluster.y + topMargin;
  const bottomY = cluster.y + cluster.height - label.height - bottomMargin;
  const leftX = cluster.x;
  const centerX = cluster.x + (cluster.width - label.width) / 2;
  const rightX = cluster.x + cluster.width - label.width;

  switch (position) {
    case 'top-left':
      return { x: leftX, y: topY, width: label.width, height: label.height };
    case 'bottom':
      return { x: centerX, y: bottomY, width: label.width, height: label.height };
    case 'bottom-left':
      return { x: leftX, y: bottomY, width: label.width, height: label.height };
    case 'top-right':
      return { x: rightX, y: topY, width: label.width, height: label.height };
    case 'bottom-right':
      return { x: rightX, y: bottomY, width: label.width, height: label.height };
    case 'top':
    default:
      return { x: centerX, y: topY, width: label.width, height: label.height };
  }
};

export const getSubGraphTitlePosition = ({
  position = 'auto',
  cluster,
  label,
  occupiedRects = [],
  topMargin = 0,
  bottomMargin = 0,
}: GetSubGraphTitlePositionInput): SubGraphTitleRect => {
  if (position !== 'auto') {
    return getCandidateRect(position, cluster, label, topMargin, bottomMargin);
  }

  for (const candidate of AUTO_POSITION_ORDER) {
    const titleRect = getCandidateRect(candidate, cluster, label, topMargin, bottomMargin);
    let overlapsOccupiedRect = false;
    for (const occupiedRect of occupiedRects) {
      if (rectsOverlap(titleRect, occupiedRect)) {
        overlapsOccupiedRect = true;
        break;
      }
    }
    if (!overlapsOccupiedRect) {
      return titleRect;
    }
  }

  return getCandidateRect('top', cluster, label, topMargin, bottomMargin);
};
