import type { PositionedTimingSegment, TimingSignal } from './types.js';

const sequenceDuration = (signal: TimingSignal): number =>
  signal.sequence.reduce((total, segment) => total + segment.duration, 0);

export const calculateTimelineEnd = (signals: readonly TimingSignal[]): number => {
  const sequenceEnd = Math.max(0, ...signals.map(sequenceDuration));
  const eventTimes = [
    ...new Set(signals.flatMap((signal) => signal.events.map((event) => event.time))),
  ].sort((a, b) => a - b);

  let eventEnd = 0;
  if (eventTimes.length > 0) {
    const deltas = eventTimes
      .slice(1)
      .map((time, index) => time - eventTimes[index])
      .filter((delta) => delta > 0);
    const tail = deltas.length > 0 ? Math.min(...deltas) : sequenceEnd > 0 ? sequenceEnd : 1;
    eventEnd = eventTimes[eventTimes.length - 1] + tail;
  }

  const clockOnlyEnd = Math.max(
    0,
    ...signals
      .filter((signal) => signal.type === 'clock' && signal.clock)
      .map((signal) => signal.clock!.offset + signal.clock!.period * 4)
  );

  const timelineEnd = Math.max(1, sequenceEnd, eventEnd, clockOnlyEnd);
  if (!Number.isFinite(timelineEnd)) {
    throw new Error('Timing diagram timeline must have a finite end time');
  }
  return timelineEnd;
};

export const positionSegments = (
  signal: TimingSignal,
  timelineEnd: number
): PositionedTimingSegment[] => {
  if (signal.sequence.length > 0) {
    let cursor = 0;
    return signal.sequence.map((segment) => {
      const positioned = { ...segment, start: cursor, end: cursor + segment.duration };
      cursor = positioned.end;
      return positioned;
    });
  }

  return signal.events
    .filter((event) => event.time < timelineEnd)
    .map((event, index, events) => ({
      value: event.value,
      duration: (events[index + 1]?.time ?? timelineEnd) - event.time,
      start: event.time,
      end: events[index + 1]?.time ?? timelineEnd,
    }));
};

export const niceTicks = (timelineEnd: number, targetCount = 10): number[] => {
  if (!Number.isFinite(timelineEnd) || timelineEnd <= 0) {
    return [0, 1];
  }
  const roughStep = timelineEnd / Math.max(1, targetCount);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = multiplier * magnitude;
  const ticks: number[] = [];
  const precision = Math.max(0, -Math.floor(Math.log10(step)) + 2);

  for (let value = 0; value <= timelineEnd + step / 1000; value += step) {
    ticks.push(Number(value.toFixed(precision)));
  }
  if (timelineEnd - ticks[ticks.length - 1] > step / 4) {
    ticks.push(Number(timelineEnd.toFixed(precision)));
  }
  return ticks;
};
