import type { WardleyThemeVars } from './types.js';

interface MarkerDef {
  suffix: string;
  colorKey: keyof WardleyThemeVars;
}

const MARKER_DEFS: MarkerDef[] = [
  { suffix: 'dep-arrow', colorKey: 'arrowColor' },
  { suffix: 'flow-arrow', colorKey: 'flowColor' },
  { suffix: 'evolve-arrow', colorKey: 'evolveArrowColor' },
  { suffix: 'constraint-arrow', colorKey: 'constraintColor' },
];

/**
 * Appends SVG `<marker>` definitions for wardley map edge arrowheads.
 * Each marker ID is scoped to the diagram ID so multiple diagrams on the
 * same page never collide.
 */
export function defineMarkers(svg: any, diagramId: string, theme: WardleyThemeVars): void {
  const defs = svg.append('defs');

  for (const { suffix, colorKey } of MARKER_DEFS) {
    defs
      .append('marker')
      .attr('id', `wardley-${suffix}-${diagramId}`)
      .attr('markerWidth', 12)
      .attr('markerHeight', 12)
      .attr('refX', 10)
      .attr('refY', 3.5)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3.5, 0 7')
      .attr('fill', theme[colorKey]);
  }
}
