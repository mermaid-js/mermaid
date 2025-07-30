import type { InternalHelpers, LayoutData, RenderOptions, SVG } from 'mermaid';
export declare const render: (data4Layout: LayoutData, svg: SVG, { common, getConfig, insertCluster, insertEdge, insertEdgeLabel, insertMarkers, insertNode, interpolateToCurve, labelHelper, log, positionEdgeLabel, }: InternalHelpers, { algorithm }: RenderOptions) => Promise<void>;
