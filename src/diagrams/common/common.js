import DOMPurify from 'dompurify';

export const getRows = (s) => {
  if (!s) return 1;
  let str = breakToPlaceholder(s);
  str = str.replace(/\\n/g, '#br#');
  return str.split('#br#');
};

export const removeScript = (txt) => {
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

  rs = rs.replace(/javascript:/g, '#');
  rs = rs.replace(/onerror=/g, 'onerror:');
  rs = rs.replace(/<iframe/g, '');

  return rs;
};

export const sanitizeText = (text) => {
  const txt = DOMPurify.sanitize(text);
  return txt;
};

export const lineBreakRegex = /<br\s*\/?>/gi;

export const hasBreaks = (text) => {
  return /<br\s*[/]?>/gi.test(text);
};

export const splitBreaks = (text) => {
  return text.split(/<br\s*[/]?>/gi);
};

const breakToPlaceholder = (s) => {
  return s.replace(lineBreakRegex, '#br#');
};

const getUrl = (useAbsolute) => {
  let url = '';
  if (useAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  return url;
};

export const evaluate = (val) => (val === 'false' || val === false ? false : true);

export default {
  getRows,
  sanitizeText,
  hasBreaks,
  splitBreaks,
  lineBreakRegex,
  removeScript,
  getUrl,
  evaluate,
};
