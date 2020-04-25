const createLabel = (vertexText, style) => {
  const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  svgLabel.setAttribute('style', style.replace('color:', 'fill:'));
  let rows = [];
  if (vertexText) {
    rows = vertexText.split(/\\n|\n|<br\s*\/?>/gi);
  }

  for (let j = 0; j < rows.length; j++) {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    tspan.setAttribute('dy', '1em');
    tspan.setAttribute('x', '0');
    tspan.textContent = rows[j].trim();
    svgLabel.appendChild(tspan);
  }
  return svgLabel;
};

export default createLabel;
