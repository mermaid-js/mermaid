import { AvoidLib } from 'libavoid-js';
import { log } from '../../../../logger.js';
import type { Edge, LayoutData } from '../../../types.js';
import type {
  LibavoidRoutingAdapter,
  LibavoidRoutingRequest,
  OrthogonalOptions,
  Point,
} from '../types.js';
import { ORTHO_DEBUG } from '../debug.js';

const DOMUS_LIBAVOID_ADAPTER = Symbol.for('domus.libavoidAdapter');

interface AvoidPoint {
  x: number;
  y: number;
}

interface AvoidPointVector {
  size(): number;
  get(index: number): AvoidPoint;
}

interface AvoidPolyline {
  ps: AvoidPointVector;
}

interface AvoidConnRef {
  setRoutingType(value: number): void;
  setHateCrossings(value: boolean): void;
  displayRoute(): AvoidPolyline;
}

// Opaque runtime object — no public fields. `object` (not `{}`) is
// what eslint's no-empty-object-type rule recommends; it preserves the
// "this is a non-null object" contract we get from libavoid-js.
type AvoidShapeRef = object;

interface AvoidRuntime {
  Point: new (x: number, y: number) => AvoidPoint;
  Rectangle: new (center: AvoidPoint, width: number, height: number) => unknown;
  Router: new (flags: number) => AvoidRouter;
  ShapeRef: new (router: AvoidRouter, polygon: unknown) => AvoidShapeRef;
  ShapeConnectionPin: new (
    shape: AvoidShapeRef,
    classId: number,
    xOffset: number,
    yOffset: number,
    proportional: boolean,
    insideOffset: number,
    visDirs: number
  ) => unknown;
  ConnEnd: {
    new (point: AvoidPoint): unknown;
    new (shape: AvoidShapeRef, classId: number): unknown;
  };
  ConnRef: new (router: AvoidRouter, src: unknown, dst: unknown) => AvoidConnRef;
  RouterFlag: { OrthogonalRouting: { value: number } };
  ConnType: { ConnType_Orthogonal: { value: number } };
  RoutingParameter: {
    shapeBufferDistance: { value: number };
    idealNudgingDistance: { value: number };
    crossingPenalty: { value: number };
    anglePenalty: { value: number };
    segmentPenalty: { value: number };
  };
  RoutingOption?: {
    nudgeOrthogonalSegmentsConnectedToShapes?: { value: number };
    penaliseOrthogonalSharedPathsAtConnEnds?: { value: number };
    nudgeOrthogonalTouchingColinearSegments?: { value: number };
    nudgeSharedPathsWithCommonEndPoint?: { value: number };
  };
  destroy?(obj: unknown): void;
}

interface AvoidRouter {
  setRoutingParameter(parameter: number, value: number): void;
  setRoutingOption?(option: number, value: boolean): void;
  processTransaction(): boolean | void;
}

function browserLibavoidWasmUrl(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  if (typeof process !== 'undefined' && process.versions?.node) {
    return undefined;
  }
  // Dev-explorer pages serve the WASM at `/dev/libavoid.wasm` (the
  // canonical historical path); demo pages outside the `/dev/` namespace
  // get the same file mirrored at root via the dev-server static route
  // added in `.esbuild/server.ts`. Pick the path that matches the page's
  // own URL so the request stays same-origin for either layout.
  const pathname = window.location.pathname || '/';
  return pathname.startsWith('/dev') ? '/dev/libavoid.wasm' : '/libavoid.wasm';
}

export async function loadLibavoidRuntime(): Promise<AvoidRuntime> {
  await AvoidLib.load(browserLibavoidWasmUrl());
  return AvoidLib.getInstance() as unknown as AvoidRuntime;
}

function toPoints(polyline: AvoidPolyline): Point[] {
  const vector = polyline.ps;
  const points: Point[] = [];
  for (let i = 0; i < vector.size(); i++) {
    const p = vector.get(i);
    points.push({ x: p.x, y: p.y });
  }
  return points;
}

function byId(data: LibavoidRoutingRequest['data'], edgeId: string): Edge | undefined {
  return (data.edges ?? []).find((edge) => String(edge?.id ?? '') === edgeId);
}

function pinOffsetsForSide(side: 'left' | 'right' | 'top' | 'bottom') {
  switch (side) {
    case 'left':
      return [{ x: 0, y: 0.5 }];
    case 'right':
      return [{ x: 1, y: 0.5 }];
    case 'top':
      return [{ x: 0.5, y: 0 }];
    case 'bottom':
      return [{ x: 0.5, y: 1 }];
  }
}

function flexiblePinOffsets() {
  return [
    { x: 0, y: 0.5 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 0 },
    { x: 0.5, y: 1 },
  ];
}

