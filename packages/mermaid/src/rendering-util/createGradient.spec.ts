import { createLinearGradient, directionMap, getGradientLineLength } from './createGradient.js';
import { select, type Selection } from 'd3';
import { JSDOM } from 'jsdom';

/* Global declarations for all describe blocks */

// D3 selection for the SVG and shape element
let svg: Selection<SVGSVGElement, unknown, null, undefined>;
let shapeElement: Selection<SVGGraphicsElement, unknown, HTMLElement, any>;

// Create a mock DOM and assign the window and document objects to the global scope
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { pretendToBeVisual: true });
global.window = global.window || dom.window;
global.document = window.document;

// Define global classes for SVG shape elements
const shapeTypes = ['rect', 'circle', 'ellipse', 'polygon', 'path'];
shapeTypes.forEach((elementName) => {
  const className = `SVG${elementName.charAt(0).toUpperCase() + elementName.slice(1)}Element`;
  (globalThis as any)[className] =
    (globalThis as any)[className] ||
    class extends (globalThis.SVGGraphicsElement as any) {
      static [Symbol.hasInstance](instance: any) {
        return instance?.tagName?.toLowerCase() === elementName;
      }
    };
});

// Make sure the JSDOM window has a CSS object
global.window.CSS = global.window.CSS || {};

// Attach the mock function to window.CSS.supports
global.window.CSS.supports = (property: string, value?: string): boolean => {
  if (property === 'color' && value !== undefined) {
    return isValidColor(value);
  }
  return false; // Default to unsupported for invalid colors and other properties
};

beforeEach(() => {
  // Default to a rectangle shape unless overridden in tests
  ({ svg, shapeElement } = createShape('rect'));
});

afterEach(() => {
  // Clean up DOM after each test
  document.body.innerHTML = '';
  shapeElement = null as any;
  svg = null as any;
});

// Functions for converting angles
const deg2rad = (deg: number) => deg * (Math.PI / 180);
const rad2deg = (rad: number) => rad * (180 / Math.PI);
const turn2deg = (turn: number) => turn * 360;
const grad2deg = (grad: number) => (grad * 180) / 200;

// Function to parse the angle from a transform attribute
const parseTransformAngle = (transform: string) =>
  +transform.split('rotate(')[1].split(',')[0].trim();

// Generate valid single and two-word directions for testing
const horizontalDirs = ['left', 'right'];
const verticalDirs = ['top', 'bottom'];
const dirs = [...horizontalDirs, ...verticalDirs];
const validDirections = new Set([
  ...dirs.map((d) => `to ${d}`),
  ...horizontalDirs.flatMap((h) => verticalDirs.map((v) => `to ${h} ${v}`)),
  ...verticalDirs.flatMap((v) => horizontalDirs.map((h) => `to ${v} ${h}`)),
]);

/**
 * Function to validate CSS color strings to be used in the CSS.supports() mock.
 *
 * This function validates named colors, hex codes, and advanced color functions.
 * It's not the exact CSS behavior but close enough for testing outside browsers.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors|CSS colors} for the formal syntax.
 *
 * @param color - The color string to validate.
 * @returns - true if the color is valid, false otherwise.
 */
function isValidColor(color: string): boolean {
  color = color.trim();

  // Built-in validation for basic colors
  const s = new Option().style;
  s.color = color;
  if (s.color !== '') {
    return true;
  }

  // Regex validation for advanced color functions
  const number = '[+-]?(?:\\d*\\.\\d+|\\d+)(?:[eE][+-]?\\d+)?';
  const percentage = `${number}%`;
  const angle = `${number}(?:deg|rad|grad|turn)`;
  const hue = `(?:${angle}|${number})`;
  const alphaValue = `(?:${number}|${percentage})`;
  const none = 'none';
  const lch =
    `lch\\(\\s*` +
    `(?:${percentage}|${number}|${none})\\s+` +
    `(?:${percentage}|${number}|${none})\\s+` +
    `(?:${hue}|${none})` +
    `(?:\\s*/\\s*(?:${alphaValue}|${none}))?` +
    `\\s*\\)`;
  const oklch =
    `oklch\\(\\s*` +
    `(?:${percentage}|${number}|${none})\\s+` +
    `(?:${percentage}|${number}|${none})\\s+` +
    `(?:${hue}|${none})` +
    `(?:\\s*/\\s*(?:${alphaValue}|${none}))?` +
    `\\s*\\)`;
  const oklab =
    `oklab\\(\\s*` +
    `(?:${percentage}|${number}|${none})\\s+` +
    `(?:${percentage}|${number}|${none})\\s+` +
    `(?:${percentage}|${number}|${none})` +
    `(?:\\s*/\\s*(?:${alphaValue}|${none}))?` +
    `\\s*\\)`;
  const lab =
    `lab\\(\\s*` +
    `(?:${percentage}|${number}|${none})\\s+` +
    `(?:${percentage}|${number}|${none})\\s+` +
    `(?:${percentage}|${number}|${none})` +
    `(?:\\s*/\\s*(?:${alphaValue}|${none}))?` +
    `\\s*\\)`;
  const hwb =
    `hwb\\(\\s*` +
    `(?:${hue}|${none})\\s+` +
    `(?:${percentage}|${number}|${none})\\s+` +
    `(?:${percentage}|${number}|${none})` +
    `(?:\\s*/\\s*(?:${alphaValue}|${none}))?` +
    `\\s*\\)`;
  const rgbModern =
    `rgba?\\(\\s*` +
    `(?:${number}|${percentage}|${none})\\s+` +
    `(?:${number}|${percentage}|${none})\\s+` +
    `(?:${number}|${percentage}|${none})` +
    `(?:\\s*/\\s*(?:${alphaValue}|${none}))?` +
    `\\s*\\)`;
  const rgbLegacy =
    `rgba?\\(\\s*` +
    `(?:${number}|${percentage})\\s*,\\s*` +
    `(?:${number}|${percentage})\\s*,\\s*` +
    `(?:${number}|${percentage})` +
    `(?:\\s*,\\s*(?:${alphaValue}))?` +
    `\\s*\\)`;
  const hslModern =
    `hsla?\\(\\s*` +
    `(?:${hue}|${none})\\s+` +
    `(?:${percentage}|${number}|${none})\\s+` +
    `(?:${percentage}|${number}|${none})` +
    `(?:\\s*/\\s*(?:${alphaValue}|${none}))?` +
    `\\s*\\)`;
  const hslLegacy =
    `hsla?\\(\\s*` +
    `(?:${hue})\\s*,\\s*` +
    `(?:${percentage})\\s*,\\s*` +
    `(?:${percentage})` +
    `(?:\\s*,\\s*(?:${alphaValue}))?` +
    `\\s*\\)`;
  const patterns = [lch, oklch, oklab, lab, hwb, rgbModern, rgbLegacy, hslModern, hslLegacy];
  const combinedPattern = `^(?:${patterns.join('|')})$`;
  const colorFunctionRegex = new RegExp(combinedPattern, 'i'); // Case-insensitive

  if (colorFunctionRegex.test(color)) {
    return true;
  }
  return false;
}

