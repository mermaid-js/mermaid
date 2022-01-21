import common from '../common/common';
import { addFunction } from '../../interactionDb';
import { sanitizeUrl } from '@braintree/sanitize-url';

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

// const sanitizeUrl = function (s) {
//   return s
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/javascript:/g, '');
// };

const addPopupInteraction = (id, actorCnt) => {
  addFunction(() => {
    const arr = document.querySelectorAll(id);
    // This will be the case when running in sandboxed mode
    if (arr.length === 0) return;
    arr[0].addEventListener('mouseover', function () {
      popupMenuUpFunc('actor' + actorCnt + '_popup');
    });
    arr[0].addEventListener('mouseout', function () {
      popupMenuDownFunc('actor' + actorCnt + '_popup');
    });
  });
};
export const drawPopup = function (elem, actor, minMenuWidth, textAttrs, forceMenus) {
  if (actor.links === undefined || actor.links === null || Object.keys(actor.links).length === 0) {
    return { height: 0, width: 0 };
  }

  const links = actor.links;
  const actorCnt = actor.actorCnt;
  const rectData = actor.rectData;

  var displayValue = 'none';
  if (forceMenus) {
    displayValue = 'block !important';
  }

  const g = elem.append('g');
  g.attr('id', 'actor' + actorCnt + '_popup');
  g.attr('class', 'actorPopupMenu');
  g.attr('display', displayValue);
  addPopupInteraction('#actor' + actorCnt + '_popup', actorCnt);
  var actorClass = '';
  if (typeof rectData.class !== 'undefined') {
    actorClass = ' ' + rectData.class;
  }

  let menuWidth = rectData.width > minMenuWidth ? rectData.width : minMenuWidth;

  const rectElem = g.append('rect');
  rectElem.attr('class', 'actorPopupMenuPanel' + actorClass);
  rectElem.attr('x', rectData.x);
  rectElem.attr('y', rectData.height);
  rectElem.attr('fill', rectData.fill);
  rectElem.attr('stroke', rectData.stroke);
  rectElem.attr('width', menuWidth);
  rectElem.attr('height', rectData.height);
  rectElem.attr('rx', rectData.rx);
  rectElem.attr('ry', rectData.ry);
  if (links != null) {
    var linkY = 20;
    for (let key in links) {
      var linkElem = g.append('a');
      var sanitizedLink = sanitizeUrl(links[key]);
      linkElem.attr('xlink:href', sanitizedLink);
      linkElem.attr('target', '_blank');

      _drawMenuItemTextCandidateFunc(textAttrs)(
        key,
        linkElem,
        rectData.x + 10,
        rectData.height + linkY,
        menuWidth,
        20,
        { class: 'actor' },
        textAttrs
      );

      linkY += 30;
    }
  }

  rectElem.attr('height', linkY);

  return { height: rectData.height + linkY, width: menuWidth };
};

export const drawImage = function (elem, x, y, link) {
  const imageElem = elem.append('image');
  imageElem.attr('x', x);
  imageElem.attr('y', y);
  var sanitizedLink = sanitizeUrl(link);
  imageElem.attr('xlink:href', sanitizedLink);
};

export const drawEmbeddedImage = function (elem, x, y, link) {
  const imageElem = elem.append('use');
  imageElem.attr('x', x);
  imageElem.attr('y', y);
  var sanitizedLink = sanitizeUrl(link);
  imageElem.attr('xlink:href', '#' + sanitizedLink);
};

export const popupMenu = function (popid) {
  return (
    "var pu = document.getElementById('" +
    popid +
    "'); if (pu != null) { pu.style.display = 'block'; }"
  );
};

export const popdownMenu = function (popid) {
  return (
    "var pu = document.getElementById('" +
    popid +
    "'); if (pu != null) { pu.style.display = 'none'; }"
  );
};

const popupMenuUpFunc = function (popupId) {
  var pu = document.getElementById(popupId);
  if (pu != null) {
    pu.style.display = 'block';
  }
};

