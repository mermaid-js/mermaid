import common from '../common/common';

export const drawRect = function (elem, rectData) {
  const rectElem = elem.append('rect');
  rectElem.attr('x', rectData.x);
  rectElem.attr('y', rectData.y);
  rectElem.attr('fill', rectData.fill);
  rectElem.attr('stroke', rectData.stroke);
  rectElem.attr('width', rectData.width);
  rectElem.attr('height', rectData.height);
  rectElem.attr('rx', rectData.rx);
  rectElem.attr('ry', rectData.ry);

  if (typeof rectData.class !== 'undefined') {
    rectElem.attr('class', rectData.class);
  }

  return rectElem;
};

export const drawText = function (elem, textData) {
  let prevTextHeight = 0,
    textHeight = 0;
  const lines = textData.text.split(common.lineBreakRegex);

  let textElems = [];
  let dy = 0;
  let yfunc = () => textData.y;
  if (
    typeof textData.valign !== 'undefined' &&
    typeof textData.textMargin !== 'undefined' &&
    textData.textMargin > 0
  ) {
    switch (textData.valign) {
      case 'top':
      case 'start':
        yfunc = () => Math.round(textData.y + textData.textMargin);
        break;
      case 'middle':
      case 'center':
        yfunc = () =>
          Math.round(textData.y + (prevTextHeight + textHeight + textData.textMargin) / 2);
        break;
      case 'bottom':
      case 'end':
        yfunc = () =>
          Math.round(
            textData.y +
              (prevTextHeight + textHeight + 2 * textData.textMargin) -
              textData.textMargin
          );
        break;
    }
  }
  if (
    typeof textData.anchor !== 'undefined' &&
    typeof textData.textMargin !== 'undefined' &&
    typeof textData.width !== 'undefined'
  ) {
    switch (textData.anchor) {
      case 'left':
      case 'start':
        textData.x = Math.round(textData.x + textData.textMargin);
        textData.anchor = 'start';
        textData.dominantBaseline = 'text-after-edge';
        textData.alignmentBaseline = 'middle';
        break;
      case 'middle':
      case 'center':
        textData.x = Math.round(textData.x + textData.width / 2);
        textData.anchor = 'middle';
        textData.dominantBaseline = 'middle';
        textData.alignmentBaseline = 'middle';
        break;
      case 'right':
      case 'end':
        textData.x = Math.round(textData.x + textData.width - textData.textMargin);
        textData.anchor = 'end';
        textData.dominantBaseline = 'text-before-edge';
        textData.alignmentBaseline = 'middle';
        break;
    }
  }
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (
      typeof textData.textMargin !== 'undefined' &&
      textData.textMargin === 0 &&
      typeof textData.fontSize !== 'undefined'
    ) {
      dy = i * textData.fontSize;
    }

    const textElem = elem.append('text');
    textElem.attr('x', textData.x);
    textElem.attr('y', yfunc());
    if (typeof textData.anchor !== 'undefined') {
      textElem
        .attr('text-anchor', textData.anchor)
        .attr('dominant-baseline', textData.dominantBaseline)
        .attr('alignment-baseline', textData.alignmentBaseline);
    }
    if (typeof textData.fontFamily !== 'undefined') {
      textElem.style('font-family', textData.fontFamily);
    }
    if (typeof textData.fontSize !== 'undefined') {
      textElem.style('font-size', textData.fontSize);
    }
    if (typeof textData.fontWeight !== 'undefined') {
      textElem.style('font-weight', textData.fontWeight);
    }
    if (typeof textData.fill !== 'undefined') {
      textElem.attr('fill', textData.fill);
    }
    if (typeof textData.class !== 'undefined') {
      textElem.attr('class', textData.class);
    }
    if (typeof textData.dy !== 'undefined') {
      textElem.attr('dy', textData.dy);
    } else if (dy !== 0) {
      textElem.attr('dy', dy);
    }

    if (textData.tspan) {
      const span = textElem.append('tspan');
      span.attr('x', textData.x);
      if (typeof textData.fill !== 'undefined') {
        span.attr('fill', textData.fill);
      }
      span.text(line);
    } else {
      textElem.text(line);
    }
    if (
      typeof textData.valign !== 'undefined' &&
      typeof textData.textMargin !== 'undefined' &&
      textData.textMargin > 0
    ) {
      textHeight += (textElem._groups || textElem)[0][0].getBBox().height;
      prevTextHeight = textHeight;
    }

    textElems.push(textElem);
  }

  return textElems;
};

