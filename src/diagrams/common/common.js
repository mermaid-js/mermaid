export const getRows = s => {
  if (!s) return 1;
  let str = breakToPlaceholder(s);
  str = str.replace(/\\n/g, '#br#');
  return str.split('#br#');
};

export const sanitizeText = (text, config) => {
  let txt = text;
  let htmlLabels = true;
  if (
    config.flowchart &&
    (config.flowchart.htmlLabels === false || config.flowchart.htmlLabels === 'false')
  )
    htmlLabels = false;

  if (config.securityLevel !== 'loose' && htmlLabels) {
    // eslint-disable-line
    txt = breakToPlaceholder(txt);
    txt = txt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    txt = txt.replace(/=/g, '&equals;');
    txt = placeholderToBreak(txt);
  }

  return txt;
};

export const lineBreakRegex = /<br\s*\/?>/gi;

export const hasBreaks = text => {
  return /<br\s*[/]?>/gi.test(text);
};

export const splitBreaks = text => {
  return text.split(/<br\s*[/]?>/gi);
};

const breakToPlaceholder = s => {
  return s.replace(lineBreakRegex, '#br#');
};

const placeholderToBreak = s => {
  return s.replace(/#br#/g, '<br/>');
};

export default {
  getRows,
  sanitizeText,
  hasBreaks,
  splitBreaks,
  lineBreakRegex
};
