import { describe, expect, it } from 'vitest';

import { expectNoErrorsOrAlternatives, wardleyParse as parse } from './test-util.js';

describe('wardley', () => {
  it('parses an empty wardley map', () => {
    const result = parse('wardley-beta\n');
    expectNoErrorsOrAlternatives(result);
  });

  it.each([
    ['build', 'build'],
    ['buy', 'buy'],
    ['outsource', 'outsource'],
    ['market', 'market'],
    ['ecosystem', 'ecosystem'],
  ])('parses (%s) sourcing strategy decorator', (decorator, expected) => {
    const result = parse(`wardley-beta
component Foo [0.5, 0.5] (${decorator})
`);
    expectNoErrorsOrAlternatives(result);
    const component = result.value.components[0];
    expect(component.name).toBe('Foo');
    expect(component.decorator?.strategy).toBe(expected);
  });

  it('parses multiple components with mixed strategies', () => {
    const result = parse(`wardley-beta
component A [0.1, 0.2] (build)
component B [0.3, 0.4] (buy)
component C [0.5, 0.6] (outsource)
component D [0.7, 0.8] (market)
component E [0.9, 0.95] (ecosystem)
`);
    expectNoErrorsOrAlternatives(result);
    const strategies = result.value.components.map((c) => c.decorator?.strategy);
    expect(strategies).toEqual(['build', 'buy', 'outsource', 'market', 'ecosystem']);
  });

  it('rejects an unknown strategy decorator', () => {
    const result = parse(`wardley-beta
component Foo [0.5, 0.5] (banana)
`);
    expect(result.lexerErrors.length + result.parserErrors.length).toBeGreaterThan(0);
  });

  it.each(['pioneers', 'settlers', 'townplanners', 'explorers', 'villagers'])(
    'parses %s attitude zone',
    (kind) => {
      const result = parse(`wardley-beta
${kind} [0.9, 0.1, 0.7, 0.3]
`);
      expectNoErrorsOrAlternatives(result);
      const attitude = result.value.attitudes[0];
      expect(attitude.kind).toBe(kind);
      expect(attitude.visibility).toBeCloseTo(0.9);
      expect(attitude.evolution).toBeCloseTo(0.1);
      expect(attitude.visibility2).toBeCloseTo(0.7);
      expect(attitude.evolution2).toBeCloseTo(0.3);
    }
  );

  it('parses multiple attitude zones in one map', () => {
    const result = parse(`wardley-beta
pioneers [0.9, 0.1, 0.7, 0.3]
settlers [0.7, 0.4, 0.5, 0.6]
townplanners [0.5, 0.7, 0.3, 0.95]
`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.attitudes.map((a) => a.kind)).toEqual([
      'pioneers',
      'settlers',
      'townplanners',
    ]);
  });

  it('accepts attitude corners in reverse order', () => {
    const result = parse(`wardley-beta
pioneers [0.7, 0.3, 0.9, 0.1]
`);
    expectNoErrorsOrAlternatives(result);
    const attitude = result.value.attitudes[0];
    expect(attitude.visibility).toBeCloseTo(0.7);
    expect(attitude.evolution).toBeCloseTo(0.3);
    expect(attitude.visibility2).toBeCloseTo(0.9);
    expect(attitude.evolution2).toBeCloseTo(0.1);
  });

  it.each([
    ['three numbers', 'pioneers [0.9, 0.1, 0.7]'],
    ['five numbers', 'pioneers [0.9, 0.1, 0.7, 0.3, 0.5]'],
    ['no brackets', 'pioneers 0.9 0.1 0.7 0.3'],
  ])('rejects malformed attitude (%s)', (_label, line) => {
    const result = parse(`wardley-beta\n${line}\n`);
    expect(result.lexerErrors.length + result.parserErrors.length).toBeGreaterThan(0);
  });

  // Strategy and attitude words are only keywords where the syntax expects them:
  // inside a decorator, or at the start of a four-value attitude line. Elsewhere
  // they are ordinary words, so names that are, start with, or begin with one
  // of them keep parsing.
  it.each([
    'build',
    'builder',
    'buy',
    'buyer',
    'outsourced',
    'market research',
    'ecosystem',
    'ecosystems',
    'ecosystem services',
    'pioneers',
    'explorers',
    'settlers app',
    'townplanners guild',
    'villagers',
  ])('parses %s as a name', (name) => {
    const result = parse(`wardley-beta
anchor ${name} [0.9, 0.5]
component ${name} [0.5, 0.5]
component Other [0.4, 0.4] (ecosystem)
${name} -> Other
Other -> ${name}
evolve ${name} 0.8
accelerator ${name} [0.3, 0.3]
pipeline ${name} {
  component ${name} [0.6]
}
pioneers [0.9, 0.05, 0.5, 0.3]
`);
    expectNoErrorsOrAlternatives(result);
    const { value } = result;
    expect(value.anchors.map((a) => a.name)).toEqual([name]);
    expect(value.components.map((c) => c.name)).toEqual([name, 'Other']);
    expect(value.components.map((c) => c.decorator?.strategy)).toEqual([undefined, 'ecosystem']);
    expect(value.links.map((l) => [l.from, l.to])).toEqual([
      [name, 'Other'],
      ['Other', name],
    ]);
    expect(value.evolves.map((e) => e.component)).toEqual([name]);
    expect(value.accelerators.map((a) => a.name)).toEqual([name]);
    expect(value.pipelines.map((p) => p.parent)).toEqual([name]);
    expect(value.pipelines[0].components.map((c) => c.name)).toEqual([name]);
    expect(value.attitudes.map((a) => a.kind)).toEqual(['pioneers']);
  });

  it('parses a strategy decorator with spaces inside the parentheses', () => {
    const result = parse(`wardley-beta
component Foo [0.5, 0.5] ( market )
`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.components[0].decorator?.strategy).toBe('market');
  });
});