export const drawLabel = function (elem, txtObject) {
  function genPoints(x, y, width, height, cut) {
    return (
      x +
      ',' +
      y +
      ' ' +
      (x + width) +
      ',' +
      y +
      ' ' +
      (x + width) +
      ',' +
      (y + height - cut) +
      ' ' +
      (x + width - cut * 1.2) +
      ',' +
      (y + height) +
      ' ' +
      x +
      ',' +
      (y + height)
    );
  }
  const polygon = elem.append('polygon');
  polygon.attr('points', genPoints(txtObject.x, txtObject.y, txtObject.width, txtObject.height, 7));
  polygon.attr('class', 'labelBox');

  txtObject.y = txtObject.y + txtObject.height / 2;

  drawText(elem, txtObject);
  return polygon;
};

let actorCnt = -1;
/**
 * Draws an actor in the diagram with the attached line
 * @param elem - The diagram we'll draw to.
 * @param actor - The actor to draw.
 * @param conf - drawText implementation discriminator object
 */
export const drawActor = function (elem, actor, conf) {
  const center = actor.x + actor.width / 2;

  const g = elem.append('g');
  if (actor.y === 0) {
    actorCnt++;
    g.append('line')
      .attr('id', 'actor' + actorCnt)
      .attr('x1', center)
      .attr('y1', 5)
      .attr('x2', center)
      .attr('y2', 2000)
      .attr('class', 'actor-line')
      .attr('stroke-width', '0.5px')
      .attr('stroke', '#999');
  }

  const rect = getNoteRect();
  rect.x = actor.x;
  rect.y = actor.y;
  rect.fill = '#eaeaea';
  rect.width = actor.width;
  rect.height = actor.height;
  rect.class = 'actor';
  rect.rx = 3;
  rect.ry = 3;
  drawRect(g, rect);

  _drawTextCandidateFunc(conf)(
    actor.description,
    g,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    { class: 'actor' },
    conf
  );
};

export const anchorElement = function (elem) {
  return elem.append('g');
};
/**
 * Draws an activation in the diagram
 * @param elem - element to append activation rect.
 * @param bounds - activation box bounds.
 * @param verticalPos - precise y cooridnate of bottom activation box edge.
 * @param conf - sequence diagram config object.
 * @param actorActivations - number of activations on the actor.
 */
export const drawActivation = function (elem, bounds, verticalPos, conf, actorActivations) {
  const rect = getNoteRect();
  const g = bounds.anchored;
  rect.x = bounds.startx;
  rect.y = bounds.starty;
  rect.class = 'activation' + (actorActivations % 3); // Will evaluate to 0, 1 or 2
  rect.width = bounds.stopx - bounds.startx;
  rect.height = verticalPos - bounds.starty;
  drawRect(g, rect);
};

/**
 * Draws a loop in the diagram
 * @param elem - elemenet to append the loop to.
 * @param loopModel - loopModel of the given loop.
 * @param labelText - Text within the loop.
 * @param conf - diagrom configuration
 */
