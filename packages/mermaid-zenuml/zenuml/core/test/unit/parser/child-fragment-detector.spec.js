let seqDsl = require('../../../src/parser/index');

function getDepth(code) {
  let rootContext = seqDsl.RootContext(code);
  return seqDsl.Depth(rootContext);
}

test('get depth 0', () => {
  let depth = getDepth('//C1\n//C2\nA.method()');
  expect(depth).toBe(0);
});

describe('Depth 1', () => {
  test.each([
    ['if(x) {A.m}'],
    ['loop(x) {A.m}'],
    ['par {A.m}'],
    ['opt {A.m}'],
    ['A.method() { if (c1) { B.m() }}'],
  ])(`%s`, (code) => {
    let depth = getDepth(code);
    expect(depth).toBe(1);
  });
});

test('get depth 2', () => {
  let depth = getDepth('A.method() { if (c1) { if (c2) { B.m() }}}');
  expect(depth).toBe(2);
});

test('get depth 2 while / if', () => {
  let depth = getDepth('A.method() { while (c1) { if (c2) { B.m() }}}');
  expect(depth).toBe(2);
});

test('get depth 2 if / while', () => {
  let depth = getDepth('A.method() { if (c1) { while (c2) { B.m() }}}');
  expect(depth).toBe(2);
});

test('get depth 3 if / while / par', () => {
  let depth = getDepth('A.method() { if (c1) { while (c2) { B.m() par { C.m } }}}');
  expect(depth).toBe(3);
});
