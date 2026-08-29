import type { Diagram } from '../../Diagram.js';
import type { TimingDiagramConfig } from '../../config.type.js';
import type { DiagramRenderer, DrawDefinition, SVGGroup } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { calculateTimelineEnd, niceTicks, positionSegments } from './timingUtils.js';
import type { PositionedTimingSegment, TimingDB, TimingSignal, TimingValue } from './types.js';

interface TimelineGeometry {
  x: (time: number) => number;
  xStart: number;
  xEnd: number;
  timelineEnd: number;
}

const MAX_CLOCK_CYCLES = 10_000;

const valueClass = (value: TimingValue): string => {
  const normalized = String(value).toLowerCase();
  return normalized === 'x' ? ' unknown' : normalized === 'z' ? ' high-impedance' : '';
};

const drawClock = (
  group: SVGGroup,
  signal: TimingSignal,
  geometry: TimelineGeometry,
  top: number,
  bottom: number
): void => {
  const clock = signal.clock!;
  const { x, timelineEnd } = geometry;
  const offset = Math.min(clock.offset, timelineEnd);
  let path = `M ${x(0)} ${bottom}`;
  if (offset > 0) {
    path += ` H ${x(offset)}`;
  }
  if (offset >= timelineEnd || clock.duty === 0) {
    path += ` H ${x(timelineEnd)}`;
    group.append('path').attr('class', 'timing-wave timing-clock').attr('d', path);
    return;
  }

  path += ` V ${top}`;
  if (clock.duty === 100) {
    path += ` H ${x(timelineEnd)}`;
    group.append('path').attr('class', 'timing-wave timing-clock').attr('d', path);
    return;
  }

  const cycleCount = Math.ceil((timelineEnd - clock.offset) / clock.period);
  if (!Number.isFinite(cycleCount) || cycleCount > MAX_CLOCK_CYCLES) {
    throw new Error(
      `Clock "${signal.id}" would render more than ${MAX_CLOCK_CYCLES} cycles; increase its period or shorten the timeline`
    );
  }

  let cycleStart = clock.offset;
  while (cycleStart < timelineEnd) {
    const highEnd = Math.min(cycleStart + (clock.period * clock.duty) / 100, timelineEnd);
    const cycleEnd = Math.min(cycleStart + clock.period, timelineEnd);
    path += ` H ${x(highEnd)}`;
    if (highEnd < timelineEnd) {
      path += ` V ${bottom} H ${x(cycleEnd)}`;
    }
    cycleStart += clock.period;
    if (cycleStart < timelineEnd) {
      path += ` V ${top}`;
    }
  }
  group.append('path').attr('class', 'timing-wave timing-clock').attr('d', path);
};

const binaryY = (value: TimingValue, top: number, bottom: number): number => {
  if (value === 1) {
    return top;
  }
  if (value === 0) {
    return bottom;
  }
  return (top + bottom) / 2;
};

const drawBinary = (
  group: SVGGroup,
  segments: PositionedTimingSegment[],
  geometry: TimelineGeometry,
  top: number,
  bottom: number
): void => {
  segments.forEach((segment, index) => {
    const y = binaryY(segment.value, top, bottom);
    if (index > 0) {
      const previousY = binaryY(segments[index - 1].value, top, bottom);
      group
        .append('line')
        .attr('class', 'timing-transition')
        .attr('x1', geometry.x(segment.start))
        .attr('x2', geometry.x(segment.start))
        .attr('y1', previousY)
        .attr('y2', y);
    }
    group
      .append('line')
      .attr('class', `timing-wave timing-binary${valueClass(segment.value)}`)
      .attr('x1', geometry.x(segment.start))
      .attr('x2', geometry.x(segment.end))
      .attr('y1', y)
      .attr('y2', y);
  });
};

const segmentPolygon = (
  segment: PositionedTimingSegment,
  geometry: TimelineGeometry,
  top: number,
  bottom: number
): string => {
  const x1 = geometry.x(segment.start);
  const x2 = geometry.x(segment.end);
  const middle = (top + bottom) / 2;
  const slant = Math.min(6, Math.max(0, (x2 - x1) / 4));
  return [
    `${x1},${middle}`,
    `${x1 + slant},${top}`,
    `${x2 - slant},${top}`,
    `${x2},${middle}`,
    `${x2 - slant},${bottom}`,
    `${x1 + slant},${bottom}`,
  ].join(' ');
};

const drawBoxedSegments = (
  group: SVGGroup,
  signal: TimingSignal,
  segments: PositionedTimingSegment[],
  geometry: TimelineGeometry,
  top: number,
  bottom: number
): void => {
  for (const segment of segments) {
    const kind = signal.type === 'bus' ? 'bus' : 'state';
    group
      .append('polygon')
      .attr('class', `timing-${kind}-segment${valueClass(segment.value)}`)
      .attr('points', segmentPolygon(segment, geometry, top, bottom));
    const width = geometry.x(segment.end) - geometry.x(segment.start);
    if (width >= 18) {
      group
        .append('text')
        .attr('class', `timing-${kind}-label`)
        .attr('x', (geometry.x(segment.start) + geometry.x(segment.end)) / 2)
        .attr('y', (top + bottom) / 2)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle')
        .text(String(segment.value));
    }
  }
};