export const drawLoop = function (elem, loopModel, labelText, conf) {
  const {
    boxMargin,
    boxTextMargin,
    labelBoxHeight,
    labelBoxWidth,
    messageFontFamily: fontFamily,
    messageFontSize: fontSize,
    messageFontWeight: fontWeight,
  } = conf;
  const g = elem.append('g');
  const drawLoopLine = function (startx, starty, stopx, stopy) {
    return g
      .append('line')
      .attr('x1', startx)
      .attr('y1', starty)
      .attr('x2', stopx)
      .attr('y2', stopy)
      .attr('class', 'loopLine');
  };
  drawLoopLine(loopModel.startx, loopModel.starty, loopModel.stopx, loopModel.starty);
  drawLoopLine(loopModel.stopx, loopModel.starty, loopModel.stopx, loopModel.stopy);
  drawLoopLine(loopModel.startx, loopModel.stopy, loopModel.stopx, loopModel.stopy);
  drawLoopLine(loopModel.startx, loopModel.starty, loopModel.startx, loopModel.stopy);
  if (typeof loopModel.sections !== 'undefined') {
    loopModel.sections.forEach(function (item) {
      drawLoopLine(loopModel.startx, item.y, loopModel.stopx, item.y).style(
        'stroke-dasharray',
        '3, 3'
      );
    });
  }

  let txt = getTextObj();
  txt.text = labelText;
  txt.x = loopModel.startx;
  txt.y = loopModel.starty;
  txt.fontFamily = fontFamily;
  txt.fontSize = fontSize;
  txt.fontWeight = fontWeight;
  txt.anchor = 'middle';
  txt.valign = 'middle';
  txt.tspan = false;
  txt.width = labelBoxWidth || 50;
  txt.height = labelBoxHeight || 20;
  txt.textMargin = boxTextMargin;
  txt.class = 'labelText';

  drawLabel(g, txt);
  txt = getTextObj();
  txt.text = loopModel.title;
  txt.x = loopModel.startx + labelBoxWidth / 2 + (loopModel.stopx - loopModel.startx) / 2;
  txt.y = loopModel.starty + boxMargin + boxTextMargin;
  txt.anchor = 'middle';
  txt.valign = 'middle';
  txt.textMargin = boxTextMargin;
  txt.class = 'loopText';
  txt.fontFamily = fontFamily;
  txt.fontSize = fontSize;
  txt.fontWeight = fontWeight;
  txt.wrap = true;

  let textElem = drawText(g, txt);

  if (typeof loopModel.sectionTitles !== 'undefined') {
    loopModel.sectionTitles.forEach(function (item, idx) {
      if (item.message) {
        txt.text = item.message;
        txt.x = loopModel.startx + (loopModel.stopx - loopModel.startx) / 2;
        txt.y = loopModel.sections[idx].y + boxMargin + boxTextMargin;
        txt.class = 'loopText';
        txt.anchor = 'middle';
        txt.valign = 'middle';
        txt.tspan = false;
        txt.fontFamily = fontFamily;
        txt.fontSize = fontSize;
        txt.fontWeight = fontWeight;
        txt.wrap = loopModel.wrap;
        textElem = drawText(g, txt);
        let sectionHeight = Math.round(
          textElem
            .map((te) => (te._groups || te)[0][0].getBBox().height)
            .reduce((acc, curr) => acc + curr)
        );
        loopModel.sections[idx].height += sectionHeight - (boxMargin + boxTextMargin);
      }
    });
  }

  loopModel.height = Math.round(loopModel.stopy - loopModel.starty);
  return g;
};

/**
 * Draws a background rectangle
 * @param elem diagram (reference for bounds)
 * @param bounds shape of the rectangle
 */
