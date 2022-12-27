import { default as antlr4 } from 'antlr4';

antlr4.ParserRuleContext.prototype.Key = function () {
  return `${this.start.start}:${this.stop.stop}`;
};
