import type { Diagram } from '../../Diagram.js';
import type { RadarDiagramConfig } from '../../config.type.js';
import type { DiagramRenderer, DrawDefinition, SVG, SVGGroup } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import type { RadarDB, RadarAxis, RadarCurve, TickLabels } from './types.js';

const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as RadarDB;
  const axes = db.getAxes();
  const curves = db.getCurves();
  const options = db.getOptions();
  const config = db.getConfig();
  const title = db.getDiagramTitle();

  const svg: SVG = selectSvgElement(id);

  // 🖼️ Draw the main frame
  const g = drawFrame(svg, config);

  // The maximum value for the radar chart is the 'max' option if it exists,
  // otherwise it is the maximum value of the curves
  const maxValue: number =
    options.max ?? Math.max(...curves.map((curve) => Math.max(...curve.entries)));
  const minValue: number = options.min;
  const radius = Math.min(config.width, config.height) / 2;

  // 🕸️ Draw graticule
  drawGraticule(g, axes, radius, options.ticks, options.graticule);

  // 🪓 Draw the axes
  drawAxes(g, axes, radius, config);

  // 📏 Draw the tick labels
  drawTickLabels(g, axes, radius, options.ticks, options.tickLabels, options.tickLabelsAxis);

  // 📊 Draw the curves
  drawCurves(g, axes, curves, minValue, maxValue, options.graticule, config);

  // 🏷 Draw Legend
  drawLegend(g, curves, options.showLegend, config);

  // 🏷 Draw Title
  g.append('text')
    .attr('class', 'radarTitle')
    .text(title)
    .attr('x', 0)
    .attr('y', -config.height / 2 - config.marginTop);
};

// Returns a g element to center the radar chart
// it is of type SVGElement
const drawFrame = (svg: SVG, config: Required<RadarDiagramConfig>): SVGGroup => {
  const totalWidth = config.width + config.marginLeft + config.marginRight;
  const totalHeight = config.height + config.marginTop + config.marginBottom;
  const center = {
    x: config.marginLeft + config.width / 2,
    y: config.marginTop + config.height / 2,
  };
  // Initialize the SVG
  svg
    .attr('viewbox', `0 0 ${totalWidth} ${totalHeight}`)
    .attr('width', totalWidth)
    .attr('height', totalHeight);
  // g element to center the radar chart
  return svg.append('g').attr('transform', `translate(${center.x}, ${center.y})`);
};

const _getAngleOffset = (angle: number) => {
  // Convert angle to degrees for easier comparison
  const degrees = angle * (180 / Math.PI);

  // Define angle ranges with ±22.5° tolerance (45° / 2)
  if (degrees >= -112.5 && degrees < -67.5) {
    // Around 12 o'clock (-90°)
    return { x: 10, y: 0 };
  } else if (degrees >= -67.5 && degrees < -22.5) {
    // Around 2 o'clock (-45°)
    return { x: 7.5, y: 7.5 };
  } else if (degrees >= -22.5 && degrees < 22.5) {
    // Around 3 o'clock (0°)
    return { x: 0, y: 7.5 };
  } else if (degrees >= 22.5 && degrees < 67.5) {
    // Around 4 o'clock (45°)
    return { x: 10, y: -5 };
  } else if (degrees >= 67.5 && degrees < 112.5) {
    // Around 6 o'clock (90°)
    return { x: -10, y: 0 };
  } else if (degrees >= 112.5 && degrees < 157.5) {
    // Around 7 o'clock (135°)
    return { x: -7.5, y: -7.5 };
  } else if (degrees >= 157.5 && degrees < 202.5) {
    // Around 9 o'clock (180°)
    return { x: 0, y: -7.5 };
  } else if (degrees >= 202.5 && degrees < 247.5) {
    // Around 10 o'clock (225°)
    return { x: -7.5, y: 7.5 };
  }

  // Default offset if no range matches
  return { x: 0, y: 0 };
};

const drawGraticule = (
  g: SVGGroup,
  axes: RadarAxis[],
  radius: number,
  ticks: number,
  graticule: string
) => {
  if (graticule === 'circle') {
    // Draw a circle for each tick
    for (let i = 0; i < ticks; i++) {
      const r = (radius * (i + 1)) / ticks;
      g.append('circle').attr('r', r).attr('class', 'radarGraticule');
    }
  } else if (graticule === 'polygon') {
    // Draw a polygon
    const numAxes = axes.length;
    for (let i = 0; i < ticks; i++) {
      const r = (radius * (i + 1)) / ticks;
      const points = axes
        .map((_, j) => {
          const angle = (2 * j * Math.PI) / numAxes - Math.PI / 2;
          const x = r * Math.cos(angle);
          const y = r * Math.sin(angle);
          return `${x},${y}`;
        })
        .join(' ');
      g.append('polygon').attr('points', points).attr('class', 'radarGraticule');
    }
  }
};