export const drawBackgroundRect = function (elem, bounds) {
  const rectElem = drawRect(elem, {
    x: bounds.startx,
    y: bounds.starty,
    width: bounds.stopx - bounds.startx,
    height: bounds.stopy - bounds.starty,
    fill: bounds.fill,
    class: 'rect',
  });
  rectElem.lower();
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
export const insertArrowHead = function (elem) {
  elem
    .append('defs')
    .append('marker')
    .attr('id', 'arrowhead')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z'); // this is actual shape for arrowhead
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
export const insertArrowFilledHead = function (elem) {
  elem
    .append('defs')
    .append('marker')
    .attr('id', 'filled-head')
    .attr('refX', 18)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z');
};
/**
 * Setup node number. The result is appended to the svg.
 */
export const insertSequenceNumber = function (elem) {
  elem
    .append('defs')
    .append('marker')
    .attr('id', 'sequencenumber')
    .attr('refX', 15)
    .attr('refY', 15)
    .attr('markerWidth', 60)
    .attr('markerHeight', 40)
    .attr('orient', 'auto')
    .append('circle')
    .attr('cx', 15)
    .attr('cy', 15)
    .attr('r', 6);
  // .style("fill", '#f00');
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
export const insertArrowCrossHead = function (elem) {
  const defs = elem.append('defs');
  const marker = defs
    .append('marker')
    .attr('id', 'crosshead')
    .attr('markerWidth', 15)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .attr('refX', 16)
    .attr('refY', 4);

  // The arrow
  marker
    .append('path')
    .attr('fill', 'black')
    .attr('stroke', '#000000')
    .style('stroke-dasharray', '0, 0')
    .attr('stroke-width', '1px')
    .attr('d', 'M 9,2 V 6 L16,4 Z');

  // The cross
  marker
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', '#000000')
    .style('stroke-dasharray', '0, 0')
    .attr('stroke-width', '1px')
    .attr('d', 'M 0,1 L 6,7 M 6,1 L 0,7');
  // this is actual shape for arrowhead
};

export const getTextObj = function () {
  return {
    x: 0,
    y: 0,
    fill: undefined,
    anchor: undefined,
    style: '#666',
    width: undefined,
    height: undefined,
    textMargin: 0,
    rx: 0,
    ry: 0,
    tspan: true,
    valign: undefined,
  };
};

export const getNoteRect = function () {
  return {
    x: 0,
    y: 0,
    fill: '#EDF2AE',
    stroke: '#666',
    width: 100,
    anchor: 'start',
    height: 100,
    rx: 0,
    ry: 0,
  };
};

const _drawTextCandidateFunc = (function () {
  function byText(content, g, x, y, width, height, textAttrs) {
    const text = g
      .append('text')
      .attr('x', x + width / 2)
      .attr('y', y + height / 2 + 5)
      .style('text-anchor', 'middle')
      .text(content);
    _setTextAttrs(text, textAttrs);
  }

  function byTspan(content, g, x, y, width, height, textAttrs, conf) {
    const { actorFontSize, actorFontFamily, actorFontWeight } = conf;

    const lines = content.split(common.lineBreakRegex);
    for (let i = 0; i < lines.length; i++) {
      const dy = i * actorFontSize - (actorFontSize * (lines.length - 1)) / 2;
      const text = g
        .append('text')
        .attr('x', x + width / 2)
        .attr('y', y)
        .style('text-anchor', 'middle')
        .style('font-size', actorFontSize)
        .style('font-weight', actorFontWeight)
        .style('font-family', actorFontFamily);
      text
        .append('tspan')
        .attr('x', x + width / 2)
        .attr('dy', dy)
        .text(lines[i]);

      text
        .attr('y', y + height / 2.0)
        .attr('dominant-baseline', 'central')
        .attr('alignment-baseline', 'central');

      _setTextAttrs(text, textAttrs);
    }
  }

  function byFo(content, g, x, y, width, height, textAttrs, conf) {
    const s = g.append('switch');
    const f = s
      .append('foreignObject')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height);

    const text = f
      .append('xhtml:div')
      .style('display', 'table')
      .style('height', '100%')
      .style('width', '100%');

    text
      .append('div')
      .style('display', 'table-cell')
      .style('text-align', 'center')
      .style('vertical-align', 'middle')
      .text(content);

    byTspan(content, s, x, y, width, height, textAttrs, conf);
    _setTextAttrs(text, textAttrs);
  }

  function _setTextAttrs(toText, fromTextAttrsDict) {
    for (const key in fromTextAttrsDict) {
      if (fromTextAttrsDict.hasOwnProperty(key)) { // eslint-disable-line
        toText.attr(key, fromTextAttrsDict[key]);
      }
    }
  }

  return function (conf) {
    return conf.textPlacement === 'fo' ? byFo : conf.textPlacement === 'old' ? byText : byTspan;
  };
})();

export default {
  drawRect,
  drawText,
  drawLabel,
  drawActor,
  anchorElement,
  drawActivation,
  drawLoop,
  drawBackgroundRect,
  insertArrowHead,
  insertArrowFilledHead,
  insertSequenceNumber,
  insertArrowCrossHead,
  getTextObj,
  getNoteRect,
};
