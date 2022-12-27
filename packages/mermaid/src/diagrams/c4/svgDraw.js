import common from '../common/common';
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

  if (rectData.attrs !== 'undefined' && rectData.attrs !== null) {
    for (let attrKey in rectData.attrs) {
      rectElem.attr(attrKey, rectData.attrs[attrKey]);
    }
  }

  if (rectData.class !== 'undefined') {
    rectElem.attr('class', rectData.class);
  }

  return rectElem;
};

export const drawImage = function (elem, width, height, x, y, link) {
  const imageElem = elem.append('image');
  imageElem.attr('width', width);
  imageElem.attr('height', height);
  imageElem.attr('x', x);
  imageElem.attr('y', y);
  let sanitizedLink = link.startsWith('data:image/png;base64') ? link : sanitizeUrl(link);
  imageElem.attr('xlink:href', sanitizedLink);
};

export const drawRels = (elem, rels, conf) => {
  const relsElem = elem.append('g');
  let i = 0;
  for (let rel of rels) {
    let textColor = rel.textColor ? rel.textColor : '#444444';
    let strokeColor = rel.lineColor ? rel.lineColor : '#444444';
    let offsetX = rel.offsetX ? parseInt(rel.offsetX) : 0;
    let offsetY = rel.offsetY ? parseInt(rel.offsetY) : 0;

    let url = '';
    if (i === 0) {
      let line = relsElem.append('line');
      line.attr('x1', rel.startPoint.x);
      line.attr('y1', rel.startPoint.y);
      line.attr('x2', rel.endPoint.x);
      line.attr('y2', rel.endPoint.y);

      line.attr('stroke-width', '1');
      line.attr('stroke', strokeColor);
      line.style('fill', 'none');
      if (rel.type !== 'rel_b') {
        line.attr('marker-end', 'url(' + url + '#arrowhead)');
      }
      if (rel.type === 'birel' || rel.type === 'rel_b') {
        line.attr('marker-start', 'url(' + url + '#arrowend)');
      }
      i = -1;
    } else {
      let line = relsElem.append('path');
      line
        .attr('fill', 'none')
        .attr('stroke-width', '1')
        .attr('stroke', strokeColor)
        .attr(
          'd',
          'Mstartx,starty Qcontrolx,controly stopx,stopy '
            .replaceAll('startx', rel.startPoint.x)
            .replaceAll('starty', rel.startPoint.y)
            .replaceAll(
              'controlx',
              rel.startPoint.x +
                (rel.endPoint.x - rel.startPoint.x) / 2 -
                (rel.endPoint.x - rel.startPoint.x) / 4
            )
            .replaceAll('controly', rel.startPoint.y + (rel.endPoint.y - rel.startPoint.y) / 2)
            .replaceAll('stopx', rel.endPoint.x)
            .replaceAll('stopy', rel.endPoint.y)
        );
      if (rel.type !== 'rel_b') {
        line.attr('marker-end', 'url(' + url + '#arrowhead)');
      }
      if (rel.type === 'birel' || rel.type === 'rel_b') {
        line.attr('marker-start', 'url(' + url + '#arrowend)');
      }
    }

    let messageConf = conf.messageFont();
    _drawTextCandidateFunc(conf)(
      rel.label.text,
      relsElem,
      Math.min(rel.startPoint.x, rel.endPoint.x) +
        Math.abs(rel.endPoint.x - rel.startPoint.x) / 2 +
        offsetX,
      Math.min(rel.startPoint.y, rel.endPoint.y) +
        Math.abs(rel.endPoint.y - rel.startPoint.y) / 2 +
        offsetY,
      rel.label.width,
      rel.label.height,
      { fill: textColor },
      messageConf
    );

    if (rel.techn && rel.techn.text !== '') {
      messageConf = conf.messageFont();
      _drawTextCandidateFunc(conf)(
        '[' + rel.techn.text + ']',
        relsElem,
        Math.min(rel.startPoint.x, rel.endPoint.x) +
          Math.abs(rel.endPoint.x - rel.startPoint.x) / 2 +
          offsetX,
        Math.min(rel.startPoint.y, rel.endPoint.y) +
          Math.abs(rel.endPoint.y - rel.startPoint.y) / 2 +
          conf.messageFontSize +
          5 +
          offsetY,
        Math.max(rel.label.width, rel.techn.width),
        rel.techn.height,
        { fill: textColor, 'font-style': 'italic' },
        messageConf
      );
    }
  }
};

