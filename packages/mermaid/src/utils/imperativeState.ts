export const createImperativeState = <S extends Record<string, unknown>>(init: () => S) => {
  const state = init();

  return {
    get records() {
      return state;
    },
    reset: () => {
      Object.keys(state).forEach((key) => {
        delete state[key];
      });
      Object.entries(init()).forEach(([key, value]: [keyof S, any]) => {
        state[key] = value;
      });
    },
  };
};

export const domain = {
  optional: <V>(value?: V) => value,
  identity: <V>(value: V) => value,
} as const;

/*
const state = createImperativeState(() => ({
  foo: domain.optional<string>(),
  bar: domain.identity<number[]>([]),
  baz: domain.optional(1),
}));

typeof state.records:
{
  foo: string | undefined, // actual: undefined
  bar: number[],           // actual: []
  baz: number | undefined, // actual: 1
}
*/
