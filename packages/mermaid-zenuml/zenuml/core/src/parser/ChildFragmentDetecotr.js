import antlr4 from 'antlr4';
import sequenceParserListener from '../generated-parser/sequenceParserListener';

const walker = antlr4.tree.ParseTreeWalker.DEFAULT;

var ChildFragmentDetector = new sequenceParserListener();

var cursor = 0;
var max = 0;

ChildFragmentDetector.enterTcf = function () {
  cursor++;
};
ChildFragmentDetector.enterOpt = function () {
  cursor++;
};
ChildFragmentDetector.enterPar = function () {
  cursor++;
};
ChildFragmentDetector.enterAlt = function () {
  cursor++;
};
ChildFragmentDetector.enterLoop = function () {
  cursor++;
};

ChildFragmentDetector.exitTcf = function () {
  max = Math.max(max, cursor);
  cursor--;
};
ChildFragmentDetector.exitOpt = function () {
  max = Math.max(max, cursor);
  cursor--;
};
ChildFragmentDetector.exitPar = function () {
  max = Math.max(max, cursor);
  cursor--;
};
ChildFragmentDetector.exitAlt = function () {
  max = Math.max(max, cursor);
  cursor--;
};
ChildFragmentDetector.exitLoop = function () {
  max = Math.max(max, cursor);
  cursor--;
};

ChildFragmentDetector.depth = function (me) {
  return function (context) {
    cursor = 0;
    max = 0;
    context.children.map(function (child) {
      walker.walk(me, child);
    });
    return max;
  };
};

export default ChildFragmentDetector;
