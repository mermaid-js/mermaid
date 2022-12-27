import { Fixture } from './fixture/Fixture';

// This spec shows how we get `Origin` from the context.
// A.m1() { B.m2() } => m1 is from `Starter`, m2 is from `A'
// We need the `from` in calculation in:
// 1. Interaction: for interactionWidth, translateX
// 2. Fragments (alt, par, loop): for boundary and offsetX
// 3. Creation: for invocationWidth

describe('Origin Function', () => {
  test('Origin', () => {
    let stat = Fixture.firstStatement('A->B.m1');

    expectText(stat).toBe('A->B.m1');
    expect(stat.Origin()).toBe('A');
  });

  test('Explicit', () => {
    let m1 = Fixture.firstStatement('A->B.m1').message();
    expectText(m1).toBe('A->B.m1');
    expect(Fixture.firstStatement('A->B.m1').Origin()).toBe('A');
  });

  test('Embedded with divider', () => {
    const stat1 = Fixture.firstStatement('A.m1 { \n==x==\n B.m2 }');
    expect(stat1.Origin()).toBe('_STARTER_');
    let m1 = stat1.message();
    // expectText(m1).toBe('A.m1{B.m2}')
    const stat2 = m1.braceBlock().block().stat()[1];
    expect(stat2.Origin()).toBe('A');
    let m2 = stat2.message();
    expectText(m2).toBe('B.m2');
  });

  test('Embedded', () => {
    const stat1 = Fixture.firstStatement('A.m1 { B.m2 }');
    let m1 = stat1.message();
    expect(stat1.Origin()).toBe('_STARTER_');
    expectText(m1).toBe('A.m1{B.m2}');
    const stat2 = m1.braceBlock().block().stat()[0];
    expect(stat2.Origin()).toBe('A');
    let m2 = stat2.message();
    expectText(m2).toBe('B.m2');
  });

  test('Embedded 3-layer', () => {
    const stat1 = Fixture.firstStatement('A.m1 { B.m2 { C.m3 } }');
    let m1 = stat1.message();
    expect(stat1.Origin()).toBe('_STARTER_');
    expectText(m1).toBe('A.m1{B.m2{C.m3}}');
    const stat2 = m1.braceBlock().block().stat()[0];
    expect(stat2.Origin()).toBe('A');
    let m2 = stat2.message();
    expectText(m2).toBe('B.m2{C.m3}');
    const stat3 = m2.braceBlock().block().stat()[0];
    let m3 = stat3.message();
    expectText(m3).toBe('C.m3');
    expect(stat3.Origin()).toBe('B');
  });

  test('Embedded', () => {
    let m1 = Fixture.firstStatement('"A".m1 { B.m2 }').message();
    expectText(m1).toBe('"A".m1{B.m2}');
    let m2 = m1.braceBlock().block().stat()[0].message();
    expectText(m2).toBe('B.m2');
    expect(m1.braceBlock().block().stat()[0].Origin()).toBe('A');
  });

  test('Embedded Self', () => {
    let m1 = Fixture.firstStatement('A.m1 { m2 }').message();
    expectText(m1).toBe('A.m1{m2}');
    let m2 = m1.braceBlock().block().stat()[0].message();
    expectText(m2).toBe('m2');
    expect(m1.braceBlock().block().stat()[0].Origin()).toBe('A');
  });

  test('Embedded creation', () => {
    let creation = Fixture.firstStatement('new A { m2 }').creation();
    expectText(creation).toBe('newA{m2}');
    let m2 = creation.braceBlock().block().stat()[0].message();
    expectText(m2).toBe('m2');
    expect(creation.braceBlock().block().stat()[0].Origin()).toBe('A');
  });

  test('Embedded incomplete creation', () => {
    let creation = Fixture.firstStatement('new { m2 }').creation();
    expectText(creation).toBe('new{m2}'); // invalid code, so
    let m2 = creation.braceBlock().block().stat()[0].message();
    expectText(m2).toBe('m2');
    expect(creation.braceBlock().block().stat()[0].Origin()).toBe('Missing Constructor');
  });

  test('Embedded in if', () => {
    let m1 = Fixture.firstStatement('A.m1 { if(x) { m2 }}').message();
    expectText(m1).toBe('A.m1{if(x){m2}}');
    let alt = m1.braceBlock().block().stat()[0].alt();
    expect(m1.braceBlock().block().stat()[0].Origin()).toBe('A');
    let m2 = alt.ifBlock().braceBlock().block().stat()[0].message();
    expectText(m2).toBe('m2');
    expect(alt.ifBlock().braceBlock().block().stat()[0].Origin()).toBe('A');
  });

  test('Embedded in if at root', () => {
    let alt = Fixture.firstStatement('if(x) { m1 A.m2 }').alt();
    expect(Fixture.firstStatement("Fixture.firstStatement('A->B.m1')").Origin()).toBe('_STARTER_');
    let m1 = alt.ifBlock().braceBlock().block().stat()[0].message();
    expectText(m1).toBe('m1');
    expect(alt.ifBlock().braceBlock().block().stat()[0].Origin()).toBe('_STARTER_');
    let m2 = alt.ifBlock().braceBlock().block().stat()[1].message();
    expectText(m2).toBe('A.m2');
    expect(alt.ifBlock().braceBlock().block().stat()[1].Origin()).toBe('_STARTER_');
  });

  test('Embedded in Self', () => {
    let m1 = Fixture.firstStatement('A.m1 { m2 {m3} }').message();
    expectText(m1).toBe('A.m1{m2{m3}}');
    let m2 = m1.braceBlock().block().stat()[0].message();
    expectText(m2).toBe('m2{m3}');
    let m3 = m2.braceBlock().block().stat()[0].message();
    expectText(m3).toBe('m3');

    expect(m2.braceBlock().block().stat()[0].Origin()).toBe('A');
  });

  test('Embedded in Self with Starter', () => {
    let m1 = Fixture.firstStatement('@Starter(X) m1 { m2 {m3} }').message();
    expectText(m1).toBe('m1{m2{m3}}');
    const m2Stat = m1.braceBlock().block().stat()[0];
    let m2 = m2Stat.message();
    expectText(m2Stat).toBe('m2{m3}');
    expect(m2Stat.Origin()).toBe('X');
    let m3 = m2.braceBlock().block().stat()[0].message();
    expectText(m3).toBe('m3');

    expect(m2.braceBlock().block().stat()[0].Origin()).toBe('X');
  });

  test('root with default _STARTER_', () => {
    expectText(Fixture.firstStatement('A.m1').message()).toBe('A.m1');
    expect(Fixture.firstStatement('A.m1').Origin()).toBe('_STARTER_');
  });
  test('root with explicit Starter', () => {
    let message = Fixture.firstStatement('@Starter(X)\nA.m1').message();
    expectText(message).toBe('A.m1');
    expect(Fixture.firstStatement('@Starter(X)\nA.m1').Origin()).toBe('X');
  });
});

function expectText(context) {
  return expect(context.getText());
}