export function createLibavoidAdapter(runtime: AvoidRuntime): LibavoidRoutingAdapter {
  return ({ data, nodesById, edgeIds, spacing }: LibavoidRoutingRequest) => {
    const router = new runtime.Router(runtime.RouterFlag.OrthogonalRouting.value);
    const created: unknown[] = [router];
    const routes = new Map<string, Point[]>();
    const shapesByNodeId = new Map<string, AvoidShapeRef>();

    try {
      router.setRoutingParameter(
        runtime.RoutingParameter.shapeBufferDistance.value,
        Math.max(2, spacing / 2)
      );
      router.setRoutingParameter(runtime.RoutingParameter.idealNudgingDistance.value, spacing);
      router.setRoutingParameter(runtime.RoutingParameter.crossingPenalty.value, 50);
      router.setRoutingParameter(runtime.RoutingParameter.anglePenalty.value, 10);
      router.setRoutingParameter(runtime.RoutingParameter.segmentPenalty.value, 1);

      const nudgeOptions = [
        runtime.RoutingOption?.nudgeOrthogonalSegmentsConnectedToShapes,
        runtime.RoutingOption?.penaliseOrthogonalSharedPathsAtConnEnds,
        runtime.RoutingOption?.nudgeOrthogonalTouchingColinearSegments,
        runtime.RoutingOption?.nudgeSharedPathsWithCommonEndPoint,
      ].filter(Boolean) as { value: number }[];
      for (const option of nudgeOptions) {
        router.setRoutingOption?.(option.value, true);
      }

      for (const node of nodesById.values()) {
        if (node.isGroup) {
          continue;
        }
        const center = new runtime.Point(node.x ?? 0, node.y ?? 0);
        created.push(center);
        const rect = new runtime.Rectangle(center, node.width ?? 0, node.height ?? 0);
        created.push(rect);
        const shape = new runtime.ShapeRef(router, rect);
        created.push(shape);
        shapesByNodeId.set(String(node.id), shape);
      }

      const conns = new Map<string, AvoidConnRef>();
      let shapeAnchoredCount = 0;
      let pointAnchoredCount = 0;
      for (const edgeId of edgeIds) {
        const edge = byId(data, edgeId);
        const points = edge?.points ?? [];
        if (!edge || points.length < 2) {
          continue;
        }

        const startNodeId = edge.start != null ? String(edge.start) : '';
        const endNodeId = edge.end != null ? String(edge.end) : '';
        const startShape = startNodeId ? shapesByNodeId.get(startNodeId) : undefined;
        const endShape = endNodeId ? shapesByNodeId.get(endNodeId) : undefined;

        let src: unknown;
        let dst: unknown;

        if (startShape && endShape) {
          const sided = edge as {
            startSide?: Parameters<typeof pinOffsetsForSide>[0];
            endSide?: Parameters<typeof pinOffsetsForSide>[0];
          };
          const startPins = sided.startSide
            ? pinOffsetsForSide(sided.startSide)
            : flexiblePinOffsets();
          const endPins = sided.endSide ? pinOffsetsForSide(sided.endSide) : flexiblePinOffsets();
          for (const pin of startPins) {
            const shapePin = new runtime.ShapeConnectionPin(
              startShape,
              1,
              pin.x,
              pin.y,
              true,
              0,
              0
            );
            created.push(shapePin);
          }
          for (const pin of endPins) {
            const shapePin = new runtime.ShapeConnectionPin(endShape, 1, pin.x, pin.y, true, 0, 0);
            created.push(shapePin);
          }
          src = new runtime.ConnEnd(startShape, 1);
          dst = new runtime.ConnEnd(endShape, 1);
          shapeAnchoredCount++;
        } else {
          const start = points[0];
          const end = points[points.length - 1];
          const srcPoint = new runtime.Point(start.x, start.y);
          const dstPoint = new runtime.Point(end.x, end.y);
          created.push(srcPoint, dstPoint);
          src = new runtime.ConnEnd(srcPoint);
          dst = new runtime.ConnEnd(dstPoint);
          pointAnchoredCount++;
        }
        created.push(src, dst);
        const conn = new runtime.ConnRef(router, src, dst);
        created.push(conn);
        conn.setRoutingType(runtime.ConnType.ConnType_Orthogonal.value);
        conn.setHateCrossings(true);
        conns.set(edgeId, conn);
      }

      router.processTransaction();

      for (const [edgeId, conn] of conns) {
        routes.set(edgeId, toPoints(conn.displayRoute()));
      }

      const target = data as LayoutData & {
        __libavoidReport?: { adapterCalls?: unknown[] } & Record<string, unknown>;
      };
      const adapterCall = {
        requestedEdgeCount: edgeIds.length,
        routedEdgeCount: routes.size,
        shapeAnchoredCount,
        pointAnchoredCount,
      };
      const previousAdapterCalls = target.__libavoidReport?.adapterCalls ?? [];
      target.__libavoidReport = {
        ...(target.__libavoidReport ?? {}),
        adapterCalls: [...previousAdapterCalls, adapterCall],
      };
      log.warn(ORTHO_DEBUG, 'LIBAVOID_ADAPTER_ROUTED', adapterCall);

      return routes;
    } finally {
      for (const obj of created.reverse()) {
        try {
          runtime.destroy?.(obj);
        } catch {
          // best-effort cleanup only
        }
      }
    }
  };
}

