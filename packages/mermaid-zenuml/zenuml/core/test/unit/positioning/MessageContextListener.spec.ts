import { MessageContextListener } from '../../../src/positioning/MessageContextListener';
let seqDsl = require('../../../src/parser/index');
const antlr4 = require('antlr4').default;

describe('MessageListener', () => {
  it('can handle Message and Creation', () => {
    const code = `
    A.method(E.m) {
      B->C.method
    }
    new B
    C->D: message
    `;
    let rootContext = seqDsl.RootContext(code);
    const walker = antlr4.tree.ParseTreeWalker.DEFAULT;

    const messageContextListener = new MessageContextListener();
    walker.walk(messageContextListener, rootContext);

    expect(messageContextListener.result()).toStrictEqual([
      {
        from: '_STARTER_',
        signature: 'method(E.m)',
        to: 'A',
        type: 0,
      },
      {
        from: 'B',
        signature: 'method',
        to: 'C',
        type: 0,
      },
      {
        from: '_STARTER_',
        signature: '«create»',
        to: 'B',
        type: 2,
      },
      {
        from: 'C',
        signature: ' message',
        to: 'D',
        type: 1,
      },
    ]);
  });

  it('ignores expression in parameters', () => {
    const code = `A.m(new B,
     C.m)`;
    let rootContext = seqDsl.RootContext(code);
    const walker = antlr4.tree.ParseTreeWalker.DEFAULT;

    const messageContextListener = new MessageContextListener();
    walker.walk(messageContextListener, rootContext);

    expect(messageContextListener.result()).toStrictEqual([
      {
        from: '_STARTER_',
        signature: 'm(new B,C.m)',
        to: 'A',
        type: 0,
      },
    ]);
  });

  it('ignores expression in conditions', () => {
    const code = `if(A.isGood()) {B.m}`;
    let rootContext = seqDsl.RootContext(code);
    const walker = antlr4.tree.ParseTreeWalker.DEFAULT;

    const messageContextListener = new MessageContextListener();
    walker.walk(messageContextListener, rootContext);

    expect(messageContextListener.result()).toStrictEqual([
      {
        from: '_STARTER_',
        signature: 'm',
        to: 'B',
        type: 0,
      },
    ]);
  });
});