/**
 * Selects elements by 'type' in a mock SVG structure. Supports chaining for
 * further selection and attribute retrieval.
 *
 * @param el - The mock SVG element to search.
 * @param sel - The 'type' selector.
 * @returns - The first matching element with chainable methods.
 */
function getElem(el: any, sel: string) {
  const res: any[] = [];
  (function f(el) {
    if (el.attribs.get('type') === sel) {
      res.push(el);
    }
    el._children?.forEach(f);
  })(el);
  const firstMatch = res[0];
  return {
    ...firstMatch,
    nodes: () => res,
    empty: () => !firstMatch,
    select: (s: string) => getElem(firstMatch, s),
    selectAll: (s: string) => getElem(firstMatch, s).nodes(),
    attr: (attrName: string) => firstMatch?.attribs.get(attrName),
  };
}

// Helper function to create a DOMRect-like object
const createDOMRect = (x: number, y: number, width: number, height: number): DOMRect => {
  const props = {
    width,
    height,
    x,
    y,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
  };
  return { ...props, toJSON: () => props } as DOMRect;
};

// Utility to parse polygon points
const parsePoints = (points: string) => {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(parseFloat));
};

// Compute bounding box for a polygon by calculating min and max x/y coordinates
const calculatePolygonBBox = (points: number[][]) => {
  const xValues = points.map(([x]) => x);
  const yValues = points.map(([, y]) => y);
  const minX = Math.min(...xValues);
  const minY = Math.min(...yValues);
  const maxX = Math.max(...xValues);
  const maxY = Math.max(...yValues);
  return createDOMRect(minX, minY, maxX - minX, maxY - minY);
};

// Compute bounding box for paths by iterating over points along the path
const calculatePathBBox = (path: SVGPathElement, nsteps = 100) => {
  const length = path.getTotalLength();
  const step = length / nsteps;
  const points = [];
  for (let i = 0; i <= length; i += step) {
    const point = path.getPointAtLength(i);
    points.push([point.x, point.y]);
  }
  return calculatePolygonBBox(points);
};

// Function to create and get bounding box for various SVG elements
function getBBox(
  shapeElement: Selection<SVGGraphicsElement, unknown, HTMLElement, any>,
  shapeType: string
): DOMRect {
  if (shapeType === 'rect') {
    const width = parseFloat(shapeElement.attr('width') || '200');
    const height = parseFloat(shapeElement.attr('height') || '200');
    const x = parseFloat(shapeElement.attr('x') || '0');
    const y = parseFloat(shapeElement.attr('y') || '0');
    return createDOMRect(x, y, width, height);
  } else if (shapeType === 'circle') {
    const r = parseFloat(shapeElement.attr('r') || '100');
    const cx = parseFloat(shapeElement.attr('cx') || '0');
    const cy = parseFloat(shapeElement.attr('cy') || '0');
    return createDOMRect(cx - r, cy - r, 2 * r, 2 * r);
  } else if (shapeType === 'ellipse') {
    const rx = parseFloat(shapeElement.attr('rx') || '100');
    const ry = parseFloat(shapeElement.attr('ry') || '50');
    const cx = parseFloat(shapeElement.attr('cx') || '0');
    const cy = parseFloat(shapeElement.attr('cy') || '0');
    return createDOMRect(cx - rx, cy - ry, 2 * rx, 2 * ry);
  } else if (shapeType === 'polygon') {
    const points = parsePoints(shapeElement.attr('points') || '0,0');
    return calculatePolygonBBox(points);
  } else if (shapeType === 'path') {
    const pathElement = shapeElement.node() as SVGPathElement;
    return calculatePathBBox(pathElement);
  }
  // Default to 200x200 box for unknown shapes
  return createDOMRect(0, 0, 200, 200);
}

// Function to create a shape element to test the gradient on
function createShape(shapeType: string): {
  svg: Selection<SVGSVGElement, unknown, null, undefined>;
  shapeElement: Selection<SVGGraphicsElement, unknown, HTMLElement, any>;
} {
  // Create a mock parent element and append it to the document body
  const parentElement = document.createElement('div');
  document.body.appendChild(parentElement);

  // Create an SVG element for each test and mock the select method
  const svgElement = document.createElementNS(
    'http://www.w3.org/2000/svg',
    shapeType
  ) as unknown as SVGSVGElement;
  svg = select(svgElement);
  svg.select = (sel) => getElem(svg, sel as string);

  // Append the SVG inside the parent element
  parentElement.appendChild(svgElement);

  // Set the font size for the document root and parent element
  document.documentElement.style.fontSize = '18px'; // Root font size for rem test
  parentElement.style.fontSize = '30px'; // Parent font size for em/ex/ch tests

  // Create a mock rectangle element
  shapeElement = svg.append(shapeType) as unknown as Selection<
    SVGGraphicsElement,
    unknown,
    HTMLElement,
    any
  >;

  // Set default attributes based on shape type
  if (shapeType === 'rect') {
    shapeElement.attr('x', -54).attr('y', 13).attr('width', 400).attr('height', 300);
  } else if (shapeType === 'circle') {
    shapeElement.attr('r', 100).attr('cx', 100).attr('cy', 100);
  } else if (shapeType === 'ellipse') {
    shapeElement.attr('rx', 150).attr('ry', 100).attr('cx', 200).attr('cy', 150);
  } else if (shapeType === 'polygon') {
    shapeElement.attr('points', '50,15 90,85 10,85');
  } else if (shapeType === 'path') {
    shapeElement.attr('d', 'M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80');
  }

  // Override node() to return the SVG element containing the shape,
  // allowing access to the parent node for font size testing
  shapeElement.node = () => svgElement;

  shapeElement.node()!.getAttribute = (attr: string) => {
    return shapeElement.attr(attr);
  };

  // Mock getBBox() for the shape element
  svgElement.getBBox = () => getBBox(shapeElement, shapeType);

  return { svg, shapeElement };
}

/** Linear gradient tests start from here **/