export async function createLoadedLibavoidAdapter(): Promise<LibavoidRoutingAdapter> {
  return createLibavoidAdapter(await loadLibavoidRuntime());
}

export async function preloadLibavoidAdapterForLayout(data: LayoutData): Promise<void> {
  const target = data as LayoutData & {
    [DOMUS_LIBAVOID_ADAPTER]?: LibavoidRoutingAdapter | null;
    __libavoidReport?: Record<string, unknown>;
  };
  target.__libavoidReport ??= { adapterCalls: [] };
  if (target[DOMUS_LIBAVOID_ADAPTER] !== undefined) {
    return;
  }
  try {
    target[DOMUS_LIBAVOID_ADAPTER] = await createLoadedLibavoidAdapter();
    target.__libavoidReport = {
      ...(target.__libavoidReport ?? {}),
      preload: { ok: true },
    };
    log.warn(ORTHO_DEBUG, 'LIBAVOID_PRELOAD_OK');
  } catch (error) {
    target[DOMUS_LIBAVOID_ADAPTER] = null;
    target.__libavoidReport = {
      ...(target.__libavoidReport ?? {}),
      preload: {
        ok: false,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      },
    };
    log.warn(ORTHO_DEBUG, 'LIBAVOID_PRELOAD_FAILED', {
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
  }
}

export function withDefaultLibavoidFallback(
  data: LayoutData,
  options: OrthogonalOptions
): OrthogonalOptions {
  const target = data as LayoutData & {
    [DOMUS_LIBAVOID_ADAPTER]?: LibavoidRoutingAdapter | null;
    __libavoidReport?: Record<string, unknown>;
  };
  target.__libavoidReport ??= { adapterCalls: [] };
  const adapter = target[DOMUS_LIBAVOID_ADAPTER];
  if (!adapter || options.libavoidAdapter || options.libavoidFallback === false) {
    if (!adapter) {
      target.__libavoidReport = {
        ...(target.__libavoidReport ?? {}),
        defaults: { enabled: false, reason: 'adapter-unavailable' },
      };
      log.warn(ORTHO_DEBUG, 'LIBAVOID_DEFAULTS_SKIPPED', {
        reason: 'adapter-unavailable',
      });
    }
    return options;
  }
  // Once a libavoid adapter is available, use the same aggressive thresholds
  // in browser rendering and DDLT. Both paths call this helper after
  // `preloadLibavoidAdapterForLayout`, so keeping the decision here preserves
  // one shared flow instead of making DDLT less eager than the browser.
  const aggressive = true;
  const next = {
    ...options,
    libavoidFallback: true,
    libavoidCrossingThreshold: options.libavoidCrossingThreshold ?? (aggressive ? 0 : 2),
    libavoidRenderedDiagonalThreshold:
      options.libavoidRenderedDiagonalThreshold ?? (aggressive ? 0 : 2),
    libavoidMaxEdgeBendsThreshold: options.libavoidMaxEdgeBendsThreshold ?? (aggressive ? 2 : 4),
    libavoidAllEdges: options.libavoidAllEdges,
    libavoidAdapter: adapter,
    libavoidAggressive: options.libavoidAggressive ?? aggressive,
  };
  target.__libavoidReport = {
    ...(target.__libavoidReport ?? {}),
    defaults: {
      enabled: true,
      crossingThreshold: next.libavoidCrossingThreshold,
      renderedDiagonalThreshold: next.libavoidRenderedDiagonalThreshold,
      maxEdgeBendsThreshold: next.libavoidMaxEdgeBendsThreshold,
      allEdges: next.libavoidAllEdges,
      aggressive: next.libavoidAggressive,
    },
  };
  log.warn(ORTHO_DEBUG, 'LIBAVOID_DEFAULTS_ENABLED', {
    crossingThreshold: next.libavoidCrossingThreshold,
    renderedDiagonalThreshold: next.libavoidRenderedDiagonalThreshold,
    maxEdgeBendsThreshold: next.libavoidMaxEdgeBendsThreshold,
    allEdges: next.libavoidAllEdges,
    aggressive: next.libavoidAggressive,
  });
  return next;
}