const popupMenuDownFunc = function (popupId) {
  var pu = document.getElementById(popupId);
  if (pu != null) {
    pu.style.display = 'none';
  }
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
  /**
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} cut
   * @returns {any}
   */
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

export const fixLifeLineHeights = (diagram, bounds) => {
  if (!diagram.selectAll) return;
  diagram
    .selectAll('.actor-line')
    .attr('class', '200')
    .attr('y2', bounds - 55);
};

/**
 * Draws an actor in the diagram with the attached line
 *
 * @param {any} elem - The diagram we'll draw to.
 * @param {any} actor - The actor to draw.
 * @param {any} conf - DrawText implementation discriminator object
 */
const drawActorTypeParticipant = function (elem, actor, conf) {
  const center = actor.x + actor.width / 2;

  const boxpluslineGroup = elem.append('g');
  var g = boxpluslineGroup;

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

    g = boxpluslineGroup.append('g');
    actor.actorCnt = actorCnt;

    if (actor.links != null) {
      g.attr('id', 'root-' + actorCnt);
      addPopupInteraction('#root-' + actorCnt, actorCnt);
    }
  }

  const rect = getNoteRect();
  var cssclass = 'actor';
  if (actor.properties != null && actor.properties['class']) {
    cssclass = actor.properties['class'];
  } else {
    rect.fill = '#eaeaea';
  }
  rect.x = actor.x;
  rect.y = actor.y;
  rect.width = actor.width;
  rect.height = actor.height;
  rect.class = cssclass;
  rect.rx = 3;
  rect.ry = 3;
  const rectElem = drawRect(g, rect);
  actor.rectData = rect;

  if (actor.properties != null && actor.properties['icon']) {
    const iconSrc = actor.properties['icon'].trim();
    if (iconSrc.charAt(0) === '@') {
      drawEmbeddedImage(g, rect.x + rect.width - 20, rect.y + 10, iconSrc.substr(1));
    } else {
      drawImage(g, rect.x + rect.width - 20, rect.y + 10, iconSrc);
    }
  }

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

  let height = actor.height;
  if (rectElem.node) {
    const bounds = rectElem.node().getBBox();
    actor.height = bounds.height;
    height = bounds.height;
  }

  return height;
};

const drawActorTypeActor = function (elem, actor, conf) {
  const center = actor.x + actor.width / 2;

  if (actor.y === 0) {
    actorCnt++;
    elem
      .append('line')
      .attr('id', 'actor' + actorCnt)
      .attr('x1', center)
      .attr('y1', 80)
      .attr('x2', center)
      .attr('y2', 2000)
      .attr('class', 'actor-line')
      .attr('stroke-width', '0.5px')
      .attr('stroke', '#999');
  }
  const actElem = elem.append('g');
  actElem.attr('class', 'actor-man');

  const rect = getNoteRect();
  rect.x = actor.x;
  rect.y = actor.y;
  rect.fill = '#eaeaea';
  rect.width = actor.width;
  rect.height = actor.height;
  rect.class = 'actor';
  rect.rx = 3;
  rect.ry = 3;
  // drawRect(actElem, rect);

  actElem
    .append('line')
    .attr('id', 'actor-man-torso' + actorCnt)
    .attr('x1', center)
    .attr('y1', actor.y + 25)
    .attr('x2', center)
    .attr('y2', actor.y + 45);

  actElem
    .append('line')
    .attr('id', 'actor-man-arms' + actorCnt)
    .attr('x1', center - 18)
    .attr('y1', actor.y + 33)
    .attr('x2', center + 18)
    .attr('y2', actor.y + 33);
  actElem
    .append('line')
    .attr('x1', center - 18)
    .attr('y1', actor.y + 60)
    .attr('x2', center)
    .attr('y2', actor.y + 45);
  actElem
    .append('line')
    .attr('x1', center)
    .attr('y1', actor.y + 45)
    .attr('x2', center + 16)
    .attr('y2', actor.y + 60);

  const circle = actElem.append('circle');
  circle.attr('cx', actor.x + actor.width / 2);
  circle.attr('cy', actor.y + 10);
  circle.attr('r', 15);
  circle.attr('width', actor.width);
  circle.attr('height', actor.height);

  const bounds = actElem.node().getBBox();
  actor.height = bounds.height;

  _drawTextCandidateFunc(conf)(
    actor.description,
    actElem,
    rect.x,
    rect.y + 35,
    rect.width,
    rect.height,
    { class: 'actor' },
    conf
  );

  return actor.height;
};

