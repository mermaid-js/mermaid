import type { Selection } from 'd3';
import { log } from '../logger.js';

// Map of direction keywords to angles in degrees
export const directionMap = (direction: string, width: number, height: number): number => {
  const error = () => {
    throw new Error(`Invalid direction keyword found in gradient: '${direction}'`);
  };
  const base = { bottom: 180, top: 0, left: 270, right: 90 };
  const diagonal = Math.atan2(height, width) * (180 / Math.PI);
  const normalized = direction
    .split(' ')
    .filter((dir) => dir in base)
    .sort()
    .join(' ');
  if (!normalized) {
    error();
  }
  return (
    base[normalized as keyof typeof base] ??
    {
      'left top': 360 - diagonal,
      'right top': diagonal,
      'bottom left': 180 + diagonal,
      'bottom right': 180 - diagonal,
    }[normalized] ??
    error()
  );
};

// Validate a color string according to CSS color syntax
function isValidColor(color: string): boolean {
  if (window?.CSS) {
    return window.CSS.supports('color', color);
  }
  // Fallback to the built-in validation
  const s = new Option().style;
  s.color = color;
  return s.color !== '';
}

/**
 * Calculates the distance L between two parallel tangent lines at a given angle for a specified SVG shape.
 * Replicates the behavior of CSS linear gradients based on https://www.w3.org/TR/css-images-4/#linear-gradients
 * @see {@link https://www.w3.org/TR/css-images-4/#linear-gradients|CSS linear-gradient() notation} for the formal syntax.
 *
 * @param shapeElement - The D3 selection of the SVG shape.
 * @param angleDeg - The clockwise angle in degrees between the upward vertical axis and the gradient line.
 * @param numSamplePoints - The number of points to sample along the shape's path for path elements (default: 150).
 * @returns - The distance between the two parallel tangent lines to the shape at the given angle.
 */
export function getGradientLineLength(
  shapeElement: Selection<SVGGraphicsElement, unknown, HTMLElement, any>,
  angleDeg: number,
  numSamplePoints = 150
) {
  const angleRad = angleDeg * (Math.PI / 180);
  const perpendicularAngle = angleRad + Math.PI / 2;
  const node = shapeElement.node();

  // See https://patrickbrosset.medium.com/do-you-really-understand-css-linear-gradients-631d9a895caf
  if (node instanceof SVGRectElement) {
    // Rectangle
    log.debug('Calculating gradient line length for a rectangle...');
    const bbox = node.getBBox();
    const w = bbox.width; // node.getAttribute('width') does not reflect the width property set in classDefs
    const h = bbox.height; // Same as above for height
    return Math.abs(w * Math.sin(angleRad)) + Math.abs(h * Math.cos(angleRad));
  } else if (node instanceof SVGCircleElement) {
    // Circle
    log.debug('Calculating gradient line length for a circle...');
    const r = parseFloat(node.getAttribute('r') || '0');
    return 2 * r;
  } else if (node instanceof SVGEllipseElement) {
    // Ellipse
    log.debug('Calculating gradient line length for an ellipse...');
    const a = parseFloat(node.getAttribute('rx') || '0');
    const b = parseFloat(node.getAttribute('ry') || '0');
    return 2 * Math.sqrt((a * Math.sin(angleRad)) ** 2 + (b * Math.cos(angleRad)) ** 2);
  } else if (node instanceof SVGPolygonElement) {
    // Polygon
    log.debug('Calculating gradient line length for a polygon...');
    const pointsAttr = node.getAttribute('points')!;

    // Extract the vertices of the polygon
    const points = pointsAttr
      .trim()
      .split(/\s+/)
      .map((pt) => {
        const [x, y] = pt.split(',').map(Number);
        return { x, y };
      });

    // Project each vertex onto the perpendicular direction
    const projections = points.map(
      (pt) => pt.x * Math.cos(perpendicularAngle) + pt.y * Math.sin(perpendicularAngle)
    );

    // Calculate the length of the gradient line based on the min/max projections
    return Math.max(...projections) - Math.min(...projections);
  } else if (node instanceof SVGPathElement) {
    // For more arbitrary shapes, sample many points along the path
    log.debug('Calculating gradient line length for a path...');
    const totalLength = node.getTotalLength();

    const points = [];
    for (let i = 0; i <= numSamplePoints; i++) {
      const t = (i / numSamplePoints) * totalLength;
      const pt = node.getPointAtLength(t);
      points.push({ x: pt.x, y: pt.y });
    }

    // Project points onto the perpendicular direction
    const projections = points.map(
      (pt) => pt.x * Math.cos(perpendicularAngle) + pt.y * Math.sin(perpendicularAngle)
    );

    // Calculate the length of the gradient line based on the min/max projections
    return Math.max(...projections) - Math.min(...projections);
  } else {
    throw Error(`Unsupported shape type for gradient line length calculation: ${node?.tagName}`);
  }
}

