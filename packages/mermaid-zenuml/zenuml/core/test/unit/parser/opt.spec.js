const { Fixture } = require('./fixture/Fixture');

test('Empty `opt`', () => {
  let opt = Fixture.firstStatement('opt {}').opt();
  expectText(opt).toBe('opt{}');
  let braceBlock = opt.braceBlock();
  expectText(braceBlock).toBe('{}');
});

function expectText(context) {
  return expect(context.getText());
}
