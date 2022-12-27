const antlr4 = require('antlr4').default;

antlr4.ParserRuleContext.prototype.Key = function () {
  return `${this.start.start}:${this.stop.stop}`;
};