const drawAxes = (
  g: SVGGroup,
  axes: RadarAxis[],
  radius: number,
  config: Required<RadarDiagramConfig>
) => {
  const numAxes = axes.length;

  for (let i = 0; i < numAxes; i++) {
    const label = axes[i].label;
    const angle = (2 * i * Math.PI) / numAxes - Math.PI / 2;
    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', radius * config.axisScaleFactor * Math.cos(angle))
      .attr('y2', radius * config.axisScaleFactor * Math.sin(angle))
      .attr('class', 'radarAxisLine');
    g.append('text')
      .text(label)
      .attr('x', radius * config.axisLabelFactor * Math.cos(angle))
      .attr('y', radius * config.axisLabelFactor * Math.sin(angle))
      .attr('class', 'radarAxisLabel');
  }
};

function drawTickLabels(
  g: SVGGroup,
  axes: RadarAxis[],
  radius: number,
  ticks: number,
  tickLabels: TickLabels,
  tickLabelsAxis: number | null
) {
  const numAxes = axes.length;
  for (let tickIdx = 0; tickIdx < ticks; tickIdx++) {
    const r = (radius * (tickIdx + 1)) / ticks;
    const {
      labels: { [tickIdx]: label },
    } = tickLabels;

    axes.forEach((_, axisIdx) => {
      const angle = (2 * axisIdx * Math.PI) / numAxes - Math.PI / 2;
      const angleLabelOffsets = _getAngleOffset(angle);
      const xWithOffset = r * Math.cos(angle) + angleLabelOffsets.x;
      const yWithOffset = r * Math.sin(angle) + angleLabelOffsets.y;

      const drawForAxis = tickLabelsAxis === null || axisIdx === tickLabelsAxis - 1;
      if (drawForAxis) {
        g.append('text')
          .text(label)
          .attr('x', xWithOffset)
          .attr('y', yWithOffset)
          .attr('class', 'radarAxisLegendLabel');
      }
    });
  }
}

function drawCurves(
  g: SVGGroup,
  axes: RadarAxis[],
  curves: RadarCurve[],
  minValue: number,
  maxValue: number,
  graticule: string,
  config: Required<RadarDiagramConfig>
) {
  const numAxes = axes.length;
  const radius = Math.min(config.width, config.height) / 2;

  curves.forEach((curve, index) => {
    if (curve.entries.length !== numAxes) {
      // Skip curves that do not have an entry for each axis.
      return;
    }
    // Compute points for the curve.
    const points = curve.entries.map((entry, i) => {
      const angle = (2 * Math.PI * i) / numAxes - Math.PI / 2;
      const r = relativeRadius(entry, minValue, maxValue, radius);
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      return { x, y };
    });

    if (graticule === 'circle') {
      // Draw a closed curve through the points.
      g.append('path')
        .attr('d', closedRoundCurve(points, config.curveTension))
        .attr('class', `radarCurve-${index}`);
    } else if (graticule === 'polygon') {
      // Draw a polygon for each curve.
      g.append('polygon')
        .attr('points', points.map((p) => `${p.x},${p.y}`).join(' '))
        .attr('class', `radarCurve-${index}`);
    }
  });
}

export function relativeRadius(
  value: number,
  minValue: number,
  maxValue: number,
  radius: number
): number {
  const clippedValue = Math.min(Math.max(value, minValue), maxValue);
  return (radius * (clippedValue - minValue)) / (maxValue - minValue);
}

export function closedRoundCurve(points: { x: number; y: number }[], tension: number): string {
  // Catmull-Rom spline helper function
  const numPoints = points.length;
  let d = `M${points[0].x},${points[0].y}`;
  // For each segment from point i to point (i+1) mod n, compute control points.
  for (let i = 0; i < numPoints; i++) {
    const p0 = points[(i - 1 + numPoints) % numPoints];
    const p1 = points[i];
    const p2 = points[(i + 1) % numPoints];
    const p3 = points[(i + 2) % numPoints];
    // Calculate the control points for the cubic Bezier segment
    const cp1 = {
      x: p1.x + (p2.x - p0.x) * tension,
      y: p1.y + (p2.y - p0.y) * tension,
    };
    const cp2 = {
      x: p2.x - (p3.x - p1.x) * tension,
      y: p2.y - (p3.y - p1.y) * tension,
    };
    d += ` C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${p2.x},${p2.y}`;
  }
  return `${d} Z`;
}

function drawLegend(
  g: SVGGroup,
  curves: RadarCurve[],
  showLegend: boolean,
  config: Required<RadarDiagramConfig>
) {
  if (!showLegend) {
    return;
  }

  // Create a legend group and position it in the top-right corner of the chart.
  const legendX = ((config.width / 2 + config.marginRight) * 3) / 4;
  const legendY = (-(config.height / 2 + config.marginTop) * 3) / 4;
  const lineHeight = 20;

  curves.forEach((curve, index) => {
    const itemGroup = g
      .append('g')
      .attr('transform', `translate(${legendX}, ${legendY + index * lineHeight})`);

    // Draw a square marker for this curve.
    itemGroup
      .append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('class', `radarLegendBox-${index}`);

    // Draw the label text next to the marker.
    itemGroup
      .append('text')
      .attr('x', 16)
      .attr('y', 0)
      .attr('class', 'radarLegendText')
      .text(curve.label);
  });
}

export const renderer: DiagramRenderer = { draw };
