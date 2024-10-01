import type { Selection } from 'd3';
import { log } from '../logger.js';

/**
 * Creates an SVG linear gradient element given a CSS-like linear-gradient definition
 * consisting of an angle/direction and color stops.
 *
 * @param svg - The SVG element to which the gradient is applied.
 * @param shapeElement - The SVG shape element to which the gradient will be applied.
 * @param linearGradientStyle - A CSS-like linear-gradient string specifying the gradient angle/direction (optional) and color stops.
 * @param gradientId - The unique ID for the created linear gradient in the SVG's <defs> section.
 * @returns void - The function does not return a value. In-place modifications are made to the SVG element.
 */
export function createLinearGradient(
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  shapeElement: Selection<SVGGraphicsElement, unknown, HTMLElement, any>,
  linearGradientStyle: string,
  gradientId: string
): void {
  log.debug(`Creating linear gradient for ${gradientId}: ${linearGradientStyle}`);

  // Test if the double comma pattern exists in the input string to avoid user errors
  if (/,\s*,/.test(linearGradientStyle)) {
    log.error('Found consecutive commas (,,) in the gradient string.');
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
  let aspectRatio = nodeWidth / nodeHeight;
  let hasAngleOrDirection = true;

  // Handle numeric angles (e.g., -45deg, +12deg, 1rad, 0.25turn) or directional keywords (e.g., to right, to top left)
  if (parts?.[1]) {
    if (/deg|turn|grad|rad/.test(parts[1])) {
      const match = /([+-]?\d+\.?\d*)(deg|turn|grad|rad)/.exec(parts[1]);
      const [_, value, unit] = match ? match : [null, String(angleDeg), 'deg'];
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
      const directionMap: Record<string, number> = {
        'to bottom': 180,
        'to top': 0,
        'to left': 270,
        'to right': 90,
        'to top left': 315,
        'to left top': 315,
        'to top right': 45,
        'to right top': 45,
        'to bottom left': 225,
        'to left bottom': 225,
        'to bottom right': 135,
        'to right bottom': 135,
      };
      if (direction in directionMap) {
        angleDeg = directionMap[direction];
        log.debug(`Converted gradient direction ${direction} to angle: ${angleDeg} degrees.`);
        // Set the aspect ratio to 1 for practical purposes to ensure accurate interpretation
        // of the gradient direction relevant to the sides/corners
        aspectRatio = 1;
      } else {
        log.error(`Invalid direction found in the gradient string.`);
      }
    } else {
      hasAngleOrDirection = false;
      log.debug(`No angle or direction specified in the gradient string.`);
    }
    // If an angle/direction is specified, remove it from the gradient style to leave only
    // color stops going forward, otherwise, consider the whole string as color stops
    linearGradientStyle = hasAngleOrDirection ? parts[2] : parts[0] || '';
  }

  log.debug(`Colors and positions for linear gradient: ${linearGradientStyle}`);

  // Calculate the rotation angle for the gradient transformation using the original angle and
  // the aspect ratio to ensure proper behavior (e.g., at 45 degrees) for non-square bounding boxes
  const angleRad = angleDeg * (Math.PI / 180);
  let transformAngleDeg = Math.atan(Math.tan(angleRad) * aspectRatio) * (180 / Math.PI);
  transformAngleDeg += Math.cos(angleRad) > 0 ? 180 : 0; // Adjust kinks at 90 and 270 degrees
  log.debug(`Calculated the angle for the rotational transform: ${transformAngleDeg} degrees`);

  // Calculate the length of the gradient line based on the angle and the bounding box dimensions
  // See https://patrickbrosset.medium.com/do-you-really-understand-css-linear-gradients-631d9a895caf
  const gradientLineLength =
    Math.abs(nodeWidth * Math.sin(angleRad)) + Math.abs(nodeHeight * Math.cos(angleRad));
  log.debug(
    `Calculated gradient line length: ${gradientLineLength} for angle = ${angleRad}rad, width = ${nodeWidth}px, height = ${nodeHeight}px`
  );

  // List of supported units for position values
  const lengthUnits = '%|px|em|rem|vw|vh|vmin|vmax|ex|ch|cm|mm|in|pt|pc'; // cspell:ignore vmin vmax

  // Create the dynamic regular expression for double stops (e.g., 'red -10% 35%')
  const doubleStopRegex = new RegExp(
    `(\\S+)\\s+([+-]?\\d*\\.?\\d+(?:${lengthUnits}))\\s+([+-]?\\d*\\.?\\d+(?:${lengthUnits}))`,
    'g'
  );

  // Split double stops like 'red -10% 35%' into 'red -10%, red 35%' (same with other units)
  linearGradientStyle = linearGradientStyle.replace(doubleStopRegex, (_, color, pos1, pos2) => {
    log.debug(
      `Split double stop: '${color} ${pos1} ${pos2}' into '${color} ${pos1}, ${color} ${pos2}'`
    );
    return `${color} ${pos1}, ${color} ${pos2}`;
  });

  // Parse color stops, convert units to %, and map to color and position
  const colorStops = linearGradientStyle.split(/,(?![^()]*\))/).map((stop) => {
    // Capture color (hex, named, or function) followed by optional position and units
    // const [_, color, positionString, unit] = stop.trim().match(new RegExp(`(#[0-9a-fA-F]{3,6}|[a-zA-Z]+\\([^)]+\\)|[a-zA-Z]+)\\s*([-+]?\\d*\\.?\\d*)\\s*(${lengthUnits})?$`)) || [];
    const regex = new RegExp(
      `(#[0-9a-fA-F]{3,6}|[a-zA-Z]+\\([^)]+\\)|[a-zA-Z]+)\\s*([-+]?\\d*\\.?\\d*)\\s*(${lengthUnits})?$`
    );
    const [_, color, positionString, unit] = regex.exec(stop.trim()) || [];

    if (!color) {
      log.debug(`No valid color found for stop: '${stop}'`);
      return { color: null, position: null };
    }

    // Define the root font size and parent font size for font-relative units (em, rem, ex, ch)
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const parentNode = shapeElement.node()?.parentNode;
    const parentFontSize = parentNode
      ? parseFloat(getComputedStyle(parentNode as Element).fontSize)
      : rootFontSize;

    // CSS uses a standard DPI of 96 for physical unit conversions (in, cm, mm, etc.)
    const dpi = 96;

    // Conversion logic based on unit type, returning position as %
    const position = positionString
      ? (() => {
          const value = parseFloat(positionString);
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
              // 'ex' is the height of the lowercase letter x, assumed to be 0.5em for simplicity
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
              // For any unsupported units, return null
              return null;
          }
        })()
      : null;

    if (positionString) {
      log.debug(
        `Position ${positionString}${unit} ${unit === '%' ? 'is already in percentage, no conversion needed' : `is converted to ${position}% of the gradient line length`}.`
      );
    }
    log.debug(`Parsed color stop: color = '${color}', position = '${position}%'`);

    return { color, position };
  });

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

  // Get the maximum and minimum stop positions
  const minStop = colorStops[0].position;
  const maxStop = colorStops[colorStops.length - 1].position || 100;

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
  for (let i = 1; i < colorStops.length - 1; i++) {
    let prevPos = colorStops[i - 1].position!;
    prevPos = Math.max(0, Math.min(100, prevPos)); // Cap for CSS-like interpolation

    // Interpolate missing positions
    if (colorStops[i].position === null) {
      let j = i;
      while (j < colorStops.length && colorStops[j].position === null) {
        j++;
      }
      let nextPos = colorStops[j].position!;
      nextPos = Math.max(0, Math.min(100, nextPos)); // Cap for CSS-like interpolation

      const step = (nextPos - prevPos) / (j - i + 1);
      log.debug(
        `Interpolating missing positions for colors #${i + 1} ['${colorStops[i].color}'] to #${j} ['${colorStops[j - 1].color}'] with step ${step}.`
      );

      for (let k = i; k < j; k++) {
        colorStops[k].position = prevPos + step * (k - i + 1);
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

  // Select or create <defs> element in the SVG
  let defs = svg.select<SVGDefsElement>('defs');
  if (defs.empty()) {
    defs = svg.append('defs');
  }

  // Create the linear gradient element
  const linearGradient = defs
    .append('linearGradient')
    .attr('id', gradientId)
    .attr('spreadMethod', 'pad');
  log.debug(`Created <linearGradient> element with ID: ${gradientId}`);

  // Initialize SVG coordinates
  const { x1, y1, x2, y2 } = { x1: 0, y1: minStop, x2: 0, y2: maxStop };

  // Apply SVG coordinates to the linear gradient element
  linearGradient
    .attr('x1', `${x1}%`)
    .attr('y1', `${y1}%`)
    .attr('x2', `${x2}%`)
    .attr('y2', `${y2}%`);
  log.debug(`Coordinates for linear gradient: x1=${x1}%, y1=${y1}%, x2=${x2}%, y2=${y2}%`);

  // Calculate the scale factor to ensure the rendered gradient line length matches that of css
  const blendFactor = Math.abs(Math.sin(angleRad));
  const scale = gradientLineLength / (blendFactor * nodeWidth + (1 - blendFactor) * nodeHeight);

  // Apply the gradient rotation with appropriate scaling and translation to get the desired result similar to CSS
  const gradientTransform = `rotate(${transformAngleDeg}, 0.5, 0.5) translate(0.5, 0.5) scale(${scale}) translate(-0.5, -0.5)`;
  linearGradient.attr('gradientTransform', gradientTransform);
  log.debug(`Applied gradient transform: ${gradientTransform}`);

  // Apply the color stops to the linear gradient element
  colorStops.forEach((stop, index) => {
    linearGradient
      .append('stop')
      .attr('offset', `${stop.position}%`)
      .attr('stop-color', stop.color);
    log.debug(
      `Added stop ${index + 1} to <linearGradient>: color = '${stop.color}', position = '${stop.position}%'`
    );
  });
  log.debug(`Gradient creation process completed for '${gradientId}'.`);
}
