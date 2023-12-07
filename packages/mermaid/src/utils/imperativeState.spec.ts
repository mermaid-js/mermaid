import { ImperativeState } from './imperativeState.js';

describe('createImperativeState', () => {
  it('should create state with values from initializer', () => {
    const baz = {
      flag: false,
    };

    const state = new ImperativeState(() => ({
      foo: undefined as number | undefined,
      bar: [] as string[],
      baz,
    }));

    expect(state.records.foo).toBeUndefined();
    expect(state.records.bar).toEqual([]);
    expect(state.records.baz).toBe(baz);
  });

  it('should update records', () => {
    const state = new ImperativeState(() => ({
      foo: undefined as number | undefined,
      bar: [] as string[],
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
    const state = new ImperativeState(() => ({
      foo: undefined as number | undefined,
      bar: [] as string[],
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
