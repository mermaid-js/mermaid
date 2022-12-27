import sequenceParser from '../../generated-parser/sequenceParser';

const seqParser = sequenceParser;
const DividerContext = seqParser.DividerContext;

// @ts-ignore
DividerContext.prototype.Note = function () {
  // @ts-ignore
  let formattedText = this.dividerNote()?.getFormattedText().trim();
  // throw error if formattedText does not start with '=='
  if (!formattedText.startsWith('==')) {
    throw new Error('Divider note must start with ==');
  }
  // trim leading and trailing '=' characters
  return formattedText?.replace(/^=+|=+$/g, '');
};
