export const boxLabels = ['D', 'U'] as const;
export const bodyLabels = ['CF', 'ACL', 'OHS', 'PL', 'SK', 'C', 'S', 'P'] as const;
export const middleLabels = ['Shared Kernel', 'Partnership', 'Customer/Supplier'] as const;
export const middleLabelsRelations: Partial<Record<BodyLabel, MiddleLabel>> = {
  SK: 'Shared Kernel',
  P: 'Partnership',
  C: 'Customer/Supplier',
  S: 'Customer/Supplier',
};
export type BoxLabel = (typeof boxLabels)[number];
export type BodyLabel = (typeof bodyLabels)[number];
export type MiddleLabel = (typeof middleLabels)[number];

export type Arrow = 'left' | 'right';
export type RawLabel = BoxLabel | BodyLabel;
export interface RawLink {
  source: { id: string; type: RawLabel[] };
  target: { id: string; type: RawLabel[] };
  arrow: Arrow[];
}
export interface Link {
  source: { id: string; boxText?: string; bodyText?: string };
  target: { id: string; boxText?: string; bodyText?: string };
  middleText?: string;
}

export function mapEdgeLabels(rawLink: RawLink): Link {
  let middleText: MiddleLabel | undefined = undefined;
  let boxTarget: BoxLabel | undefined = undefined;
  let boxSource: BoxLabel | undefined = undefined;
  let bodyTarget: BodyLabel | undefined = undefined;
  let bodySource: BodyLabel | undefined = undefined;
  for (const bodyLabel of bodyLabels) {
    if (
      rawLink.source.type.includes(bodyLabel) &&
      rawLink.target.type.includes(bodyLabel) &&
      !middleText
    ) {
      middleText = middleLabelsRelations[bodyLabel];
    }
  }
  if (
    ((rawLink.source.type.includes('C') && rawLink.target.type.includes('S')) ||
      (rawLink.source.type.includes('S') && rawLink.target.type.includes('C'))) &&
    !middleText
  ) {
    middleText = 'Customer/Supplier';
  }
  for (const boxLabel of boxLabels) {
    if (rawLink.source.type.includes(boxLabel)) {
      boxSource = boxLabel;
    }
    if (rawLink.target.type.includes(boxLabel)) {
      boxTarget = boxLabel;
    }
  }

  for (const bodyLabel of bodyLabels) {
    if (Object.keys(middleLabelsRelations).includes(bodyLabel)) {
      break;
    }

    if (rawLink.source.type.includes(bodyLabel)) {
      if (!bodySource) {
        bodySource = bodyLabel;
      } else {
        bodySource += ', ' + bodyLabel;
      }
    }

    if (rawLink.target.type.includes(bodyLabel)) {
      if (!bodyTarget) {
        bodyTarget = bodyLabel;
      } else {
        bodyTarget += ', ' + bodyLabel;
      }
    }
  }

  return {
    source: { id: rawLink.source.id, boxText: boxSource, bodyText: bodySource },
    target: { id: rawLink.target.id, boxText: boxTarget, bodyText: bodyTarget },
    middleText: middleText,
  };
}
