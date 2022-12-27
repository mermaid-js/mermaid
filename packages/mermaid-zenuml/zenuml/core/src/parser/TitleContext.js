const sequenceParser = require('../generated-parser/sequenceParser').default;

const seqParser = sequenceParser;
const TitleContext = seqParser.TitleContext;
TitleContext.prototype.content = function () {
  if (this.children.length < 2) {
    return 'Untiled';
  } else {
    return this.children[1].getText().trim();
  }
};