const drawAnalog = (
  group: SVGGroup,
  signal: TimingSignal,
  segments: PositionedTimingSegment[],
  geometry: TimelineGeometry,
  top: number,
  bottom: number
): void => {
  if (segments.length === 0) {
    return;
  }
  const values = segments.map((segment) => Number(segment.value));
  let min = signal.analog?.min ?? Math.min(...values);
  let max = signal.analog?.max ?? Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  if (!Number.isFinite(range)) {
    throw new Error(`Analog signal "${signal.id}" must have a finite value range`);
  }
  const y = (value: TimingValue): number =>
    bottom - ((Number(value) - min) / range) * (bottom - top);

  let path = `M ${geometry.x(segments[0].start)} ${y(segments[0].value)}`;
  if (signal.analog?.interpolation === 'step') {
    for (const [index, segment] of segments.entries()) {
      path += ` H ${geometry.x(segment.end)}`;
      const next = segments[index + 1];
      if (next) {
        path += ` V ${y(next.value)}`;
      }
    }
  } else {
    for (const segment of segments.slice(1)) {
      path += ` L ${geometry.x(segment.start)} ${y(segment.value)}`;
    }
    const last = segments[segments.length - 1];
    path += ` L ${geometry.x(last.end)} ${y(last.value)}`;
  }
  group.append('path').attr('class', 'timing-wave timing-analog').attr('d', path);

  for (const segment of segments) {
    group
      .append('circle')
      .attr('class', 'timing-analog-point')
      .attr('cx', geometry.x(segment.start))
      .attr('cy', y(segment.value))
      .attr('r', 2.5);
  }
};

const signalMeta = (signal: TimingSignal): string => {
  if (signal.type === 'clock') {
    return `clock · period ${signal.clock!.period}`;
  }
  if (signal.type === 'analog') {
    return `analog · ${signal.analog!.interpolation}`;
  }
  return signal.type;
};

const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as TimingDB;
  const signals = db.getSignals();
  const config: Required<TimingDiagramConfig> = db.getConfig();
  const title = db.getDiagramTitle();
  const titleHeight = title ? 30 : 0;
  const timelineEnd = calculateTimelineEnd(signals);
  const totalWidth = config.padding * 2 + config.labelWidth + config.width;
  const lanesTop = config.padding + titleHeight + config.axisHeight;
  const lanesBottom = lanesTop + signals.length * config.rowHeight;
  const totalHeight = lanesBottom + config.padding;
  const xStart = config.padding + config.labelWidth;
  const xEnd = xStart + config.width;
  const geometry: TimelineGeometry = {
    x: (time) => xStart + (time / timelineEnd) * config.width,
    xStart,
    xEnd,
    timelineEnd,
  };

  const svg = selectSvgElement(id);
  svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
  configureSvgSize(svg, totalHeight, totalWidth, config.useMaxWidth);
  const root = svg.append('g').attr('class', 'timing-root');

  if (title) {
    root
      .append('text')
      .attr('class', 'timing-title')
      .attr('x', totalWidth / 2)
      .attr('y', config.padding)
      .attr('dominant-baseline', 'hanging')
      .attr('text-anchor', 'middle')
      .text(title);
  }

  const ticks = niceTicks(timelineEnd);
  for (const tick of ticks) {
    const x = geometry.x(tick);
    root
      .append('line')
      .attr('class', 'timing-grid-line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', lanesTop - 5)
      .attr('y2', lanesBottom);
    root
      .append('text')
      .attr('class', 'timing-tick-label')
      .attr('x', x)
      .attr('y', lanesTop - 10)
      .attr('text-anchor', 'middle')
      .text(String(tick));
  }
  root
    .append('text')
    .attr('class', 'timing-axis-label')
    .attr('x', xEnd)
    .attr('y', config.padding + titleHeight)
    .attr('dominant-baseline', 'hanging')
    .attr('text-anchor', 'end')
    .text(db.getTimeUnit() ? `Time (${db.getTimeUnit()})` : 'Time');

  signals.forEach((signal, index) => {
    const laneY = lanesTop + index * config.rowHeight;
    const center = laneY + config.rowHeight / 2;
    const waveTop = laneY + 9;
    const waveBottom = laneY + config.rowHeight - 9;
    const lane = root.append('g').attr('class', `timing-lane timing-lane-${signal.type}`);
    lane
      .append('rect')
      .attr('class', index % 2 === 0 ? 'timing-lane-background even' : 'timing-lane-background odd')
      .attr('x', xStart)
      .attr('y', laneY)
      .attr('width', config.width)
      .attr('height', config.rowHeight);
    lane
      .append('line')
      .attr('class', 'timing-lane-separator')
      .attr('x1', xStart)
      .attr('x2', xEnd)
      .attr('y1', laneY + config.rowHeight)
      .attr('y2', laneY + config.rowHeight);
    lane
      .append('text')
      .attr('class', 'timing-signal-label')
      .attr('x', config.padding)
      .attr('y', center - 5)
      .attr('dominant-baseline', 'middle')
      .text(signal.label);
    lane
      .append('text')
      .attr('class', 'timing-signal-meta')
      .attr('x', config.padding)
      .attr('y', center + 11)
      .attr('dominant-baseline', 'middle')
      .text(signalMeta(signal));

    if (signal.type === 'clock') {
      drawClock(lane, signal, geometry, waveTop, waveBottom);
      return;
    }
    const segments = positionSegments(signal, timelineEnd);
    if (signal.type === 'binary') {
      drawBinary(lane, segments, geometry, waveTop, waveBottom);
    } else if (signal.type === 'state' || signal.type === 'bus') {
      drawBoxedSegments(lane, signal, segments, geometry, waveTop, waveBottom);
    } else {
      drawAnalog(lane, signal, segments, geometry, waveTop, waveBottom);
    }
  });
};

export const renderer: DiagramRenderer = { draw };
export { draw };