export const drawActor = function (elem, actor, conf) {
  switch (actor.type) {
    case 'actor':
      return drawActorTypeActor(elem, actor, conf);
    case 'participant':
      return drawActorTypeParticipant(elem, actor, conf);
  }
};

export const anchorElement = function (elem) {
  return elem.append('g');
};
/**
 * Draws an activation in the diagram
 *
 * @param {any} elem - Element to append activation rect.
 * @param {any} bounds - Activation box bounds.
 * @param {any} verticalPos - Precise y cooridnate of bottom activation box edge.
 * @param {any} conf - Sequence diagram config object.
 * @param {any} actorActivations - Number of activations on the actor.
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
 *
 * @param {any} elem - Elemenet to append the loop to.
 * @param {any} loopModel - LoopModel of the given loop.
 * @param {any} labelText - Text within the loop.
 * @param {any} conf - Diagrom configuration
 * @returns {any}
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
 *
 * @param {any} elem Diagram (reference for bounds)
 * @param {any} bounds Shape of the rectangle
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

export const insertDatabaseIcon = function (elem) {
  elem
    .append('defs')
    .append('symbol')
    .attr('id', 'database')
    .attr('fill-rule', 'evenodd')
    .attr('clip-rule', 'evenodd')
    .append('path')
    .attr('transform', 'scale(.5)')
    .attr(
      'd',
      'M12.258.001l.256.004.255.005.253.008.251.01.249.012.247.015.246.016.242.019.241.02.239.023.236.024.233.027.231.028.229.031.225.032.223.034.22.036.217.038.214.04.211.041.208.043.205.045.201.046.198.048.194.05.191.051.187.053.183.054.18.056.175.057.172.059.168.06.163.061.16.063.155.064.15.066.074.033.073.033.071.034.07.034.069.035.068.035.067.035.066.035.064.036.064.036.062.036.06.036.06.037.058.037.058.037.055.038.055.038.053.038.052.038.051.039.05.039.048.039.047.039.045.04.044.04.043.04.041.04.04.041.039.041.037.041.036.041.034.041.033.042.032.042.03.042.029.042.027.042.026.043.024.043.023.043.021.043.02.043.018.044.017.043.015.044.013.044.012.044.011.045.009.044.007.045.006.045.004.045.002.045.001.045v17l-.001.045-.002.045-.004.045-.006.045-.007.045-.009.044-.011.045-.012.044-.013.044-.015.044-.017.043-.018.044-.02.043-.021.043-.023.043-.024.043-.026.043-.027.042-.029.042-.03.042-.032.042-.033.042-.034.041-.036.041-.037.041-.039.041-.04.041-.041.04-.043.04-.044.04-.045.04-.047.039-.048.039-.05.039-.051.039-.052.038-.053.038-.055.038-.055.038-.058.037-.058.037-.06.037-.06.036-.062.036-.064.036-.064.036-.066.035-.067.035-.068.035-.069.035-.07.034-.071.034-.073.033-.074.033-.15.066-.155.064-.16.063-.163.061-.168.06-.172.059-.175.057-.18.056-.183.054-.187.053-.191.051-.194.05-.198.048-.201.046-.205.045-.208.043-.211.041-.214.04-.217.038-.22.036-.223.034-.225.032-.229.031-.231.028-.233.027-.236.024-.239.023-.241.02-.242.019-.246.016-.247.015-.249.012-.251.01-.253.008-.255.005-.256.004-.258.001-.258-.001-.256-.004-.255-.005-.253-.008-.251-.01-.249-.012-.247-.015-.245-.016-.243-.019-.241-.02-.238-.023-.236-.024-.234-.027-.231-.028-.228-.031-.226-.032-.223-.034-.22-.036-.217-.038-.214-.04-.211-.041-.208-.043-.204-.045-.201-.046-.198-.048-.195-.05-.19-.051-.187-.053-.184-.054-.179-.056-.176-.057-.172-.059-.167-.06-.164-.061-.159-.063-.155-.064-.151-.066-.074-.033-.072-.033-.072-.034-.07-.034-.069-.035-.068-.035-.067-.035-.066-.035-.064-.036-.063-.036-.062-.036-.061-.036-.06-.037-.058-.037-.057-.037-.056-.038-.055-.038-.053-.038-.052-.038-.051-.039-.049-.039-.049-.039-.046-.039-.046-.04-.044-.04-.043-.04-.041-.04-.04-.041-.039-.041-.037-.041-.036-.041-.034-.041-.033-.042-.032-.042-.03-.042-.029-.042-.027-.042-.026-.043-.024-.043-.023-.043-.021-.043-.02-.043-.018-.044-.017-.043-.015-.044-.013-.044-.012-.044-.011-.045-.009-.044-.007-.045-.006-.045-.004-.045-.002-.045-.001-.045v-17l.001-.045.002-.045.004-.045.006-.045.007-.045.009-.044.011-.045.012-.044.013-.044.015-.044.017-.043.018-.044.02-.043.021-.043.023-.043.024-.043.026-.043.027-.042.029-.042.03-.042.032-.042.033-.042.034-.041.036-.041.037-.041.039-.041.04-.041.041-.04.043-.04.044-.04.046-.04.046-.039.049-.039.049-.039.051-.039.052-.038.053-.038.055-.038.056-.038.057-.037.058-.037.06-.037.061-.036.062-.036.063-.036.064-.036.066-.035.067-.035.068-.035.069-.035.07-.034.072-.034.072-.033.074-.033.151-.066.155-.064.159-.063.164-.061.167-.06.172-.059.176-.057.179-.056.184-.054.187-.053.19-.051.195-.05.198-.048.201-.046.204-.045.208-.043.211-.041.214-.04.217-.038.22-.036.223-.034.226-.032.228-.031.231-.028.234-.027.236-.024.238-.023.241-.02.243-.019.245-.016.247-.015.249-.012.251-.01.253-.008.255-.005.256-.004.258-.001.258.001zm-9.258 20.499v.01l.001.021.003.021.004.022.005.021.006.022.007.022.009.023.01.022.011.023.012.023.013.023.015.023.016.024.017.023.018.024.019.024.021.024.022.025.023.024.024.025.052.049.056.05.061.051.066.051.07.051.075.051.079.052.084.052.088.052.092.052.097.052.102.051.105.052.11.052.114.051.119.051.123.051.127.05.131.05.135.05.139.048.144.049.147.047.152.047.155.047.16.045.163.045.167.043.171.043.176.041.178.041.183.039.187.039.19.037.194.035.197.035.202.033.204.031.209.03.212.029.216.027.219.025.222.024.226.021.23.02.233.018.236.016.24.015.243.012.246.01.249.008.253.005.256.004.259.001.26-.001.257-.004.254-.005.25-.008.247-.011.244-.012.241-.014.237-.016.233-.018.231-.021.226-.021.224-.024.22-.026.216-.027.212-.028.21-.031.205-.031.202-.034.198-.034.194-.036.191-.037.187-.039.183-.04.179-.04.175-.042.172-.043.168-.044.163-.045.16-.046.155-.046.152-.047.148-.048.143-.049.139-.049.136-.05.131-.05.126-.05.123-.051.118-.052.114-.051.11-.052.106-.052.101-.052.096-.052.092-.052.088-.053.083-.051.079-.052.074-.052.07-.051.065-.051.06-.051.056-.05.051-.05.023-.024.023-.025.021-.024.02-.024.019-.024.018-.024.017-.024.015-.023.014-.024.013-.023.012-.023.01-.023.01-.022.008-.022.006-.022.006-.022.004-.022.004-.021.001-.021.001-.021v-4.127l-.077.055-.08.053-.083.054-.085.053-.087.052-.09.052-.093.051-.095.05-.097.05-.1.049-.102.049-.105.048-.106.047-.109.047-.111.046-.114.045-.115.045-.118.044-.12.043-.122.042-.124.042-.126.041-.128.04-.13.04-.132.038-.134.038-.135.037-.138.037-.139.035-.142.035-.143.034-.144.033-.147.032-.148.031-.15.03-.151.03-.153.029-.154.027-.156.027-.158.026-.159.025-.161.024-.162.023-.163.022-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.011-.178.01-.179.008-.179.008-.181.006-.182.005-.182.004-.184.003-.184.002h-.37l-.184-.002-.184-.003-.182-.004-.182-.005-.181-.006-.179-.008-.179-.008-.178-.01-.176-.011-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.022-.162-.023-.161-.024-.159-.025-.157-.026-.156-.027-.155-.027-.153-.029-.151-.03-.15-.03-.148-.031-.146-.032-.145-.033-.143-.034-.141-.035-.14-.035-.137-.037-.136-.037-.134-.038-.132-.038-.13-.04-.128-.04-.126-.041-.124-.042-.122-.042-.12-.044-.117-.043-.116-.045-.113-.045-.112-.046-.109-.047-.106-.047-.105-.048-.102-.049-.1-.049-.097-.05-.095-.05-.093-.052-.09-.051-.087-.052-.085-.053-.083-.054-.08-.054-.077-.054v4.127zm0-5.654v.011l.001.021.003.021.004.021.005.022.006.022.007.022.009.022.01.022.011.023.012.023.013.023.015.024.016.023.017.024.018.024.019.024.021.024.022.024.023.025.024.024.052.05.056.05.061.05.066.051.07.051.075.052.079.051.084.052.088.052.092.052.097.052.102.052.105.052.11.051.114.051.119.052.123.05.127.051.131.05.135.049.139.049.144.048.147.048.152.047.155.046.16.045.163.045.167.044.171.042.176.042.178.04.183.04.187.038.19.037.194.036.197.034.202.033.204.032.209.03.212.028.216.027.219.025.222.024.226.022.23.02.233.018.236.016.24.014.243.012.246.01.249.008.253.006.256.003.259.001.26-.001.257-.003.254-.006.25-.008.247-.01.244-.012.241-.015.237-.016.233-.018.231-.02.226-.022.224-.024.22-.025.216-.027.212-.029.21-.03.205-.032.202-.033.198-.035.194-.036.191-.037.187-.039.183-.039.179-.041.175-.042.172-.043.168-.044.163-.045.16-.045.155-.047.152-.047.148-.048.143-.048.139-.05.136-.049.131-.05.126-.051.123-.051.118-.051.114-.052.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.051.07-.052.065-.051.06-.05.056-.051.051-.049.023-.025.023-.024.021-.025.02-.024.019-.024.018-.024.017-.024.015-.023.014-.023.013-.024.012-.022.01-.023.01-.023.008-.022.006-.022.006-.022.004-.021.004-.022.001-.021.001-.021v-4.139l-.077.054-.08.054-.083.054-.085.052-.087.053-.09.051-.093.051-.095.051-.097.05-.1.049-.102.049-.105.048-.106.047-.109.047-.111.046-.114.045-.115.044-.118.044-.12.044-.122.042-.124.042-.126.041-.128.04-.13.039-.132.039-.134.038-.135.037-.138.036-.139.036-.142.035-.143.033-.144.033-.147.033-.148.031-.15.03-.151.03-.153.028-.154.028-.156.027-.158.026-.159.025-.161.024-.162.023-.163.022-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.011-.178.009-.179.009-.179.007-.181.007-.182.005-.182.004-.184.003-.184.002h-.37l-.184-.002-.184-.003-.182-.004-.182-.005-.181-.007-.179-.007-.179-.009-.178-.009-.176-.011-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.022-.162-.023-.161-.024-.159-.025-.157-.026-.156-.027-.155-.028-.153-.028-.151-.03-.15-.03-.148-.031-.146-.033-.145-.033-.143-.033-.141-.035-.14-.036-.137-.036-.136-.037-.134-.038-.132-.039-.13-.039-.128-.04-.126-.041-.124-.042-.122-.043-.12-.043-.117-.044-.116-.044-.113-.046-.112-.046-.109-.046-.106-.047-.105-.048-.102-.049-.1-.049-.097-.05-.095-.051-.093-.051-.09-.051-.087-.053-.085-.052-.083-.054-.08-.054-.077-.054v4.139zm0-5.666v.011l.001.02.003.022.004.021.005.022.006.021.007.022.009.023.01.022.011.023.012.023.013.023.015.023.016.024.017.024.018.023.019.024.021.025.022.024.023.024.024.025.052.05.056.05.061.05.066.051.07.051.075.052.079.051.084.052.088.052.092.052.097.052.102.052.105.051.11.052.114.051.119.051.123.051.127.05.131.05.135.05.139.049.144.048.147.048.152.047.155.046.16.045.163.045.167.043.171.043.176.042.178.04.183.04.187.038.19.037.194.036.197.034.202.033.204.032.209.03.212.028.216.027.219.025.222.024.226.021.23.02.233.018.236.017.24.014.243.012.246.01.249.008.253.006.256.003.259.001.26-.001.257-.003.254-.006.25-.008.247-.01.244-.013.241-.014.237-.016.233-.018.231-.02.226-.022.224-.024.22-.025.216-.027.212-.029.21-.03.205-.032.202-.033.198-.035.194-.036.191-.037.187-.039.183-.039.179-.041.175-.042.172-.043.168-.044.163-.045.16-.045.155-.047.152-.047.148-.048.143-.049.139-.049.136-.049.131-.051.126-.05.123-.051.118-.052.114-.051.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.052.07-.051.065-.051.06-.051.056-.05.051-.049.023-.025.023-.025.021-.024.02-.024.019-.024.018-.024.017-.024.015-.023.014-.024.013-.023.012-.023.01-.022.01-.023.008-.022.006-.022.006-.022.004-.022.004-.021.001-.021.001-.021v-4.153l-.077.054-.08.054-.083.053-.085.053-.087.053-.09.051-.093.051-.095.051-.097.05-.1.049-.102.048-.105.048-.106.048-.109.046-.111.046-.114.046-.115.044-.118.044-.12.043-.122.043-.124.042-.126.041-.128.04-.13.039-.132.039-.134.038-.135.037-.138.036-.139.036-.142.034-.143.034-.144.033-.147.032-.148.032-.15.03-.151.03-.153.028-.154.028-.156.027-.158.026-.159.024-.161.024-.162.023-.163.023-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.01-.178.01-.179.009-.179.007-.181.006-.182.006-.182.004-.184.003-.184.001-.185.001-.185-.001-.184-.001-.184-.003-.182-.004-.182-.006-.181-.006-.179-.007-.179-.009-.178-.01-.176-.01-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.023-.162-.023-.161-.024-.159-.024-.157-.026-.156-.027-.155-.028-.153-.028-.151-.03-.15-.03-.148-.032-.146-.032-.145-.033-.143-.034-.141-.034-.14-.036-.137-.036-.136-.037-.134-.038-.132-.039-.13-.039-.128-.041-.126-.041-.124-.041-.122-.043-.12-.043-.117-.044-.116-.044-.113-.046-.112-.046-.109-.046-.106-.048-.105-.048-.102-.048-.1-.05-.097-.049-.095-.051-.093-.051-.09-.052-.087-.052-.085-.053-.083-.053-.08-.054-.077-.054v4.153zm8.74-8.179l-.257.004-.254.005-.25.008-.247.011-.244.012-.241.014-.237.016-.233.018-.231.021-.226.022-.224.023-.22.026-.216.027-.212.028-.21.031-.205.032-.202.033-.198.034-.194.036-.191.038-.187.038-.183.04-.179.041-.175.042-.172.043-.168.043-.163.045-.16.046-.155.046-.152.048-.148.048-.143.048-.139.049-.136.05-.131.05-.126.051-.123.051-.118.051-.114.052-.11.052-.106.052-.101.052-.096.052-.092.052-.088.052-.083.052-.079.052-.074.051-.07.052-.065.051-.06.05-.056.05-.051.05-.023.025-.023.024-.021.024-.02.025-.019.024-.018.024-.017.023-.015.024-.014.023-.013.023-.012.023-.01.023-.01.022-.008.022-.006.023-.006.021-.004.022-.004.021-.001.021-.001.021.001.021.001.021.004.021.004.022.006.021.006.023.008.022.01.022.01.023.012.023.013.023.014.023.015.024.017.023.018.024.019.024.02.025.021.024.023.024.023.025.051.05.056.05.06.05.065.051.07.052.074.051.079.052.083.052.088.052.092.052.096.052.101.052.106.052.11.052.114.052.118.051.123.051.126.051.131.05.136.05.139.049.143.048.148.048.152.048.155.046.16.046.163.045.168.043.172.043.175.042.179.041.183.04.187.038.191.038.194.036.198.034.202.033.205.032.21.031.212.028.216.027.22.026.224.023.226.022.231.021.233.018.237.016.241.014.244.012.247.011.25.008.254.005.257.004.26.001.26-.001.257-.004.254-.005.25-.008.247-.011.244-.012.241-.014.237-.016.233-.018.231-.021.226-.022.224-.023.22-.026.216-.027.212-.028.21-.031.205-.032.202-.033.198-.034.194-.036.191-.038.187-.038.183-.04.179-.041.175-.042.172-.043.168-.043.163-.045.16-.046.155-.046.152-.048.148-.048.143-.048.139-.049.136-.05.131-.05.126-.051.123-.051.118-.051.114-.052.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.051.07-.052.065-.051.06-.05.056-.05.051-.05.023-.025.023-.024.021-.024.02-.025.019-.024.018-.024.017-.023.015-.024.014-.023.013-.023.012-.023.01-.023.01-.022.008-.022.006-.023.006-.021.004-.022.004-.021.001-.021.001-.021-.001-.021-.001-.021-.004-.021-.004-.022-.006-.021-.006-.023-.008-.022-.01-.022-.01-.023-.012-.023-.013-.023-.014-.023-.015-.024-.017-.023-.018-.024-.019-.024-.02-.025-.021-.024-.023-.024-.023-.025-.051-.05-.056-.05-.06-.05-.065-.051-.07-.052-.074-.051-.079-.052-.083-.052-.088-.052-.092-.052-.096-.052-.101-.052-.106-.052-.11-.052-.114-.052-.118-.051-.123-.051-.126-.051-.131-.05-.136-.05-.139-.049-.143-.048-.148-.048-.152-.048-.155-.046-.16-.046-.163-.045-.168-.043-.172-.043-.175-.042-.179-.041-.183-.04-.187-.038-.191-.038-.194-.036-.198-.034-.202-.033-.205-.032-.21-.031-.212-.028-.216-.027-.22-.026-.224-.023-.226-.022-.231-.021-.233-.018-.237-.016-.241-.014-.244-.012-.247-.011-.25-.008-.254-.005-.257-.004-.26-.001-.26.001z'
    );
};

export const insertComputerIcon = function (elem) {
  elem
    .append('defs')
    .append('symbol')
    .attr('id', 'computer')
    .attr('width', '24')
    .attr('height', '24')
    .append('path')
    .attr('transform', 'scale(.5)')
    .attr(
      'd',
      'M2 2v13h20v-13h-20zm18 11h-16v-9h16v9zm-10.228 6l.466-1h3.524l.467 1h-4.457zm14.228 3h-24l2-6h2.104l-1.33 4h18.45l-1.297-4h2.073l2 6zm-5-10h-14v-7h14v7z'
    );
};

export const insertClockIcon = function (elem) {
  elem
    .append('defs')
    .append('symbol')
    .attr('id', 'clock')
    .attr('width', '24')
    .attr('height', '24')
    .append('path')
    .attr('transform', 'scale(.5)')
    .attr(
      'd',
      'M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.848 12.459c.202.038.202.333.001.372-1.907.361-6.045 1.111-6.547 1.111-.719 0-1.301-.582-1.301-1.301 0-.512.77-5.447 1.125-7.445.034-.192.312-.181.343.014l.985 6.238 5.394 1.011z'
    );
};

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 *
 * @param elem
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
 *
 * @param {any} elem
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
 *
 * @param {any} elem
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
 *
 * @param {any} elem
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
  /**
   * @param {any} content
   * @param {any} g
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} textAttrs
   */
  function byText(content, g, x, y, width, height, textAttrs) {
    const text = g
      .append('text')
      .attr('x', x + width / 2)
      .attr('y', y + height / 2 + 5)
      .style('text-anchor', 'middle')
      .text(content);
    _setTextAttrs(text, textAttrs);
  }

  /**
   * @param {any} content
   * @param {any} g
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} textAttrs
   * @param {any} conf
   */
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

  /**
   * @param {any} content
   * @param {any} g
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} textAttrs
   * @param {any} conf
   */
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

  /**
   * @param {any} toText
   * @param {any} fromTextAttrsDict
   */
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

