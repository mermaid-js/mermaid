/**
 * BPMN paints its shapes exclusively from `themeVariables.bpmn`.
 *
 * `diagrams/bpmn/styles.ts` is the only stylesheet that can reach a BPMN shape (mermaid
 * scopes diagram CSS with the rendered svg's id, so a page stylesheet can never win), and
 * it reads every colour off this sub-object. A theme that omits a key therefore doesn't
 * break - it silently falls back to a generic node colour nobody tuned for BPMN, which is
 * exactly the regression this spec is here to catch. Every registered theme has to define
 * the whole set, not only the five built-ins the e2e theme matrix covers.
 */
import { describe, expect, it } from 'vitest';
import themes from './index.js';

const BPMN_KEYS = [
  'eventFill',
  'eventStroke',
  'eventStrokeWidth',
  'endEventStroke',
  'endEventStrokeWidth',
  'gatewayFill',
  'gatewayStroke',
  'gatewayStrokeWidth',
  'activityFill',
  'activityStroke',
  'activityStrokeWidth',
  'glyphColor',
  'dataFill',
  'dataStroke',
  'annotationStroke',
  'laneFill',
  'laneStroke',
  'laneLabelColor',
  'labelColor',
  'edgeStroke',
  'messageStroke',
] as const;

const themeNames = Object.keys(themes) as (keyof typeof themes)[];

const getBpmn = (name: keyof typeof themes, overrides: Record<string, unknown> = {}) =>
  (themes[name].getThemeVariables(overrides) as { bpmn?: Record<string, unknown> }).bpmn;

describe('bpmn theme variables', () => {
  it.each(themeNames)('%s defines a bpmn namespace', (name) => {
    expect(getBpmn(name)).toBeTypeOf('object');
  });

  it.each(themeNames)('%s defines every bpmn key', (name) => {
    const bpmn = getBpmn(name) ?? {};
    const missing = BPMN_KEYS.filter((key) => !bpmn[key]);
    expect(missing, `${name} is missing: ${missing.join(', ')}`).toEqual([]);
  });

  it.each(themeNames)('%s honours a bpmn override', (name) => {
    const bpmn = getBpmn(name, { bpmn: { activityFill: '#abcdef' } });
    expect(bpmn?.activityFill).toBe('#abcdef');
  });

  it.each(themeNames)('%s keeps the end event heavier than a start event', (name) => {
    const bpmn = getBpmn(name) ?? {};
    expect(Number(bpmn.endEventStrokeWidth)).toBeGreaterThan(Number(bpmn.eventStrokeWidth));
  });
});
