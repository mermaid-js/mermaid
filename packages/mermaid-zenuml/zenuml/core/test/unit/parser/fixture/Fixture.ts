import { WidthFunc } from '@/positioning/Coordinate';

let seqDsl = require('../../../../src/parser/index');

export class Fixture {
  static firstStatement(code: string) {
    let rootContext = seqDsl.RootContext(code);
    return rootContext.block().stat()[0];
  }

  static firstChild(code: string) {
    return Fixture.firstStatement(code).children[0].braceBlock().block().stat()[0];
  }

  static firstGrandChild(code: string) {
    return Fixture.firstChild(code).children[0].braceBlock().block().stat()[0];
  }
}

export let stubWidthProvider: WidthFunc = (text, _) => {
  const number = parseInt(text.trim().substring(1) || '0');

  return isNaN(number) ? 0 : number;
};