// Value mixing function for color/position interpolation
const mix = (a: number, b: number, t: number) => a * (1 - t) + b * t;

// Extract RGBA values from any valid CSS color
const getRGBA = (color: string) => {
  if (color === 'HINT') {
    return { r: 0, g: 0, b: 0, a: 0 }; // A placeholder that will be replaced with interpolated values
  }
  // Create a temporary <option> element to parse the color
  const option = new Option();
  option.style.color = color;
  document.body.appendChild(option);
  const computedColor = getComputedStyle(option).color;
  document.body.removeChild(option);
  const matches = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(computedColor);

  // Destructure the matched values into r, g, b, and a components
  if (matches) {
    const [, r = 0, g = 0, b = 0, a = 1] = matches;
    return {
      r: parseFloat(String(r)),
      g: parseFloat(String(g)),
      b: parseFloat(String(b)),
      a: parseFloat(String(a)),
    };
  } else {
    throw new Error(
      `Cannot parse RGBA values from color '${color}'. Got computed color '${computedColor}'.`
    );
  }
};

/**
 * Non-linear color interpolation between start and end colors based on a transition hint
 * Positions must be relative to the total interval and fractional in the range [0, 1], e.g. 0.23 instead of 23/
 * @see {@link https://www.w3.org/TR/css-color-4/#interpolation|CSS color interpolation} for more details.
 *
 * @param start - The RGBA values for the start color.
 * @param end - The RGBA values for the end color.
 * @param pos - The relative position of the point we want to interpolate the color for.
 * @param hint - The relative position of the transition hint between the start and end colors (default: 0.5, i.e., linear interpolation).
 * @returns - The interpolated color as an RGBA string
 */