describe('Gradient application on different shapes', () => {
  it('should apply linear gradient to a rectangle', () => {
    expect(shapeElement.node()).toBeInstanceOf(SVGRectElement);
    shapeElement.attr('x', 8).attr('y', -39).attr('width', 550).attr('height', 380);
    const gradientStyle = 'to bottom right, red, blue';
    createLinearGradient(svg, shapeElement, gradientStyle, 'test-gradient-rect');

    const gradient = svg.select('defs').select('linearGradient');
    const transform = gradient.attr('gradientTransform');
    const parsedAngle = parseTransformAngle(transform);
    const stops = gradient.selectAll('stop') as any;
    const bbox = shapeElement.node()!.getBBox();

    // Compute expected angle using helper function
    const expectedAngle = directionMap('to bottom right', bbox.width, bbox.height);

    // Compute gradient line length for rectangle manually
    const angleDeg = expectedAngle;
    const angleRad = deg2rad(angleDeg);
    const expectedLineLength =
      Math.abs(bbox.width * Math.sin(angleRad)) + Math.abs(bbox.height * Math.cos(angleRad));

    // Compute gradient line length for rectangle using the code
    const computedLineLength = getGradientLineLength(shapeElement, angleDeg);

    // Check gradient transform angle
    expect(parsedAngle).toBeCloseTo(expectedAngle, 8);

    // Check gradient line length
    expect(computedLineLength).toBeCloseTo(expectedLineLength, 8);

    // Verify color stops
    expect(stops[0].attr('stop-color')).toBe('red');
    expect(stops[1].attr('stop-color')).toBe('blue');
  });

  it('should apply linear gradient to a circle', () => {
    ({ svg, shapeElement } = createShape('circle'));
    shapeElement.attr('r', 100).attr('cx', 100).attr('cy', 100);
    expect(shapeElement.node()).toBeInstanceOf(SVGCircleElement);

    const gradientStyle = '66deg, yellow, green';
    createLinearGradient(svg, shapeElement, gradientStyle, 'test-gradient-circle');

    const gradient = svg.select('defs').select('linearGradient');
    const transform = gradient.attr('gradientTransform');
    const parsedAngle = parseTransformAngle(transform);
    const stops = gradient.selectAll('stop') as any;

    // For a circle, the gradient line length is always 2 * radius
    const expectedLineLength = 2 * +shapeElement.attr('r');

    // Compute gradient line length for circle using the code
    const expectedAngle = 66;
    const computedLineLength = getGradientLineLength(shapeElement, expectedAngle);

    // Check gradient transform angle
    expect(parsedAngle).toBeCloseTo(expectedAngle, 8);

    // Check gradient line length
    expect(computedLineLength).toBeCloseTo(expectedLineLength, 8);

    // Verify color stops
    expect(stops[0].attr('stop-color')).toBe('yellow');
    expect(stops[1].attr('stop-color')).toBe('green');
  });

  it('should apply linear gradient to an ellipse', () => {
    ({ svg, shapeElement } = createShape('ellipse'));
    expect(shapeElement.node()).toBeInstanceOf(SVGEllipseElement);

    shapeElement.attr('rx', 150).attr('ry', 100).attr('cx', 200).attr('cy', 150);
    const gradientStyle = '135deg, pink, purple';
    createLinearGradient(svg, shapeElement, gradientStyle, 'test-gradient-ellipse');

    const gradient = svg.select('defs').select('linearGradient');
    const transform = gradient.attr('gradientTransform');
    const parsedAngle = parseTransformAngle(transform);
    const stops = gradient.selectAll('stop') as any;

    const expectedAngle = 135;
    const angleRad = deg2rad(expectedAngle);

    // Compute gradient line length for ellipse manually
    const a = +shapeElement.attr('rx');
    const b = +shapeElement.attr('ry');
    const expectedLineLength =
      2 * Math.sqrt((a * Math.sin(angleRad)) ** 2 + (b * Math.cos(angleRad)) ** 2);

    // Compute gradient line length for ellipse using the code
    const computedLineLength = getGradientLineLength(shapeElement, expectedAngle);

    // Check gradient transform angle
    expect(parsedAngle).toBeCloseTo(expectedAngle, 8);

    // Check gradient line length
    expect(computedLineLength).toBeCloseTo(expectedLineLength, 8);

    // Verify color stops
    expect(stops[0].attr('stop-color')).toBe('pink');
    expect(stops[1].attr('stop-color')).toBe('purple');
  });

  it('should apply linear gradient to a polygon', () => {
    ({ svg, shapeElement } = createShape('polygon'));
    expect(shapeElement.node()).toBeInstanceOf(SVGPolygonElement);

    shapeElement.attr('points', '50,15 90,85 10,85'); // A simple triangle
    const gradientStyle = 'to left bottom, red, blue';
    createLinearGradient(svg, shapeElement, gradientStyle, 'test-gradient-polygon');

    const gradient = svg.select('defs').select('linearGradient');
    const transform = gradient.attr('gradientTransform');
    const parsedAngle = parseTransformAngle(transform);
    const stops = gradient.selectAll('stop') as any;
    const bbox = shapeElement.node()!.getBBox();

    // Compute gradient line length for polygon using the code
    const expectedAngle = directionMap('to left bottom', bbox.width, bbox.height);
    const computedLineLength = getGradientLineLength(shapeElement, expectedAngle);

    // Check gradient transform angle
    expect(parsedAngle).toBeCloseTo(expectedAngle, 8);

    // Check gradient line length against a precomputed value
    expect(computedLineLength).toBeCloseTo(79.02055294422217, 8);

    // Verify color stops
    expect(stops[0].attr('stop-color')).toBe('red');
    expect(stops[1].attr('stop-color')).toBe('blue');
  });

  it('should apply gradient to a path', () => {
    ({ svg, shapeElement } = createShape('path'));
    expect(shapeElement.node()).toBeInstanceOf(SVGPathElement);

    // Testing with a rectangular path from (0,0) to (85,100) for simplicity
    shapeElement.attr('d', 'M0,0 H85 V100 H0 Z');

    // Workaround for JSDOM not supporting getTotalLength() and getPointAtLength()
    (shapeElement.node() as SVGPathElement).getTotalLength = () => 370; // 2 * (85 + 100) = 370
    (shapeElement.node() as SVGPathElement).getPointAtLength = (length): DOMPoint => {
      const totalLength = 370;
      length %= totalLength; // Cycle length within the perimeter
      if (length <= 85) {
        return { x: length, y: 0 } as any;
      } else if (length <= 185) {
        return { x: 85, y: length - 85 } as any;
      } else if (length <= 270) {
        return { x: 85 - (length - 185), y: 100 } as any;
      } else {
        return { x: 0, y: 100 - (length - 270) } as any;
      }
    };

    const gradientStyle = '0.47turn, darkorange, lightblue';
    createLinearGradient(svg, shapeElement, gradientStyle, 'test-gradient-path');

    const gradient = svg.select('defs').select('linearGradient');
    const transform = gradient.attr('gradientTransform');
    const parsedAngle = parseTransformAngle(transform);
    const stops = gradient.selectAll('stop') as any;

    // Compute gradient line length for path using the code
    const expectedAngle = turn2deg(0.47);
    const computedLineLength = getGradientLineLength(shapeElement, expectedAngle);

    // Check gradient transform angle
    expect(parsedAngle).toBeCloseTo(expectedAngle, 8);

    // Check gradient line length against a precomputed value
    expect(computedLineLength).toBeCloseTo(114.15613681265552, 8);

    // Verify color stops
    expect(stops[0].attr('stop-color')).toBe('darkorange');
    expect(stops[1].attr('stop-color')).toBe('lightblue');
  });
});

