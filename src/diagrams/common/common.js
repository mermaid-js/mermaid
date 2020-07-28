export const getRows = s => {
  if (!s) return 1;
  let str = breakToPlaceholder(s);
  str = str.replace(/\\n/g, '#br#');
  return str.split('#br#');
};

export const removeScript = txt => {
  var rs = '';
  var idx = 0;

  while (idx >= 0) {
    idx = txt.indexOf('<script');
    if (idx >= 0) {
      rs += txt.substr(0, idx);
      txt = txt.substr(idx + 1);

      idx = txt.indexOf('</script>');
      if (idx >= 0) {
        idx += 9;
        txt = txt.substr(idx);
      }
    } else {
      rs += txt;
      idx = -1;
      break;
    }
  }
  return rs;
};

export const sanitizeText = (text, config) => {
  let txt = text;
  let htmlLabels = true;
  if (
    config.flowchart &&
    (config.flowchart.htmlLabels === false || config.flowchart.htmlLabels === 'false')
  ) {
    htmlLabels = false;
  }

  if (htmlLabels) {
    const level = config.securityLevel;

    if (level === 'antiscript') {
      txt = removeScript(txt);
    } else if (level !== 'loose') {
      // eslint-disable-line
      txt = breakToPlaceholder(txt);
      txt = txt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      txt = txt.replace(/=/g, '&equals;');
      txt = placeholderToBreak(txt);
    }
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
  lineBreakRegex,
  removeScript
};
