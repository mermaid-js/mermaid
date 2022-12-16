const { Fixture } = require('./fixture/Fixture');

describe('isCurrent', () => {
  it.each([
    [-1, false],
    [0, true],
    [9, true], // after ')'
    [10, false], // after ') '
    [12, false], // after 'B'
  ])('Creation: when cursor is at %s, isCurrent = %s', (cursor, expectedIsCurrent) => {
    const code = 'a=new A() {B.m}';
    const stat = Fixture.firstStatement(code);
    const creation = stat.creation();
    expect(creation.isCurrent(cursor)).toBe(expectedIsCurrent);
  });

  it.each([
    [-1, false],
    [0, true],
    [1, true],
    [8, true],
    [9, false],
    [10, false],
  ])('Message: when cursor is at %s, isCurrent = %s', (cursor, expectedIsCurrent) => {
    const code = 'A.m(1,2)';
    const stat = Fixture.firstStatement(code);
    const message = stat.message();
    expect(message.isCurrent(cursor)).toBe(expectedIsCurrent);
  });

  it('Do not throw error', () => {
    const code = 'A.m { /\n m1 }';
    const message = Fixture.firstStatement(code).children[0];
    expect(message.isCurrent(1)).toBe(true);
    expect(message.isCurrent(4)).toBe(false);
  });
});