/**
 * Draws an boundary in the diagram
 *
 * @param {any} elem - The diagram we'll draw to.
 * @param {any} boundary - The boundary to draw.
 * @param {any} conf - DrawText implementation discriminator object
 */
const drawBoundary = function (elem, boundary, conf) {
  const boundaryElem = elem.append('g');

  let fillColor = boundary.bgColor ? boundary.bgColor : 'none';
  let strokeColor = boundary.borderColor ? boundary.borderColor : '#444444';
  let fontColor = boundary.fontColor ? boundary.fontColor : 'black';

  let attrsValue = { 'stroke-width': 1.0, 'stroke-dasharray': '7.0,7.0' };
  if (boundary.nodeType) {
    attrsValue = { 'stroke-width': 1.0 };
  }
  let rectData = {
    x: boundary.x,
    y: boundary.y,
    fill: fillColor,
    stroke: strokeColor,
    width: boundary.width,
    height: boundary.height,
    rx: 2.5,
    ry: 2.5,
    attrs: attrsValue,
  };

  drawRect(boundaryElem, rectData);

  // draw label
  let boundaryConf = conf.boundaryFont();
  boundaryConf.fontWeight = 'bold';
  boundaryConf.fontSize = boundaryConf.fontSize + 2;
  boundaryConf.fontColor = fontColor;
  _drawTextCandidateFunc(conf)(
    boundary.label.text,
    boundaryElem,
    boundary.x,
    boundary.y + boundary.label.Y,
    boundary.width,
    boundary.height,
    { fill: '#444444' },
    boundaryConf
  );

  // draw type
  if (boundary.type && boundary.type.text !== '') {
    boundaryConf = conf.boundaryFont();
    boundaryConf.fontColor = fontColor;
    _drawTextCandidateFunc(conf)(
      boundary.type.text,
      boundaryElem,
      boundary.x,
      boundary.y + boundary.type.Y,
      boundary.width,
      boundary.height,
      { fill: '#444444' },
      boundaryConf
    );
  }

  // draw descr
  if (boundary.descr && boundary.descr.text !== '') {
    boundaryConf = conf.boundaryFont();
    boundaryConf.fontSize = boundaryConf.fontSize - 2;
    boundaryConf.fontColor = fontColor;
    _drawTextCandidateFunc(conf)(
      boundary.descr.text,
      boundaryElem,
      boundary.x,
      boundary.y + boundary.descr.Y,
      boundary.width,
      boundary.height,
      { fill: '#444444' },
      boundaryConf
    );
  }
};