const interpolateColor = (
  start: { r: number; g: number; b: number; a: number },
  end: { r: number; g: number; b: number; a: number },
  pos: number,
  hint = 0.5
): string => {
  // Color weighting factor based on the transition hint
  let C = hint > 0 ? Math.pow(pos, Math.log(0.5) / Math.log(hint)) : 1;
  C = Math.min(Math.max(C, 0), 1); // Clamp between 0 and 1 just in case

  // Interpolate RGBA channels premultiplied by alpha
  let r = mix(start.r * start.a, end.r * end.a, C);
  let g = mix(start.g * start.a, end.g * end.a, C);
  let b = mix(start.b * start.a, end.b * end.a, C);
  const a = mix(start.a, end.a, C);

  // Un-premultiply RGB channels by alpha only if alpha is not zero
  if (a !== 0) {
    r = Math.round(r / a);
    g = Math.round(g / a);
    b = Math.round(b / a);
  }

  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// Generate interpolated positions around the transition hint
const generateStops = (
  start: number,
  hint: number,
  end: number,
  n: number,
  includeStart = false,
  includeEnd = false
): number[] => {
  if (n < 0 && n % 2 === 0) {
    throw new Error(
      'Total number of stops (excluding start and end) must be positive and odd for symmetry.'
    );
  }
  const half = (n - 1) / 2; // Number of stops between start->hint and hint->end
  return [
    // Conditionally include start
    ...(includeStart ? [start] : []),
    // Intermediate stops between start and hint (excluding start)
    ...Array.from({ length: half }, (_, i) => mix(start, hint, (i + 1) / (half + 1))),
    // Include the hint position
    hint,
    // Intermediate stops between hint and end (excluding end)
    ...Array.from({ length: half }, (_, i) => mix(hint, end, (i + 1) / (half + 1))),
    // Conditionally include end
    ...(includeEnd ? [end] : []),
  ];
};

/**
 * Creates an SVG linear gradient element given a CSS-like linear-gradient definition
 * consisting of an angle/direction and color stops.
 *
 * @param svgSelection - The SVG selection to which the linear gradient will be appended.
 * @param shapeElement - The SVG shape element to which the gradient will be applied.
 * @param linearGradientStyle - A CSS-like linear-gradient string specifying the gradient angle/direction (optional) and color stops (color and position).
 * @param gradientId - The unique ID for the created linear gradient in the SVG's <defs> section.
 * @param linearInterpOnly - Restricts to linear interpolation, skipping transition hints and opacity gradients between stops (default: false).
 * @returns void - The function does not return a value. In-place modifications are made to the SVG element.
 */
export function createLinearGradient(
  svgSelection: Selection<SVGSVGElement, unknown, null, undefined>,
  shapeElement: Selection<SVGGraphicsElement, unknown, HTMLElement, any>,
  linearGradientStyle: string,
  gradientId: string,
  linearInterpOnly = false
): void {
  log.debug(`Creating linear gradient for ${gradientId}: ${linearGradientStyle}`);

  // Throw an error if the gradient style is empty
  if (linearGradientStyle.trim() === '') {
    throw new Error('Linear gradient found with empty style.');
  }

  // Test if the double comma pattern exists in the input string to avoid user errors
  if (/,\s*,/.test(linearGradientStyle)) {
    throw new Error('Found consecutive commas (,,) in the gradient string.');
  }

  // Calculate the dimensions of the node's bounding box
  const bbox = shapeElement.node()!.getBBox();
  const nodeWidth = bbox.width;
  const nodeHeight = bbox.height;
  log.debug(`Dimensions of node bounding box: width = ${nodeWidth}px, height = ${nodeHeight}px`);

  // Split the gradient details into a potential direction and color stops
  const parts = /^([^,]+),\s*(.+)$/.exec(linearGradientStyle) || [];
  log.debug('Parsed gradient parts:', parts);

  let angleDeg = 180; // Default angle is 180deg (top to bottom) following CSS convention
  let hasAngleOrDirectionKwd = true;

  // Handle numeric angles (e.g., -45deg, +12deg, 1rad, 0.25turn) or directional keywords (e.g., to right, to top left)
  if (parts?.[1]) {
    if (/deg|turn|grad|rad/.test(parts[1])) {
      const match = /^(.+?)(deg|turn|grad|rad)$/.exec(parts[1]);
      const [_, value, unit] = match ? match : [null, String(angleDeg), 'deg'];
      if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(value) === false) {
        // Allow positive/negative numbers with optional decimal points
        throw new Error(`Invalid angle value found in gradient: '${parts[1]}'`);
      }
      angleDeg =
        unit === 'turn'
          ? parseFloat(value) * 360
          : unit === 'grad'
            ? parseFloat(value) * 0.9
            : unit === 'rad'
              ? parseFloat(value) * (180 / Math.PI)
              : parseFloat(value);
      log.debug(
        `Angle ${value}${unit} ${unit === 'deg' ? 'is already in degrees, no conversion needed' : `is converted to ${angleDeg} degrees`}.`
      );
    } else if (parts[1].includes('to')) {
      const direction = parts[1].replace(/\s{2,}/g, ' ').trim(); // Remove extra spaces and trim the direction
      angleDeg = directionMap(direction, nodeWidth, nodeHeight);
      log.debug(`Converted gradient direction ${direction} to angle: ${angleDeg} degrees.`);
    } else {
      hasAngleOrDirectionKwd = false;
      log.debug(`No angle or direction specified in the gradient string.`);
    }
    // If an angle/direction is specified, remove it from the gradient style to leave only
    // color stops going forward, otherwise, consider the whole string as color stops
    linearGradientStyle = hasAngleOrDirectionKwd ? parts[2] : parts[0] || '';
  }

  linearGradientStyle = linearGradientStyle.trim();
  log.debug(`Colors and positions for linear gradient: ${linearGradientStyle}`);

  // Calculate the length of the gradient line based on the angle and the SVG shape element
  const gradientLineLength = getGradientLineLength(shapeElement, angleDeg);
  log.debug(
    `Calculated gradient line length: ${gradientLineLength} for angle = ${angleDeg}deg, width = ${nodeWidth}px, height = ${nodeHeight}px`
  );

  // Regular expression for capturing color stops with multiple positions (invalid cases will be handled further down)
  const multiStopRegex =
    /([A-Za-z]+\([^)]+\)|#[\dA-Fa-f]{3,8}|[A-Za-z]+)\s+([+-]?\d*\.?\d+[%A-Za-z]*)\s*([+-]?\d*\.?\d+[%A-Za-z]*)?\s*([+-]?\d*\.?\d+[%A-Za-z]*)?/g;

  linearGradientStyle = linearGradientStyle.replace(
    multiStopRegex,
    (match, color, pos1, pos2, pos3) => {
      if (!isValidColor(color)) {
        return match; // Ignore the match if it doesn't start with a valid color
      }
      const positionArray = [pos1, pos2, pos3].filter(Boolean); // Filter out undefined/null values
      if (positionArray.length > 2) {
        throw new Error(`Too many positions in color stop: '${match}'`);
      } else if (positionArray.length === 2) {
        // Split double stops like 'red -10% 35%' into 'red -10%, red 35%' (same with other units)
        log.debug(
          `Split double stop: '${color} ${pos1} ${pos2}' into '${color} ${pos1}, ${color} ${pos2}'`
        );
        return `${color} ${pos1}, ${color} ${pos2}`;
      }
      return match; // No split for 1 or 0 positions
    }
  );

  // Interface for color stops with optional positions to guide TypeScript in handling nullable stops safely
  interface ColorStop {
    color: string;
    position: number | null;
  }

  // Parse color stops, convert units to %, and map to color and position
  const colorStops = linearGradientStyle
    .split(/,(?![^()]*\))/)
    .map((stop): ColorStop | null => {
      stop = stop.trim();
      if (/^[+-]?\d+(\.\d+)?[%A-Za-z]+$/.test(stop)) {
        // Stops containing just a number with % or units (e.g., px, em) serve as transition hints
        if (linearGradientStyle.startsWith(stop) || linearGradientStyle.endsWith(stop)) {
          throw new Error(`The transition hint '${stop}' does not have surrounding color stops`);
        } else {
          log.debug(
            `Found a transition hint at '${stop}'. Will interpolate colors around it if needed.`
          );
          if (linearInterpOnly) {
            return null; // Ignore the hint if linear interpolation is enforced
          } else {
            stop = `HINT ${stop}`; // Placeholder for future handling
          }
        }
      }
      // Capture color (hex, named, or function) followed by optional position and units
      const regex = new RegExp(
        `(#[0-9a-fA-F]{3,8}|[a-zA-Z]+\\([^)]+\\)|[a-zA-Z]+)\\s*([-+]?\\d*\\.?\\d*)([a-zA-Z%]*)?$`
      );
      const [_, color, positionString, unit] = regex.exec(stop.trim()) || [];
      log.debug(
        `Parsed color stop (pre conversion): '${stop.trim()}' -> color = '${color}', position = '${positionString}', position unit = '${unit}'`
      );

      // Throw an error if the color is invalid
      if (color !== 'HINT' && !isValidColor(color)) {
        throw new Error(`Invalid color value found in color stop: '${stop.trim()}'`);
      }

      // Define the root font size and parent font size for font-based units (em, rem, ex, ch)
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const parentNode = shapeElement.node()?.parentNode;
      const parentFontSize = parentNode
        ? parseFloat(getComputedStyle(parentNode as Element).fontSize)
        : rootFontSize;

      // Some log messages to help with debugging for font-based units
      if (unit === 'em' || unit === 'ex' || unit === 'ch') {
        if (parentNode) {
          log.debug(`Parent detected for node: font-size = ${parentFontSize}px`);
        } else {
          log.debug(`No parent detected for node: using root font-size = ${rootFontSize}px`);
        }
      } else if (unit === 'rem') {
        log.debug(`Root font-size: ${rootFontSize}px`);
      }

      // CSS uses a standard DPI of 96 for physical unit conversions (in, cm, mm, etc.)
      const dpi = 96;

      // Conversion logic based on unit type, returning position as %
      const position = positionString
        ? (() => {
            const value = parseFloat(positionString); // cspell:ignore vmin vmax
            switch (unit) {
              case '%':
                // Already in the intended unit
                return value;
              case 'px':
                // Pixels are converted to % based on the gradient line length
                return (value / gradientLineLength) * 100;
              case 'em':
                // 'em' values are relative to the parent element's font size
                return ((value * parentFontSize) / gradientLineLength) * 100;
              case 'rem':
                // 'rem' values are relative to the root element's font size
                return ((value * rootFontSize) / gradientLineLength) * 100;
              case 'vw':
                // 'vw' represents viewport width, converted relative to window width
                return (((value / 100) * window.innerWidth) / gradientLineLength) * 100;
              case 'vh':
                // 'vh' represents viewport height, converted relative to window height
                return (((value / 100) * window.innerHeight) / gradientLineLength) * 100;
              case 'vmin':
                // 'vmin' is based on the smallest viewport dimension (width or height)
                return (
                  (((value / 100) * Math.min(window.innerWidth, window.innerHeight)) /
                    gradientLineLength) *
                  100
                );
              case 'vmax':
                // 'vmax' is based on the largest viewport dimension (width or height)
                return (
                  (((value / 100) * Math.max(window.innerWidth, window.innerHeight)) /
                    gradientLineLength) *
                  100
                );
              case 'ex':
                // 'ex' is the height of the lowercase letter x, often estimated as 0.5em
                return ((value * parentFontSize * 0.5) / gradientLineLength) * 100;
              case 'ch':
                // 'ch' is the width of the '0' character, often estimated as 0.5em
                return ((value * parentFontSize * 0.5) / gradientLineLength) * 100;
              case 'cm':
                // Centimeters converted to pixels using the standard DPI, then to %
                return ((value * dpi) / 2.54 / gradientLineLength) * 100;
              case 'mm':
                // Millimeters converted to pixels using DPI, then to %
                return ((value * dpi) / 25.4 / gradientLineLength) * 100;
              case 'in':
                // Inches converted to pixels using DPI, then to %
                return ((value * dpi) / gradientLineLength) * 100;
              case 'pt':
                // Points (1pt = 1/72 inch) converted to pixels, then to %
                return ((value * dpi) / 72 / gradientLineLength) * 100;
              case 'pc':
                // Picas (1pc = 12pt = 1/6 inch) converted to pixels, then to %
                return ((value * dpi) / 6 / gradientLineLength) * 100;
              default:
                throw new Error(`Unsupported unit found in gradient position: ${unit}`);
            }
          })()
        : null;

      if (positionString) {
        log.debug(
          `Position ${positionString}${unit} ${unit === '%' ? 'is already in percentage, no conversion needed' : `is converted to ${position}% of the gradient line length`}.`
        );
      }
      log.debug(
        `Parsed color stop (post conversion): color = '${color}', position = '${position}%'`
      );

      return { color, position };
    })
    .filter((stop): stop is ColorStop => stop !== null); // Remove null stops (i.e. ignored transition hints)

  // As in CSS, you can't have a gradient with less than two stops
  if (colorStops.length < 2) {
    throw new Error(
      `At least two stops are required to create a linear gradient. Found ${colorStops.length}.`
    );
  }

  // Ensure the first stop is set to 0% if it's not defined
  if (colorStops[0].position === null) {
    colorStops[0].position = 0;
    log.debug(`No position defined for the first stop '${colorStops[0].color}'. Setting to 0%.`);
  }

  // Ensure the last stop is set to 100% if it's not defined
  if (colorStops[colorStops.length - 1].position === null) {
    colorStops[colorStops.length - 1].position = 100;
    log.debug(
      `No position defined for the last stop '${colorStops[colorStops.length - 1].color}'. Setting to 100%.`
    );
  }

  // Get the minimum and maximum stop positions
  const minStop = Math.min(colorStops[0].position ?? 0, 0);
  const maxStop = Math.max(colorStops[colorStops.length - 1].position ?? 100, 100);

  // Normalize all explicit stop positions when gradient bounds exceed 0-100%, except for the first and last stops
  if (minStop < 0 || maxStop > 100) {
    colorStops.forEach((stop, index) => {
      if (stop.position !== null) {
        const { position: original, color } = stop;
        if (!(index === 0 || index === colorStops.length - 1)) {
          stop.position = ((stop.position - minStop) / (maxStop - minStop)) * 100;
          log.debug(
            `Normalized position for stop #${index + 1}: color = '${color}', position = '${original}%' -> '${stop.position}%'`
          );
        }
      }
    });
  }

  // Enforce ascending order and interpolate missing positions between stops
  for (let i = 1; i < colorStops.length; i++) {
    const prevPos = colorStops[i - 1].position!;
    const prevPosCapped = Math.max(0, Math.min(100, prevPos)); // Cap for CSS-like interpolation

    // Interpolate missing positions
    if (colorStops[i].position === null && i < colorStops.length - 1) {
      let j = i;
      while (j < colorStops.length && colorStops[j].position === null) {
        j++;
      }
      let nextPos = colorStops[j].position!;
      nextPos = Math.max(0, Math.min(100, nextPos)); // Cap for CSS-like interpolation

      const step = (nextPos - prevPosCapped) / (j - i + 1);
      log.debug(
        `Interpolating missing positions for colors #${i + 1} '${colorStops[i].color}' to #${j} '${colorStops[j - 1].color}' with step ${step}.`
      );

      for (let k = i; k < j; k++) {
        colorStops[k].position = prevPosCapped + step * (k - i + 1);
        log.debug(
          `Interpolated position for stop #${k + 1} ['${colorStops[k].color}'] to ${colorStops[k].position}%`
        );
      }
      i = j - 1; // Skip to the next defined position
    } else if (Number(colorStops[i].position) < prevPos) {
      // This ensures monotonically increasing positions
      log.debug(
        `Adjusted position of stop #${i + 1} ['${colorStops[i].color}'] from ${colorStops[i].position}% to ${prevPos}% to maintain ascending order.`
      );
      colorStops[i].position = prevPos;
    }
  }

  // If the first color stop has a position greater than 0, add a new stop at position 0
  // This check is essential for aligning with CSS behavior in cases where the last stop is beyond 100% for edge cases like 'red 30%, yellow, blue 140%'
  if (colorStops[0].position > 0) {
    colorStops.unshift({ color: colorStops[0].color || '', position: 0 });
    log.debug(
      `Added a new start position for color '${colorStops[0].color}' at 0% to ensure at least 0-100% coverage.`
    );
  }

  // If the last color stop is not maxed out at least at 100%, add a new stop at position 100
  // Suspected this may not be required, but including it just to be safe
  if ((colorStops[colorStops.length - 1].position || 100) < 100) {
    colorStops.push({ color: colorStops[colorStops.length - 1].color || '', position: 100 });
    log.debug(
      `Added a new end position for color '${colorStops[colorStops.length - 1].color}' at 100% to ensure at least 0-100% coverage.`
    );
  }

  // Select or create <defs> element in the SVG
  let defs = svgSelection.select<SVGDefsElement>('defs');
  if (defs.empty()) {
    log.debug('No <defs> element found in the SVG. Creating a new one.');
    defs = svgSelection.append('defs');
  }

  // Create the linear gradient element
  const linearGradient = defs
    .append('linearGradient')
    .attr('id', gradientId)
    .attr('spreadMethod', 'pad')
    .attr('gradientUnits', 'userSpaceOnUse');
  log.debug(`Created <linearGradient> element with ID: ${gradientId}`);

  // Apply color stops to the linear gradient element
  colorStops.forEach((currentStop, index) => {
    // Get RGBA values for potential color interpolation
    let startColor = linearInterpOnly ? { r: 0, g: 0, b: 0, a: 0 } : getRGBA(currentStop.color);
    const nextStop = colorStops[index + 1];
    const endColor = linearInterpOnly ? startColor : nextStop ? getRGBA(nextStop.color) : undefined;

    // Check if the stop is a transition hint or in need of interpolation due to opacity gradient between stops
    if (
      !linearInterpOnly &&
      endColor &&
      nextStop.color !== 'HINT' &&
      (startColor.a !== endColor.a || currentStop.color === 'HINT')
    ) {
      const prevStop = colorStops[index - 1];

      // Number of interpolated stops around the transition hint including the hint itself
      const nTransitionStops = 5; // 5 is tested to be optimal

      // Defaults for opacity-gradient-based interpolation
      let relativeHint = 0.5;
      let totalInterval = nextStop.position! - currentStop.position!;
      let absoluteStartPos = currentStop.position;

      // No need to interpolate if this stop is a transition hint with the same position as an adjacent stop
      if (currentStop.color === 'HINT') {
        if (currentStop.position == prevStop.position) {
          linearGradient
            .append('stop')
            .attr('offset', `${currentStop.position}%`)
            .attr('stop-color', nextStop.color);
          log.debug(
            `Added stop #${index + 1} to <linearGradient> using the next color since the transition hint's position is not more than the position of the previous stop: color = '${nextStop.color}', position = '${currentStop.position}%'`
          );
          // Skip to the next iteration after adding a regular stop
          return;
        }
        if (currentStop.position == nextStop.position) {
          linearGradient
            .append('stop')
            .attr('offset', `${currentStop.position}%`)
            .attr('stop-color', prevStop.color);
          log.debug(
            `Added stop #${index + 1} to <linearGradient> using the previous color since the transition hint's position is not less than the position of the next stop: color = '${prevStop.color}', position = '${currentStop.position}%'`
          );
          // Skip to the next iteration after adding a regular stop
          return;
        }

        // Start interpolating from the previous stop's color if this is a transition hint
        startColor = getRGBA(prevStop.color);

        // Relative value of the hint within the total interval
        totalInterval = nextStop.position! - prevStop.position!;
        relativeHint = (currentStop.position! - prevStop.position!) / totalInterval;
        absoluteStartPos = prevStop.position;
      }

      if (currentStop.position == nextStop.position) {
        // No interpolation needed if the positions are the same even though the colors have different opacities
        [currentStop, nextStop].forEach((stop) => {
          linearGradient
            .append('stop')
            .attr('offset', `${stop.position}%`)
            .attr('stop-color', stop.color);
          log.debug(
            `Added stop #${index + 1} to <linearGradient> (no opacity-gradient-based interpolation needed because the positions are the same): color = '${stop.color}', position = '${stop.position}%'`
          );
        });
        // Skip to the next iteration now that both stops are added
        return;
      }

      /**
       * Interpolate colors between stops based on the transition hint or opacity differences
       */

      // For opacity-gradient-based interpolation, keep the start color in the list so that it can be
      // treated as a regular stop later since this is our only chance to do so
      const includeStart = currentStop.color !== 'HINT';

      // Generate interpolated relative positions within the interval
      const interpolatedRelativePositions = generateStops(
        0,
        relativeHint,
        1,
        nTransitionStops,
        includeStart,
        false
      );
      log.debug(
        `Generated ${nTransitionStops + (includeStart ? 1 : 0)} interpolated relative positions around the relative transition hint at ${relativeHint} between colors ${currentStop.color === 'HINT' ? prevStop.color : currentStop.color} and ${nextStop.color}: ${interpolatedRelativePositions.join(', ')}`
      );

      // Append interpolated stops to the gradient
      interpolatedRelativePositions.forEach((relativePos, hintIndex) => {
        const absolutePos = absoluteStartPos! + relativePos * totalInterval;
        const interpolatedColor =
          hintIndex === 0 && includeStart
            ? currentStop.color
            : interpolateColor(startColor, endColor, relativePos, relativeHint);
        linearGradient
          .append('stop')
          .attr('offset', `${absolutePos}%`)
          .attr('stop-color', interpolatedColor);
        if (currentStop.color === 'HINT') {
          log.debug(
            `Added interpolated transition stop ${hintIndex + 1}/${nTransitionStops} for transition hint between colors ${prevStop.color} and ${nextStop.color} to <linearGradient>: color (interpolated) = '${interpolatedColor}', position = '${absolutePos}%'`
          );
        } else {
          if (hintIndex === 0) {
            // Treated like a regular stop as this is the starting point of an opacity-gradient-based interpolation
            log.debug(
              `Added stop ${index + 1} to <linearGradient>: color = '${interpolatedColor}', position = '${absolutePos}%'`
            );
          } else {
            log.debug(
              `Added interpolated transition stop ${hintIndex}/${nTransitionStops} for opacity gradient between colors ${currentStop.color} and ${nextStop.color} to <linearGradient>: color (interpolated) = '${interpolatedColor}', position = '${absolutePos}%'`
            );
          }
        }
      });
    } else {
      // Append the standard stop to the gradient with no transition hint or opacity gradient involved in the interpolation
      linearGradient
        .append('stop')
        .attr('offset', `${currentStop.position}%`)
        .attr('stop-color', currentStop.color);
      log.debug(
        `Added stop ${index + 1} to <linearGradient>: color = '${currentStop.color}', position = '${currentStop.position}%'`
      );
    }
  });

  // Setup SVG coordinates
  const xc = bbox.x + nodeWidth / 2;
  const yc = bbox.y + nodeHeight / 2;
  const dmin = (gradientLineLength * Math.abs(minStop - 50)) / 100; // cspell:ignore dmin
  const dmax = (gradientLineLength * Math.abs(maxStop - 50)) / 100; // cspell:ignore dmax
  const { x1, y1, x2, y2 } = { x1: xc, y1: yc + dmax, x2: xc, y2: yc - dmin }; // Vertical gradient @ 0deg (bottom to top)

  // Apply SVG coordinates to the linear gradient element
  linearGradient.attr('x1', `${x1}`).attr('y1', `${y1}`).attr('x2', `${x2}`).attr('y2', `${y2}`);
  log.debug(`Coordinates for linear gradient: x1=${x1}, y1=${y1}, x2=${x2}, y2=${y2}`);

  // Rotate the gradient using the gradient transform attribute
  const gradientTransform = `rotate(${angleDeg}, ${xc}, ${yc})`;
  linearGradient.attr('gradientTransform', gradientTransform);
  log.debug(`Applied gradient transform: ${gradientTransform}`);

  log.debug(`Gradient creation process completed for '${gradientId}'.`);
}
