import { createImperativeState, domain } from './imperativeState.js';

describe('domain.optional', () => {
  it('should set undefined without args', () => {
    expect(domain.optional()).toBeUndefined();
  });

  it('should set identity with args', () => {
    const value = {};
    expect(domain.optional(value)).toEqual(value);
  });
});

describe('domain.identity', () => {
  it('should set identity', () => {
    const value = {};
    expect(domain.identity(value)).toEqual(value);
  });
});

describe('createImperativeState', () => {
  it('should create state with values from initializer', () => {
    const baz = {
      flag: false,
    };

    const state = createImperativeState(() => ({
      foo: domain.optional<number>(),
      bar: domain.identity<string[]>([]),
      baz,
    }));

    expect(state.records.foo).toBeUndefined();
    expect(state.records.bar).toEqual([]);
    expect(state.records.baz).toBe(baz);
  });

  it('should update records', () => {
    const state = createImperativeState(() => ({
      foo: domain.optional<number>(),
      bar: domain.identity<string[]>([]),
      baz: {
        flag: false,
      },
    }));

    state.records.foo = 5;
    state.records.bar = ['hello'];
    state.records.baz.flag = true;

    expect(state.records.foo).toEqual(5);
    expect(state.records.bar).toEqual(['hello']);
    expect(state.records.baz).toEqual({
      flag: true,
    });
  });

  it('should reset records', () => {
    const state = createImperativeState(() => ({
      foo: domain.optional<number>(),
      bar: domain.identity<string[]>([]),
      baz: {
        flag: false,
      },
    }));

    state.records.foo = 5;
    state.records.bar = ['hello'];
    state.records.baz.flag = true;
    state.reset();

    expect(state.records.foo).toBeUndefined();
    expect(state.records.bar).toEqual([]);
    expect(state.records.baz).toEqual({
      flag: false,
    });
  });
});