export const drawC4Shape = function (elem, c4Shape, conf) {
  let fillColor = c4Shape.bgColor ? c4Shape.bgColor : conf[c4Shape.typeC4Shape.text + '_bg_color'];
  let strokeColor = c4Shape.borderColor
    ? c4Shape.borderColor
    : conf[c4Shape.typeC4Shape.text + '_border_color'];
  let fontColor = c4Shape.fontColor ? c4Shape.fontColor : '#FFFFFF';

  let personImg =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAACD0lEQVR4Xu2YoU4EMRCGT+4j8Ai8AhaH4QHgAUjQuFMECUgMIUgwJAgMhgQsAYUiJCiQIBBY+EITsjfTdme6V24v4c8vyGbb+ZjOtN0bNcvjQXmkH83WvYBWto6PLm6v7p7uH1/w2fXD+PBycX1Pv2l3IdDm/vn7x+dXQiAubRzoURa7gRZWd0iGRIiJbOnhnfYBQZNJjNbuyY2eJG8fkDE3bbG4ep6MHUAsgYxmE3nVs6VsBWJSGccsOlFPmLIViMzLOB7pCVO2AtHJMohH7Fh6zqitQK7m0rJvAVYgGcEpe//PLdDz65sM4pF9N7ICcXDKIB5Nv6j7tD0NoSdM2QrU9Gg0ewE1LqBhHR3BBdvj2vapnidjHxD/q6vd7Pvhr31AwcY8eXMTXAKECZZJFXuEq27aLgQK5uLMohCenGGuGewOxSjBvYBqeG6B+Nqiblggdjnc+ZXDy+FNFpFzw76O3UBAROuXh6FoiAcf5g9eTvUgzy0nWg6I8cXHRUpg5bOVBCo+KDpFajOf23GgPme7RSQ+lacIENUgJ6gg1k6HjgOlqnLqip4tEuhv0hNEMXUD0clyXE3p6pZA0S2nnvTlXwLJEZWlb7cTQH1+USgTN4VhAenm/wea1OCAOmqo6fE1WCb9WSKBah+rbUWPWAmE2Rvk0ApiB45eOyNAzU8xcTvj8KvkKEoOaIYeHNA3ZuygAvFMUO0AAAAASUVORK5CYII=';
  switch (c4Shape.typeC4Shape.text) {
    case 'person':
      personImg =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAACD0lEQVR4Xu2YoU4EMRCGT+4j8Ai8AhaH4QHgAUjQuFMECUgMIUgwJAgMhgQsAYUiJCiQIBBY+EITsjfTdme6V24v4c8vyGbb+ZjOtN0bNcvjQXmkH83WvYBWto6PLm6v7p7uH1/w2fXD+PBycX1Pv2l3IdDm/vn7x+dXQiAubRzoURa7gRZWd0iGRIiJbOnhnfYBQZNJjNbuyY2eJG8fkDE3bbG4ep6MHUAsgYxmE3nVs6VsBWJSGccsOlFPmLIViMzLOB7pCVO2AtHJMohH7Fh6zqitQK7m0rJvAVYgGcEpe//PLdDz65sM4pF9N7ICcXDKIB5Nv6j7tD0NoSdM2QrU9Gg0ewE1LqBhHR3BBdvj2vapnidjHxD/q6vd7Pvhr31AwcY8eXMTXAKECZZJFXuEq27aLgQK5uLMohCenGGuGewOxSjBvYBqeG6B+Nqiblggdjnc+ZXDy+FNFpFzw76O3UBAROuXh6FoiAcf5g9eTvUgzy0nWg6I8cXHRUpg5bOVBCo+KDpFajOf23GgPme7RSQ+lacIENUgJ6gg1k6HjgOlqnLqip4tEuhv0hNEMXUD0clyXE3p6pZA0S2nnvTlXwLJEZWlb7cTQH1+USgTN4VhAenm/wea1OCAOmqo6fE1WCb9WSKBah+rbUWPWAmE2Rvk0ApiB45eOyNAzU8xcTvj8KvkKEoOaIYeHNA3ZuygAvFMUO0AAAAASUVORK5CYII=';
      break;
    case 'external_person':
      personImg =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAB6ElEQVR4Xu2YLY+EMBCG9+dWr0aj0Wg0Go1Go0+j8Xdv2uTCvv1gpt0ebHKPuhDaeW4605Z9mJvx4AdXUyTUdd08z+u6flmWZRnHsWkafk9DptAwDPu+f0eAYtu2PEaGWuj5fCIZrBAC2eLBAnRCsEkkxmeaJp7iDJ2QMDdHsLg8SxKFEJaAo8lAXnmuOFIhTMpxxKATebo4UiFknuNo4OniSIXQyRxEA3YsnjGCVEjVXD7yLUAqxBGUyPv/Y4W2beMgGuS7kVQIBycH0fD+oi5pezQETxdHKmQKGk1eQEYldK+jw5GxPfZ9z7Mk0Qnhf1W1m3w//EUn5BDmSZsbR44QQLBEqrBHqOrmSKaQAxdnLArCrxZcM7A7ZKs4ioRq8LFC+NpC3WCBJsvpVw5edm9iEXFuyNfxXAgSwfrFQ1c0iNda8AdejvUgnktOtJQQxmcfFzGglc5WVCj7oDgFqU18boeFSs52CUh8LE8BIVQDT1ABrB0HtgSEYlX5doJnCwv9TXocKCaKbnwhdDKPq4lf3SwU3HLq4V/+WYhHVMa/3b4IlfyikAduCkcBc7mQ3/z/Qq/cTuikhkzB12Ae/mcJC9U+Vo8Ej1gWAtgbeGgFsAMHr50BIWOLCbezvhpBFUdY6EJuJ/QDW0XoMX60zZ0AAAAASUVORK5CYII=';
      break;
  }

  const c4ShapeElem = elem.append('g');
  c4ShapeElem.attr('class', 'person-man');

  // <rect fill="#08427B" height="119.2188" rx="2.5" ry="2.5" style="stroke:#073B6F;stroke-width:0.5;" width="110" x="120" y="7"/>
  // draw rect of c4Shape
  const rect = getNoteRect();
  switch (c4Shape.typeC4Shape.text) {
    case 'person':
    case 'external_person':
    case 'system':
    case 'external_system':
    case 'container':
    case 'external_container':
    case 'component':
    case 'external_component':
      rect.x = c4Shape.x;
      rect.y = c4Shape.y;
      rect.fill = fillColor;
      rect.width = c4Shape.width;
      rect.height = c4Shape.height;
      rect.style = 'stroke:' + strokeColor + ';stroke-width:0.5;';
      rect.rx = 2.5;
      rect.ry = 2.5;
      drawRect(c4ShapeElem, rect);
      break;
    case 'system_db':
    case 'external_system_db':
    case 'container_db':
    case 'external_container_db':
    case 'component_db':
    case 'external_component_db':
      c4ShapeElem
        .append('path')
        .attr('fill', fillColor)
        .attr('stroke-width', '0.5')
        .attr('stroke', strokeColor)
        .attr(
          'd',
          'Mstartx,startyc0,-10 half,-10 half,-10c0,0 half,0 half,10l0,heightc0,10 -half,10 -half,10c0,0 -half,0 -half,-10l0,-height'
            .replaceAll('startx', c4Shape.x)
            .replaceAll('starty', c4Shape.y)
            .replaceAll('half', c4Shape.width / 2)
            .replaceAll('height', c4Shape.height)
        );
      c4ShapeElem
        .append('path')
        .attr('fill', 'none')
        .attr('stroke-width', '0.5')
        .attr('stroke', strokeColor)
        .attr(
          'd',
          'Mstartx,startyc0,10 half,10 half,10c0,0 half,0 half,-10'
            .replaceAll('startx', c4Shape.x)
            .replaceAll('starty', c4Shape.y)
            .replaceAll('half', c4Shape.width / 2)
        );
      break;
    case 'system_queue':
    case 'external_system_queue':
    case 'container_queue':
    case 'external_container_queue':
    case 'component_queue':
    case 'external_component_queue':
      c4ShapeElem
        .append('path')
        .attr('fill', fillColor)
        .attr('stroke-width', '0.5')
        .attr('stroke', strokeColor)
        .attr(
          'd',
          'Mstartx,startylwidth,0c5,0 5,half 5,halfc0,0 0,half -5,halfl-width,0c-5,0 -5,-half -5,-halfc0,0 0,-half 5,-half'
            .replaceAll('startx', c4Shape.x)
            .replaceAll('starty', c4Shape.y)
            .replaceAll('width', c4Shape.width)
            .replaceAll('half', c4Shape.height / 2)
        );
      c4ShapeElem
        .append('path')
        .attr('fill', 'none')
        .attr('stroke-width', '0.5')
        .attr('stroke', strokeColor)
        .attr(
          'd',
          'Mstartx,startyc-5,0 -5,half -5,halfc0,half 5,half 5,half'
            .replaceAll('startx', c4Shape.x + c4Shape.width)
            .replaceAll('starty', c4Shape.y)
            .replaceAll('half', c4Shape.height / 2)
        );
      break;
  }

  // draw type of c4Shape
  let c4ShapeFontConf = getC4ShapeFont(conf, c4Shape.typeC4Shape.text);
  c4ShapeElem
    .append('text')
    .attr('fill', fontColor)
    .attr('font-family', c4ShapeFontConf.fontFamily)
    .attr('font-size', c4ShapeFontConf.fontSize - 2)
    .attr('font-style', 'italic')
    .attr('lengthAdjust', 'spacing')
    .attr('textLength', c4Shape.typeC4Shape.width)
    .attr('x', c4Shape.x + c4Shape.width / 2 - c4Shape.typeC4Shape.width / 2)
    .attr('y', c4Shape.y + c4Shape.typeC4Shape.Y)
    .text('<<' + c4Shape.typeC4Shape.text + '>>');

  // draw image/sprite
  switch (c4Shape.typeC4Shape.text) {
    case 'person':
    case 'external_person':
      drawImage(
        c4ShapeElem,
        48,
        48,
        c4Shape.x + c4Shape.width / 2 - 24,
        c4Shape.y + c4Shape.image.Y,
        personImg
      );
      break;
  }

  // draw label
  let textFontConf = conf[c4Shape.typeC4Shape.text + 'Font']();
  textFontConf.fontWeight = 'bold';
  textFontConf.fontSize = textFontConf.fontSize + 2;
  textFontConf.fontColor = fontColor;
  _drawTextCandidateFunc(conf)(
    c4Shape.label.text,
    c4ShapeElem,
    c4Shape.x,
    c4Shape.y + c4Shape.label.Y,
    c4Shape.width,
    c4Shape.height,
    { fill: fontColor },
    textFontConf
  );

  // draw techn/type
  textFontConf = conf[c4Shape.typeC4Shape.text + 'Font']();
  textFontConf.fontColor = fontColor;

  if (c4Shape.techn && c4Shape.techn?.text !== '') {
    _drawTextCandidateFunc(conf)(
      c4Shape.techn.text,
      c4ShapeElem,
      c4Shape.x,
      c4Shape.y + c4Shape.techn.Y,
      c4Shape.width,
      c4Shape.height,
      { fill: fontColor, 'font-style': 'italic' },
      textFontConf
    );
  } else if (c4Shape.type && c4Shape.type.text !== '') {
    _drawTextCandidateFunc(conf)(
      c4Shape.type.text,
      c4ShapeElem,
      c4Shape.x,
      c4Shape.y + c4Shape.type.Y,
      c4Shape.width,
      c4Shape.height,
      { fill: fontColor, 'font-style': 'italic' },
      textFontConf
    );
  }

  // draw descr
  if (c4Shape.descr && c4Shape.descr.text !== '') {
    textFontConf = conf.personFont();
    textFontConf.fontColor = fontColor;
    _drawTextCandidateFunc(conf)(
      c4Shape.descr.text,
      c4ShapeElem,
      c4Shape.x,
      c4Shape.y + c4Shape.descr.Y,
      c4Shape.width,
      c4Shape.height,
      { fill: fontColor },
      textFontConf
    );
  }

  return c4Shape.height;
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
export const insertArrowEnd = function (elem) {
  elem
    .append('defs')
    .append('marker')
    .attr('id', 'arrowend')
    .attr('refX', 1)
    .attr('refY', 5)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 10 0 L 0 5 L 10 10 z'); // this is actual shape for arrowhead
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
export const insertDynamicNumber = function (elem) {
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

const getC4ShapeFont = (cnf, typeC4Shape) => {
  return {
    fontFamily: cnf[typeC4Shape + 'FontFamily'],
    fontSize: cnf[typeC4Shape + 'FontSize'],
    fontWeight: cnf[typeC4Shape + 'FontWeight'],
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
    const { fontSize, fontFamily, fontWeight } = conf;

    const lines = content.split(common.lineBreakRegex);
    for (let i = 0; i < lines.length; i++) {
      const dy = i * fontSize - (fontSize * (lines.length - 1)) / 2;
      const text = g
        .append('text')
        .attr('x', x + width / 2)
        .attr('y', y)
        .style('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', fontSize)
        .style('font-weight', fontWeight)
        .style('font-family', fontFamily);
      text
        .append('tspan')
        // .attr('x', x + width / 2)
        .attr('dy', dy)
        .text(lines[i])
        // .attr('y', y + height / 2)
        .attr('alignment-baseline', 'mathematical');

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
      if (fromTextAttrsDict.hasOwnProperty(key)) {
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
  drawBoundary,
  drawC4Shape,
  drawRels,
  drawImage,
  insertArrowHead,
  insertArrowEnd,
  insertArrowFilledHead,
  insertDynamicNumber,
  insertArrowCrossHead,
  insertDatabaseIcon,
  insertComputerIcon,
  insertClockIcon,
  getNoteRect,
  sanitizeUrl, // TODO why is this exported?
};
