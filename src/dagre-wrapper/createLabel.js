const createLabel = (vertexText, style, isTitle) => {
  const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  svgLabel.setAttribute('style', style.replace('color:', 'fill:'));
  let rows = [];
  if (typeof vertexText === 'string') {
    rows = vertexText.split(/\\n|\n|<br\s*\/?>/gi);
  } else if (Array.isArray(vertexText)) {
    rows = vertexText;
  } else {
    rows = [];
  }

  for (let j = 0; j < rows.length; j++) {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    tspan.setAttribute('dy', '1em');
    tspan.setAttribute('x', '0');
    if (isTitle) {
      tspan.setAttribute('class', 'title-row');
    } else {
      tspan.setAttribute('class', 'row');
    }
    tspan.textContent = rows[j].trim();
    svgLabel.appendChild(tspan);
  }
  return svgLabel;
};

export default createLabel;