const _drawMenuItemTextCandidateFunc = (function () {
  /**
   * @param {any} content
   * @param {any} g
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} textAttrs
   */
  function byText(content, g, x, y, width, height, textAttrs) {
    const text = g
      .append('text')
      .attr('x', x)
      .attr('y', y)
      .style('text-anchor', 'start')
      .text(content);
    _setTextAttrs(text, textAttrs);
  }

  /**
   * @param {any} content
   * @param {any} g
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} textAttrs
   * @param {any} conf
   */
  function byTspan(content, g, x, y, width, height, textAttrs, conf) {
    const { actorFontSize, actorFontFamily, actorFontWeight } = conf;

    const lines = content.split(common.lineBreakRegex);
    for (let i = 0; i < lines.length; i++) {
      const dy = i * actorFontSize - (actorFontSize * (lines.length - 1)) / 2;
      const text = g
        .append('text')
        .attr('x', x)
        .attr('y', y)
        .style('text-anchor', 'start')
        .style('font-size', actorFontSize)
        .style('font-weight', actorFontWeight)
        .style('font-family', actorFontFamily);
      text.append('tspan').attr('x', x).attr('dy', dy).text(lines[i]);

      text
        .attr('y', y + height / 2.0)
        .attr('dominant-baseline', 'central')
        .attr('alignment-baseline', 'central');

      _setTextAttrs(text, textAttrs);
    }
  }

  /**
   * @param {any} content
   * @param {any} g
   * @param {any} x
   * @param {any} y
   * @param {any} width
   * @param {any} height
   * @param {any} textAttrs
   * @param {any} conf
   */
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

  /**
   * @param {any} toText
   * @param {any} fromTextAttrsDict
   */
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
  drawPopup,
  drawImage,
  drawEmbeddedImage,
  anchorElement,
  drawActivation,
  drawLoop,
  drawBackgroundRect,
  insertArrowHead,
  insertArrowFilledHead,
  insertSequenceNumber,
  insertArrowCrossHead,
  insertDatabaseIcon,
  insertComputerIcon,
  insertClockIcon,
  getTextObj,
  getNoteRect,
  popupMenu,
  popdownMenu,
  fixLifeLineHeights,
  sanitizeUrl,
};
