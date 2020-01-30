export const addTspan = function(textEl, txt, isFirst, conf) {
  let member = parseMember(txt);

  const tSpan = textEl
    .append('tspan')
    .attr('x', conf.padding)
    .text(member.displayText);

  if (member.cssStyle !== '') {
    tSpan.attr('style', member.cssStyle);
  }

  if (!isFirst) {
    tSpan.attr('dy', conf.textHeight);
  }
};

export const buildFieldDisplay = function(parsedText) {
  let visibility = parsedText[1] ? parsedText[1].trim() : '';
  let fieldType = parsedText[2] ? parsedText[2].trim() : '';
  let genericType = parsedText[3] ? parseGenericTypes(parsedText[3]) : '';
  let fieldName = parsedText[4] ? parsedText[4].trim() : '';

  return {
    displayText: visibility + fieldType + genericType + ' ' + fieldName,
    cssStyle: ''
  };
};

export const buildMethodDisplay = function(parsedText) {
  let cssStyle = '';
  let displayText = parsedText;

  let visibility = parsedText[1] ? parsedText[1].trim() : '';
  let methodName = parsedText[2] ? parsedText[2].trim() : '';
  let parameters = parsedText[3] ? parseGenericTypes(parsedText[3]) : '';
  let classifier = parsedText[6] ? parsedText[6].trim() : '';
  let returnType = parsedText[7] ? ' : ' + parseGenericTypes(parsedText[7]).trim() : '';

  displayText = visibility + methodName + '(' + parameters + ')' + returnType;

  cssStyle = parseClassifier(classifier);

  let member = {
    displayText: displayText,
    cssStyle: cssStyle
  };

  return member;
};

export const buildLegacyDisplay = function(text) {
  // if for some reason we dont have any match, use old format to parse text
  let memberText = '';
  let cssStyle = '';
  let returnType = '';
  let methodStart = text.indexOf('(');
  let methodEnd = text.indexOf(')');

  if (methodStart > 1 && methodEnd > methodStart && methodEnd <= text.length) {
    let parsedText = text.match(/(\+|-|~|#)?(\w+)/);
    let visibility = parsedText[1] ? parsedText[1].trim() : '';
    let methodName = parsedText[2];
    let parameters = text.substring(methodStart + 1, methodEnd);
    let classifier = text.substring(methodEnd, methodEnd + 1);
    cssStyle = parseClassifier(classifier);

    memberText = visibility + methodName + '(' + parseGenericTypes(parameters.trim()) + ')';

    if (methodEnd < memberText.length) {
      returnType = text.substring(methodEnd + 2).trim();
      if (returnType !== '') {
        returnType = ' : ' + parseGenericTypes(returnType);
      }
    }
  } else {
    // finally - if all else fails, just send the text back as written (other than parsing for generic types)
    memberText = parseGenericTypes(text);
  }

  let member = {
    displayText: memberText + returnType,
    cssStyle: cssStyle
  };

  return member;
};

export const parseGenericTypes = function(text) {
  let cleanedText = text;

  if (text.indexOf('~') != -1) {
    cleanedText = cleanedText.replace('~', '<');
    cleanedText = cleanedText.replace('~', '>');

    return parseGenericTypes(cleanedText);
  } else {
    return cleanedText;
  }
};

export const parseMember = function(text) {
  const fieldRegEx = /^(\+|-|~|#)?(\w+)(~\w+~|\[\])?\s+(\w+)$/;
  const methodRegEx = /^(\+|-|~|#)?(\w+)\s?\(\s*(\w+(~\w+~|\[\])?\s*(\w+)?)?\s*\)\s?([*|$])?\s?(\w+(~\w+~|\[\])?)?\s*$/;
  //const methodRegEx = /(\+|-|~|#)?(\w+)\s?\(\s*(\w+(~\w+~|\[\])?\s*(\w+)?)?\s*\)\s?([*|$])?\s?(\w+(~\w+~|\[\])?)?/;

  let fieldMatch = text.match(fieldRegEx);
  let methodMatch = text.match(methodRegEx);

  if (fieldMatch) {
    return buildFieldDisplay(fieldMatch);
  } else if (methodMatch) {
    return buildMethodDisplay(methodMatch);
  } else {
    return buildLegacyDisplay(text);
  }
};

const parseClassifier = function(classifier) {
  switch (classifier) {
    case '*':
      return 'font-style:italic;';
    case '$':
      return 'text-decoration:underline;';
    default:
      return '';
  }
};

export default {
  addTspan,
  buildFieldDisplay,
  buildLegacyDisplay,
  buildMethodDisplay,
  parseGenericTypes,
  parseMember
};
