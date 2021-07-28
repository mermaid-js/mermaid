/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */

// import { log } from '../logger';

// Only add the number of markers that the diagram needs
const insertPatterns = (elem, patternArray, type, id) => {
  patternArray.forEach((patternName) => {
    patterns[patternName](elem, type, id);
  });
};

{
  /* <svg height="10" width="10" xmlns="http://www.w3.org/2000/svg" version="1.1">
  {' '}
  <defs>
    {' '}
    <pattern id="circles-1" patternUnits="userSpaceOnUse" width="10" height="10">
      {' '}
      <image
        xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSJ3aGl0ZSIgLz4KICA8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0iYmxhY2siLz4KPC9zdmc+"
        x="0"
        y="0"
        width="10"
        height="10"
      >
        {' '}
      </image>{' '}
    </pattern>{' '}
  </defs>{' '}
</svg>; */
}

const dots = (elem, type) => {
  elem
    .append('defs')
    .append('marker')
    .attr('id', type + '-barbEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 14)
    .attr('markerUnits', 0)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 19,7 L9,13 L14,7 L9,1 Z');
};

// TODO rename the class diagram markers to something shape descriptive and semanitc free
const patterns = {
  dots,
};
export default insertPatterns;