describe('Basic gradient creation and attributes with in-depth checks', () => {
  it('should create a linear gradient with two color stops', () => {
    // Call the function to test
    createLinearGradient(
      svg,
      shapeElement,
      'to top right, red 0%, blue 100%',
      'test-gradient',
      true // Enforce linear interpolation for this test
    );

    // Find the `defs` element
    const defs = svg.select('defs');

    // Ensure `defs` is successfully created
    expect(defs).toBeDefined();

    // Ensure `defs` has children
    expect(defs.empty()).toBe(false);

    // Find the `linearGradient` inside `defs`
    const gradient = defs.select('linearGradient');

    // Check that `linearGradient` is defined
    expect(gradient).toBeDefined();

    // Verify the gradient ID
    expect(gradient.attr('id')).toBe('test-gradient');

    // Get the node's dimensions
    const bbox = shapeElement.node()!.getBBox();
    const nodeWidth = bbox.width;
    const nodeHeight = bbox.height;

    // Get the parsed and expected angle for the gradient
    const transform = gradient.attr('gradientTransform');
    const parsedAngle = parseTransformAngle(transform);
    const expectedAngle = directionMap('to top right', nodeWidth, nodeHeight);

    // Calculate the gradient line length applied to a rectangle (default shape)
    const angleRad = deg2rad(expectedAngle);
    const gradientLineLength =
      Math.abs(nodeWidth * Math.sin(angleRad)) + Math.abs(nodeHeight * Math.cos(angleRad));

    // Define the minimum and maximum stops set for the gradient
    const minStop = 0;
    const maxStop = 100;

    // SVG linear gradient coordinates
    const xc = bbox.x + nodeWidth / 2;
    const yc = bbox.y + nodeHeight / 2;
    const d1 = (gradientLineLength * (50 - minStop)) / 100;
    const d2 = (gradientLineLength * (50 - maxStop)) / 100;

    // Verify gradient coordinates and angle
    expect(+gradient.attr('x1')).toBeCloseTo(xc, 8);
    expect(+gradient.attr('y1')).toBeCloseTo(yc + d1, 8);
    expect(+gradient.attr('x2')).toBeCloseTo(xc, 8);
    expect(+gradient.attr('y2')).toBeCloseTo(yc + d2, 8);
    expect(parsedAngle).toBeCloseTo(expectedAngle, 8);

    // Check that there are two color stops
    const stops = gradient.selectAll('stop') as any;
    expect(stops).toHaveLength(2);

    // Verify the colors and positions of the stops
    expect(stops[0].attr('stop-color')).toBe('red');
    expect(stops[1].attr('stop-color')).toBe('blue');
    expect(stops[0].attr('offset')).toBe('0%');
    expect(stops[1].attr('offset')).toBe('100%');
  });

  it('should handle gradients with named colors', () => {
    createLinearGradient(
      svg,
      shapeElement,
      'to left bottom, red 0%, magenta, transparent 50%, PeachPuff, currentColor 85%, LavenderBlush 100%',
      'test-gradient-named-colors',
      true
    );

    const gradient = svg.select('defs').select('linearGradient');
    const stops = gradient.selectAll('stop') as any;

    expect(stops).toHaveLength(6);
    expect(stops[0].attr('stop-color')).toBe('red');
    expect(stops[1].attr('stop-color')).toBe('magenta');
    expect(stops[2].attr('stop-color')).toBe('transparent');
    expect(stops[3].attr('stop-color')).toBe('PeachPuff');
    expect(stops[4].attr('stop-color')).toBe('currentColor');
    expect(stops[5].attr('stop-color')).toBe('LavenderBlush');
    expect(stops[0].attr('offset')).toBe('0%');
    expect(stops[1].attr('offset')).toBe('25%');
    expect(stops[2].attr('offset')).toBe('50%');
    expect(stops[3].attr('offset')).toBe('67.5%');
    expect(stops[4].attr('offset')).toBe('85%');
    expect(stops[5].attr('offset')).toBe('100%');
  });

  it('should handle gradients with hex(a) color values', () => {
    createLinearGradient(
      svg,
      shapeElement,
      'to right, #ff0000 0%, #00ff0080 50%, #00f 70%, #F3A7 100%',
      'test-gradient-hex-colors',
      true // Turns off non-linear interpolation
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    expect(stops).toHaveLength(4);
    expect(stops[0].attr('stop-color')).toBe('#ff0000');
    expect(stops[1].attr('stop-color')).toBe('#00ff0080');
    expect(stops[2].attr('stop-color')).toBe('#00f');
    expect(stops[3].attr('stop-color')).toBe('#F3A7');
    expect(stops[0].attr('offset')).toBe('0%');
    expect(stops[1].attr('offset')).toBe('50%');
    expect(stops[2].attr('offset')).toBe('70%');
    expect(stops[3].attr('offset')).toBe('100%');
  });

  it('should handle gradients with color functions in flexible formats and spacing', () => {
    createLinearGradient(
      svg,
      shapeElement,
      ` rgb( 0%,100%, 50%),
        rGB(none 81 none),
        rgba(255,0 ,0,0.5),
        hsl(180, 100%, 50%),
        HSl(0.5turn, 76%, 50%),
        hsla(140deg 100  24%),
        hsla(3.14rad 80% 9% / 0.8 ),
        #FF6347,
        hwb(60 20%   40%),
        hwb(96 none 11),
        HWB( 0.25turn 30% 20%),
        lab(70% 15    25),
        lab(29.2345% -15.234% 32.345% / 0.16),
        lch(33%  10 270),
        LcH(50% 30 0.25turn),
        lch(60% 77  100grad)`,
      'test-gradient-color-functions',
      true
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    expect(stops[0].attr('stop-color')).toBe('rgb( 0%,100%, 50%)');
    expect(stops[1].attr('stop-color')).toBe('rGB(none 81 none)');
    expect(stops[2].attr('stop-color')).toBe('rgba(255,0 ,0,0.5)');
    expect(stops[3].attr('stop-color')).toBe('hsl(180, 100%, 50%)');
    expect(stops[4].attr('stop-color')).toBe('HSl(0.5turn, 76%, 50%)');
    expect(stops[5].attr('stop-color')).toBe('hsla(140deg 100  24%)');
    expect(stops[6].attr('stop-color')).toBe('hsla(3.14rad 80% 9% / 0.8 )');
    expect(stops[7].attr('stop-color')).toBe('#FF6347'); // A non-function in the mix to test
    expect(stops[8].attr('stop-color')).toBe('hwb(60 20%   40%)');
    expect(stops[9].attr('stop-color')).toBe('hwb(96 none 11)');
    expect(stops[10].attr('stop-color')).toBe('HWB( 0.25turn 30% 20%)');
    expect(stops[11].attr('stop-color')).toBe('lab(70% 15    25)');
    expect(stops[12].attr('stop-color')).toBe('lab(29.2345% -15.234% 32.345% / 0.16)');
    expect(stops[13].attr('stop-color')).toBe('lch(33%  10 270)');
    expect(stops[14].attr('stop-color')).toBe('LcH(50% 30 0.25turn)');
    expect(stops[15].attr('stop-color')).toBe('lch(60% 77  100grad)');
  });

  it('should handle gradients with degree angles', () => {
    createLinearGradient(svg, shapeElement, '65deg, red, blue', 'test-gradient-degree');

    const transform = svg.select('defs').select('linearGradient').attr('gradientTransform');
    const parsedAngle = parseTransformAngle(transform);

    expect(parsedAngle).toBeCloseTo(65, 8);
  });

  it('should handle gradients with radian angles', () => {
    createLinearGradient(svg, shapeElement, '1.2rad, red, blue', 'test-gradient-radian');

    const transform = svg.select('defs').select('linearGradient').attr('gradientTransform');
    const parsedAngle = parseTransformAngle(transform);

    expect(parsedAngle).toBeCloseTo(rad2deg(1.2), 8);
  });

  it('should handle gradients with turn angles', () => {
    createLinearGradient(svg, shapeElement, '0.25turn, red, blue', 'test-gradient-turn');

    const transform = svg.select('defs').select('linearGradient').attr('gradientTransform');
    const parsedAngle = parseTransformAngle(transform);

    expect(parsedAngle).toBeCloseTo(turn2deg(0.25), 8);
  });

  it('should handle gradients with gradian angles', () => {
    createLinearGradient(svg, shapeElement, '30grad, red, blue', 'test-gradient-gradian');

    const transform = svg.select('defs').select('linearGradient').attr('gradientTransform');
    const parsedAngle = parseTransformAngle(transform);

    expect(parsedAngle).toBeCloseTo(grad2deg(30), 8);
  });

  // Resetting is needed per direction for isolated tests, hence a new 'it' for each iteration below.
  for (const direction of validDirections) {
    const gradientId = `test-gradient-direction-keywords-${direction.replace(/\s+/g, '-')}`;
    it(`should handle gradients with directional keyword: ${direction}`, () => {
      createLinearGradient(svg, shapeElement, `${direction}, red, blue`, gradientId);

      const gradient = svg.select('defs').select('linearGradient');
      const parsedAngle = parseTransformAngle(gradient.attr('gradientTransform'));
      const width = +shapeElement.attr('width');
      const height = +shapeElement.attr('height');
      const expectedAngle = directionMap(direction, width, height);

      expect(gradient.attr('id')).toBe(gradientId); // As a precaution for looped tests
      expect(parsedAngle).toBeCloseTo(expectedAngle, 8);
    });
  }

  it('should handle gradient without angle/direction and default to 180deg', () => {
    createLinearGradient(svg, shapeElement, 'red, blue', 'test-gradient-no-direction');

    const gradient = svg.select('defs').select('linearGradient');
    const parsedAngle = parseTransformAngle(gradient.attr('gradientTransform'));

    const bbox = shapeElement.node()!.getBBox();
    const w = bbox.width;
    const h = bbox.height;
    const xc = bbox.x + w / 2;
    const yc = bbox.y + h / 2;
    const d1 = h * 0.5;
    const d2 = -h * 0.5;

    expect(+gradient.attr('x1')).toBeCloseTo(xc, 8);
    expect(+gradient.attr('y1')).toBeCloseTo(yc + d1, 8);
    expect(+gradient.attr('x2')).toBeCloseTo(xc, 8);
    expect(+gradient.attr('y2')).toBeCloseTo(yc + d2, 8);
    expect(parsedAngle).toBeCloseTo(180, 8);
  });

  it('should treat the "to top right" direction like a 45-degree gradient on a square rectangle', () => {
    shapeElement.attr('width', 400).attr('height', 400);
    createLinearGradient(
      svg,
      shapeElement,
      'to top right, #ff0000, #0000ff',
      'test-gradient-45-square'
    );

    const gradient = svg.select('defs').select('linearGradient');
    const parsedAngle = parseTransformAngle(gradient.attr('gradientTransform'));

    expect(parsedAngle).toBeCloseTo(45, 8);
  });

  it('should not treat the "to top right" direction like a 45-degree gradient on a non-square rectangle', () => {
    createLinearGradient(
      svg,
      shapeElement,
      'to top right, #ff0000, #0000ff',
      'test-gradient-45-non-square'
    );

    const gradient = svg.select('defs').select('linearGradient');
    const parsedAngle = parseTransformAngle(gradient.attr('gradientTransform'));

    expect(parsedAngle).not.toBeCloseTo(45, 8);
  });

  it('should handle percentage stops with extra spaces', () => {
    createLinearGradient(
      svg,
      shapeElement,
      ' to  right  , red  10% , blue   90% ',
      'test-gradient-extra-spaces'
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    expect(stops[0].attr('stop-color')).toBe('red');
    expect(stops[1].attr('stop-color')).toBe('red');
    expect(stops[2].attr('stop-color')).toBe('blue');
    expect(stops[3].attr('stop-color')).toBe('blue');
    expect(stops[0].attr('offset')).toBe('0%'); // Added for coverage requirement
    expect(stops[1].attr('offset')).toBe('10%');
    expect(stops[2].attr('offset')).toBe('90%');
    expect(stops[3].attr('offset')).toBe('100%'); // Added for coverage requirement
  });
});

describe('Length units and conversions', () => {
  it('should convert font-based units to percentages correctly', () => {
    createLinearGradient(
      svg,
      shapeElement,
      'to right, red 1rem, blue 1em, green 6ex, yellow 8ch',
      'test-gradient-font-units',
      true
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    // Note: positions are already in increasing order, so no replacement will occur
    expect(stops[0].attr('offset')).toBe('0%');
    expect(stops[1].attr('offset')).toBe('4.5%'); // 1rem (18px) -> 4.5% of 400px
    expect(stops[2].attr('offset')).toBe('7.5%'); // 1em (30px) -> 7.5% of 400px
    expect(stops[3].attr('offset')).toBe('22.5%'); // 6ex (90px) -> 22.5% of 400px
    expect(stops[4].attr('offset')).toBe('30%'); // 8ch (120px) -> 30% of 400px
    expect(stops[5].attr('offset')).toBe('100%');
  });

  it('should convert viewport-based units to percentages correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });
    createLinearGradient(
      svg,
      shapeElement,
      'to right, blue 5vh, red 10vw, green 15vmin, yellow 20vmax',
      'test-gradient-viewport-units'
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    // Note: positions are already in increasing order, so no replacement will occur
    expect(stops[0].attr('offset')).toBe('0%');
    expect(stops[1].attr('offset')).toBe('11.25%'); // 5vh (45px) -> 11.25% of 400px
    expect(stops[2].attr('offset')).toBe('30%'); // 10vw (120px) -> 30% of 400px
    expect(stops[3].attr('offset')).toBe('33.75%'); // 15vmin (135px) -> 33.75% of 400px
    expect(stops[4].attr('offset')).toBe('60%'); // 20vmax (240px) -> 60% of 400px
    expect(stops[5].attr('offset')).toBe('100%');
  });

  it('should convert pixel-based and physical units to percentages correctly assuming 96dpi', () => {
    createLinearGradient(
      svg,
      shapeElement,
      'to right, red 12pt, blue 10mm, green 50px, yellow 4pc, pink 2cm, orange 1in',
      'test-gradient-physical-units'
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    // Note: the positions are in increasing order, so no replacement will occur
    expect(stops[0].attr('offset')).toBe('0%');
    expect(stops[1].attr('offset'), 4); // 12pt -> 4% of 400px
    expect(parseFloat(stops[2].attr('offset'))).toBeCloseTo(9.448818897637796, 8); // 10mm -> ~9.4% of 400px
    expect(stops[3].attr('offset')).toBe('12.5%'); // 50px -> 12.5% of 400px
    expect(stops[4].attr('offset')).toBe('16%'); // 4pc -> 16% of 400px
    expect(parseFloat(stops[5].attr('offset'))).toBeCloseTo(18.89763779527559, 8); // 2cm -> ~18.9% of 400px
    expect(stops[6].attr('offset')).toBe('24%'); // 1in -> 24% of 400px
    expect(stops[7].attr('offset')).toBe('100%');
  });

  it('should convert pixel-based and physical units to percentages for a slanted gradient', () => {
    createLinearGradient(
      svg,
      shapeElement,
      '37deg, red 12pt, blue 10mm, green 50px, yellow 4pc, pink 2cm, orange 1in',
      'test-gradient-slanted-physical-units'
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    // Calculate the gradient line length for the slanted gradient
    const bbox = shapeElement.node()!.getBBox();
    const nodeWidth = bbox.width;
    const nodeHeight = bbox.height;
    const angleRad = deg2rad(37);
    const gradientLineLength =
      Math.abs(nodeWidth * Math.sin(angleRad)) + Math.abs(nodeHeight * Math.cos(angleRad));

    // Note: the positions are in increasing order, so no replacement will occur
    expect(stops[0].attr('offset')).toBe('0%');
    expect(parseFloat(stops[1].attr('offset'))).toBeCloseTo(
      (((12 / 72) * 96) / gradientLineLength) * 100,
      8
    );
    expect(parseFloat(stops[2].attr('offset'))).toBeCloseTo(
      (((10 / 25.4) * 96) / gradientLineLength) * 100,
      8
    );
    expect(parseFloat(stops[3].attr('offset'))).toBeCloseTo((50 / gradientLineLength) * 100, 8);
    expect(parseFloat(stops[4].attr('offset'))).toBeCloseTo(
      ((((4 * 12) / 72) * 96) / gradientLineLength) * 100,
      8
    );
    expect(parseFloat(stops[5].attr('offset'))).toBeCloseTo(
      (((2 / 2.54) * 96) / gradientLineLength) * 100,
      8
    );
    expect(parseFloat(stops[6].attr('offset'))).toBeCloseTo(
      ((1 * 96) / gradientLineLength) * 100,
      8
    );
    expect(stops[7].attr('offset')).toBe('100%');
  });
});

describe('Special cases for color stops and positions', () => {
  it('should correctly split double stops into two separate stops while adding 0% stop if not covered', () => {
    createLinearGradient(
      svg,
      shapeElement,
      'to left, green 10.45% 50.31%, yellow 80% 100%',
      'test-gradient-double-stop'
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    expect(stops).toHaveLength(5);
    expect(stops[0].attr('offset')).toBe('0%');
    expect(stops[1].attr('offset')).toBe('10.45%');
    expect(stops[2].attr('offset')).toBe('50.31%');
    expect(stops[3].attr('offset')).toBe('80%');
    expect(stops[4].attr('offset')).toBe('100%');
  });

  it('should correctly interpolate undefined color stop positions between specified ones', () => {
    createLinearGradient(
      svg,
      shapeElement,
      'red 6%, yellow, green, blue 50%, violet, indigo, orange, pink, black 98%',
      'test-gradient-gap-interpolation'
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    expect(stops).toHaveLength(11);
    expect(stops[0].attr('offset')).toBe('0%');
    expect(stops[1].attr('offset')).toBe('6%');
    expect(parseFloat(stops[2].attr('offset'))).toBeCloseTo(20.666666666666664, 8);
    expect(parseFloat(stops[3].attr('offset'))).toBeCloseTo(35.33333333333333, 8);
    expect(stops[4].attr('offset')).toBe('50%');
    expect(stops[5].attr('offset')).toBe('59.6%');
    expect(stops[6].attr('offset')).toBe('69.2%');
    expect(stops[7].attr('offset')).toBe('78.8%');
    expect(stops[8].attr('offset')).toBe('88.4%');
    expect(stops[9].attr('offset')).toBe('98%');
    expect(stops[10].attr('offset')).toBe('100%');
  });

  it('should interpolate and renorm correctly for out-of-bounds gradients', () => {
    createLinearGradient(
      svg,
      shapeElement,
      '35deg, red -50%, orange, green 40%, blue, yellow 115%',
      'test-gradient-out-of-bounds-renorm-interpolation'
    );

    const gradient = svg.select('defs').select('linearGradient');
    const stops = gradient.selectAll('stop') as any;

    // Get the node's dimensions
    const bbox = shapeElement.node()!.getBBox();
    const nodeWidth = bbox.width;
    const nodeHeight = bbox.height;

    // Calculate the gradient line length applied to a rectangle
    const angleRad = deg2rad(35);
    const gradientLineLength =
      Math.abs(nodeWidth * Math.sin(angleRad)) + Math.abs(nodeHeight * Math.cos(angleRad));

    // Define the minimum and maximum stops set for the gradient
    const minStop = -50;
    const maxStop = 115;

    // SVG linear gradient coordinates
    const xc = bbox.x + nodeWidth / 2;
    const yc = bbox.y + nodeHeight / 2;
    const d1 = (gradientLineLength * (50 - minStop)) / 100;
    const d2 = (gradientLineLength * (50 - maxStop)) / 100;

    // Verify gradient coordinates
    expect(+gradient.attr('x1')).toBeCloseTo(xc, 8);
    expect(+gradient.attr('y1')).toBeCloseTo(yc + d1, 8);
    expect(+gradient.attr('x2')).toBeCloseTo(xc, 8);
    expect(+gradient.attr('y2')).toBeCloseTo(yc + d2, 8);

    // Verify color stops positions
    expect(stops[0].attr('offset')).toBe('-50%');
    expect(parseFloat(stops[1].attr('offset'))).toBeCloseTo(27.27272727272727, 8);
    expect(parseFloat(stops[2].attr('offset'))).toBeCloseTo(54.54545454545454, 8);
    expect(parseFloat(stops[3].attr('offset'))).toBeCloseTo(77.27272727272727, 8);
    expect(stops[4].attr('offset')).toBe('115%');
  });

  it('should adjust positions to maintain ascending order for overlapping stop positions', () => {
    createLinearGradient(
      svg,
      shapeElement,
      'to bottom, black 60%, white 40%',
      'test-gradient-overlap-adjust'
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    expect(stops[1].attr('offset')).toBe('60%'); // Keep 60% as is
    expect(stops[2].attr('offset')).toBe('60%'); // Replace 40% with 60% to maintain order
  });

  it('should handle gradients with all color stops beyond 100%', () => {
    createLinearGradient(
      svg,
      shapeElement,
      'to right, red 110%, blue 150%',
      'test-gradient-beyond-100'
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    expect(stops).toHaveLength(3);
    expect(stops[0].attr('offset')).toBe('0%');
    expect(stops[1].attr('offset')).toBe('110%');
    expect(stops[2].attr('offset')).toBe('150%');
  });

  it('should handle gradients with all color stops below 0%', () => {
    createLinearGradient(svg, shapeElement, 'to top, red -50%, blue -10%', 'test-gradient-below-0');

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    expect(stops).toHaveLength(3);
    expect(stops[0].attr('stop-color')).toBe('red');
    expect(stops[1].attr('stop-color')).toBe('blue');
    expect(stops[2].attr('stop-color')).toBe('blue');
    expect(stops[0].attr('offset')).toBe('-50%');
    expect(stops[1].attr('offset')).toBe('-10%');
    expect(stops[2].attr('offset')).toBe('100%');
  });

  it('should handle mixed length units with out-of-bounds positions', () => {
    createLinearGradient(
      svg,
      shapeElement,
      'to right, red -50px, orange 1in, transparent 50%, black 20em',
      'test-gradient-mixed-units-out-of-bounds',
      true
    );

    const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

    // All stop positions, except first and last, are normalized as bounds exceed 0-100%
    expect(stops[0].attr('offset')).toBe('-12.5%'); // -50px -> -12.5% of 400px
    expect(parseFloat(stops[1].attr('offset'))).toBeCloseTo(22.46153846153846, 8); // 1in -> 24% of 400px, normalized to ~22.5%
    expect(parseFloat(stops[2].attr('offset'))).toBeCloseTo(38.46153846153847, 8); // 50% is normalized to ~38.5%
    expect(stops[3].attr('offset')).toBe('150%'); // 20em (600px) -> 150% of 400px
  });
});

describe('Error handling', () => {
  it('should handle gradients with consecutive commas', () => {
    expect(() => {
      createLinearGradient(
        svg,
        shapeElement,
        'to right, red, , blue',
        'test-gradient-consecutive-commas'
      );
    }).toThrow('Found consecutive commas (,,) in the gradient string.');
  });

  it('should throw an error for invalid unit types in gradient positions', () => {
    const invalidUnits = ['pqr', 'mn', 'zz'];
    invalidUnits.forEach((unit) => {
      expect(() => {
        createLinearGradient(
          svg,
          shapeElement,
          `to top right, pink 3${unit}, red 10%, blue 100%`,
          'test-gradient-invalid-unit'
        );
      }).toThrow(`Unsupported unit found in gradient position: ${unit}`);
    });
  });

  it('should handle invalid color values in gradient', () => {
    const invalidColors = [
      'invalidColor', // Invalid named color
      '#xyz123', // Invalid hex code
      '#12345', // Invalid hex length
      'rgc(0, 0, 0)', // Misspelled color function
      'rgb(8, 17)', // Missing a color value in rgb()
      'rgba(0, 0, 0, 0.5,)', // Extra comma in rgba()
      'hsl(1.2turn, 63%, 3)', // Lightness should have '%' as well
      'hsla(14%, 3%, 0.5%, 0.2)', // Hue should not have '%'
      'hwb(240 20% 30%%)', // Double '%' in blackness
      'hwb(240, 20%, 30%)', // Commas in hwb()
      'hwb(240 20% a%)', // Non-numeric blackness in hwb()
      'lab(7deg -10 20%)', // Luminance should not have 'deg'
      'lch(50% 11 120%)', // Hue should not have '%' in lch()
      'lch(40% 30 240 60)', // Too many parameters in lch()
      'oklab(50% 0.5)', // Missing 'b' channel in oklab()
      'oklab(50% 0.5 0.4turn)', // 'b' channel should be a number, not an angle
      'oklch(80% 0.2 300%)', // Hue should not have '%' in oklch()
      'oklch(80% 0.2)', // Missing hue value in oklch()
      'oklch(80% 0.2 300 0.5 9)', // Extra parameter in oklch()
    ];
    invalidColors.forEach((color) => {
      const gradientStyle = `0.43turn, pink 17%, ${color} 38%, brown`;
      expect(() => {
        createLinearGradient(svg, shapeElement, gradientStyle, 'test-gradient-invalid-color');
      }).toThrow(`Invalid color value found in color stop: '${color} 38%'`);
    });
  });

  it('should handle gradients with no color stops', () => {
    expect(() => {
      createLinearGradient(svg, shapeElement, '', 'test-gradient-no-stops');
    }).toThrow('Linear gradient found with empty style.');
  });

  it('should handle gradients with only one color stop', () => {
    expect(() => {
      createLinearGradient(svg, shapeElement, 'red', 'test-gradient-one-stop');
    }).toThrow('At least two stops are required to create a linear gradient. Found 1.');
  });

  it('should handle gradients with invalid direction keywords', () => {
    expect(() => {
      createLinearGradient(
        svg,
        shapeElement,
        'to top right bottom, red, blue',
        'test-gradient-invalid-direction'
      );
    }).toThrow("Invalid direction keyword found in gradient: 'to top right bottom'");
  });

  it('should handle gradients with invalid angle values', () => {
    expect(() => {
      createLinearGradient(svg, shapeElement, '4q5deg, green, cyan', 'test-gradient-invalid-angle');
    }).toThrow("Invalid angle value found in gradient: '4q5deg'");
  });

  it('should throw an error if a color stop contains more than two positions', () => {
    expect(() => {
      createLinearGradient(
        svg,
        shapeElement,
        '0.8rad, green 5% 10% 15%, purple',
        'test-gradient-multiple-positions'
      );
    }).toThrow("Too many positions in color stop: 'green 5% 10% 15%'");
  });

  it('should throw an error if unsupported element is passed for gradient creation', () => {
    ({ svg, shapeElement } = createShape('line'));
    expect(() => {
      createLinearGradient(svg, shapeElement, 'violet, gold', 'test-gradient-unsupported-element');
    }).toThrow(
      `Unsupported shape type for gradient line length calculation: ${shapeElement.node()?.tagName}`
    );
  });

  it('should throw an error for a transition hint without surrounding color stops', () => {
    expect(() => {
      createLinearGradient(
        svg,
        shapeElement,
        'to right, 20%, #013220',
        'test-gradient-illegal-transition'
      );
    }).toThrow("The transition hint '20%' does not have surrounding color stops");
  });

  describe('Non-linear interpolation', () => {
    it('should handle gradients requiring non-linear interpolation due to a transition hint', () => {
      createLinearGradient(
        svg,
        shapeElement,
        'to top left, red, 25%, blue',
        'test-gradient-transition-hint-interpolation',
        false // Allows for non-linear interpolation (default behavior)
      );

      const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

      // Should have 2 original + 5 transition stops
      expect(stops).toHaveLength(7);
      expect(stops[0].attr('offset')).toBe('0%');
      expect(parseFloat(stops[1].attr('offset'))).toBeCloseTo(8.333333333333332, 8);
      expect(parseFloat(stops[2].attr('offset'))).toBeCloseTo(16.666666666666664, 8);
      expect(stops[3].attr('offset')).toBe('25%');
      expect(stops[4].attr('offset')).toBe('50%');
      expect(stops[5].attr('offset')).toBe('75%');
      expect(stops[6].attr('offset')).toBe('100%');

      // Colors should be interpolated rgba() values
      expect(stops[0].attr('stop-color')).toBe('red');
      expect(stops[1].attr('stop-color')).toBe('rgba(181, 0, 74, 1)');
      expect(stops[2].attr('stop-color')).toBe('rgba(151, 0, 104, 1)');
      expect(stops[3].attr('stop-color')).toBe('rgba(128, 0, 128, 1)');
      expect(stops[4].attr('stop-color')).toBe('rgba(75, 0, 180, 1)');
      expect(stops[5].attr('stop-color')).toBe('rgba(34, 0, 221, 1)');
      expect(stops[6].attr('stop-color')).toBe('blue');
    });

    it('should handle gradients requiring non-linear interpolation due to opacity gradient', () => {
      createLinearGradient(
        svg,
        shapeElement,
        '88deg, pink, rgba(255, 0, 0, 0.27), hsla(240, 100%, 50%, 0.8)',
        'test-gradient-opacity-gradient-interpolation'
      );

      const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

      // Should have 3 original + 10 transition stops
      expect(stops).toHaveLength(13);
      expect(stops[0].attr('offset')).toBe('0%');
      expect(parseFloat(stops[1].attr('offset'))).toBeCloseTo(8.333333333333332, 8);
      expect(parseFloat(stops[2].attr('offset'))).toBeCloseTo(16.666666666666664, 8);
      expect(stops[3].attr('offset')).toBe('25%');
      expect(parseFloat(stops[4].attr('offset'))).toBeCloseTo(33.333333333333336, 8);
      expect(parseFloat(stops[5].attr('offset'))).toBeCloseTo(41.666666666666664, 8);
      expect(stops[6].attr('offset')).toBe('50%');
      expect(parseFloat(stops[7].attr('offset'))).toBeCloseTo(58.33333333333333, 8);
      expect(parseFloat(stops[8].attr('offset'))).toBeCloseTo(66.66666666666666, 8);
      expect(stops[9].attr('offset')).toBe('75%');
      expect(parseFloat(stops[10].attr('offset'))).toBeCloseTo(83.33333333333334, 8);
      expect(parseFloat(stops[11].attr('offset'))).toBeCloseTo(91.66666666666666, 8);
      expect(stops[12].attr('offset')).toBe('100%');

      // Should have interpolated colors in between the original ones
      expect(stops[0].attr('stop-color')).toBe('pink');
      expect(stops[1].attr('stop-color')).toBe('rgba(255, 182, 193, 0.8783333333333334)');
      expect(stops[2].attr('stop-color')).toBe('rgba(255, 169, 179, 0.7566666666666667)');
      expect(stops[3].attr('stop-color')).toBe('rgba(255, 151, 160, 0.635)');
      expect(stops[4].attr('stop-color')).toBe('rgba(255, 125, 132, 0.5133333333333333)');
      expect(stops[5].attr('stop-color')).toBe('rgba(255, 82, 86, 0.3916666666666667)');
      expect(stops[6].attr('stop-color')).toBe('rgba(255, 0, 0, 0.27)');
      expect(stops[7].attr('stop-color')).toBe('rgba(160, 0, 95, 0.3583333333333334)');
      expect(stops[8].attr('stop-color')).toBe('rgba(103, 0, 152, 0.44666666666666666)');
      expect(stops[9].attr('stop-color')).toBe('rgba(64, 0, 191, 0.535)');
      expect(stops[10].attr('stop-color')).toBe('rgba(37, 0, 218, 0.6233333333333334)');
      expect(stops[11].attr('stop-color')).toBe('rgba(16, 0, 239, 0.7116666666666667)');
      expect(stops[12].attr('stop-color')).toBe('hsla(240, 100%, 50%, 0.8)');
    });

    it('should handle gradients requiring non-linear interpolation due to both transition hint and opacity gradient', () => {
      createLinearGradient(
        svg,
        shapeElement,
        'to bottom right, rgba(100, 240, 36, 0.9), 67%, #0df20d33', // #0df20d33 has a 0.2 opacity
        'test-gradient-transition-hint-with-opacity-gradient-interpolation'
      );

      const stops = svg.select('defs').select('linearGradient').selectAll('stop') as any;

      // Should have 2 original + 5 transition stops
      expect(stops).toHaveLength(7);
      expect(stops[0].attr('offset')).toBe('0%');
      expect(parseFloat(stops[1].attr('offset'))).toBeCloseTo(22.333333333333332, 8);
      expect(parseFloat(stops[2].attr('offset'))).toBeCloseTo(44.666666666666664, 8);
      expect(stops[3].attr('offset')).toBe('67%');
      expect(stops[4].attr('offset')).toBe('78%');
      expect(stops[5].attr('offset')).toBe('89%');
      expect(stops[6].attr('offset')).toBe('100%');

      // Should have interpolated colors in between the original ones
      expect(stops[0].attr('stop-color')).toBe('rgba(100, 240, 36, 0.9)');
      expect(stops[1].attr('stop-color')).toBe('rgba(98, 240, 36, 0.8477283929954609)');
      expect(stops[2].attr('stop-color')).toBe('rgba(94, 240, 34, 0.726504176075029)');
      expect(stops[3].attr('stop-color')).toBe('rgba(84, 240, 32, 0.55)');
      expect(stops[4].attr('stop-color')).toBe('rgba(75, 241, 29, 0.44466061728917605)');
      expect(stops[5].attr('stop-color')).toBe('rgba(57, 241, 25, 0.32786016467038714)');
      expect(stops[6].attr('stop-color')).toBe('#0df20d33');
    });
  });
});

// cspell:ignore renorm vmin vmax oklab oklch d2 d1
